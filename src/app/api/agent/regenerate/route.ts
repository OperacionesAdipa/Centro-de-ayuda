import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 300

async function takeScreenshot(url: string, selector?: string): Promise<string | null> {
  try {
    const browserlessKey = process.env.BROWSERLESS_API_KEY
    if (!browserlessKey) return null

    const body: any = {
      url,
      options: {
        fullPage: false,
        type: 'jpeg',
        quality: 80,
      },
    }

    if (selector) {
      body.selector = selector
    } else {
      body.options.fullPage = true
    }

    const res = await fetch(`https://chrome.browserless.io/screenshot?token=${browserlessKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) return null

    const buffer = await res.arrayBuffer()
    const fileName = `screenshot-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

    const { error } = await supabaseAdmin.storage
      .from('article-images')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })

    if (error) return null

    const { data } = supabaseAdmin.storage
      .from('article-images')
      .getPublicUrl(fileName)

    return data.publicUrl
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url_id } = await req.json()

    if (!url_id) {
      return NextResponse.json({ error: 'Falta url_id' }, { status: 400 })
    }

    const { data: urlData, error: urlError } = await supabaseAdmin
      .from('source_urls')
      .select('*')
      .eq('id', url_id)
      .single()

    if (urlError || !urlData) {
      return NextResponse.json({ error: 'URL no encontrada' }, { status: 404 })
    }

    const pageRes = await fetch(urlData.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ADIPA-Bot/1.0)' },
    })

    if (!pageRes.ok) {
      return NextResponse.json({ error: `No se pudo leer la URL: ${pageRes.status}` }, { status: 400 })
    }

    const html = await pageRes.text()
    const cleanText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)

    const { data: articleUrlData } = await supabaseAdmin
      .from('article_source_urls')
      .select('article_id')
      .eq('source_url_id', url_id)

    const articleIds = (articleUrlData ?? []).map((r: any) => r.article_id)

    if (articleIds.length === 0) {
      return NextResponse.json({ error: 'No hay artículos asociados a esta URL' }, { status: 400 })
    }

    const { data: articles } = await supabaseAdmin
      .from('articles')
      .select('*')
      .in('id', articleIds)

    const allArticleTitles = (articles ?? []).map((a: any) => a.title)

    const screenshot = await takeScreenshot(urlData.url)

    const results = []

    for (const article of articles ?? []) {
      const otherArticleTitles = allArticleTitles.filter((t: string) => t !== article.title)

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: `Eres un redactor experto de artículos de centro de ayuda para ADIPA, una plataforma de educación online en Latinoamérica.

Tu tarea es actualizar el siguiente artículo respondiendo ÚNICAMENTE la pregunta del título. No incluyas información que corresponda a otros artículos relacionados.

ARTÍCULO A ACTUALIZAR:
Título: ${article.title}
Contenido actual:
${article.body?.replace(/<[^>]*>/g, ' ').slice(0, 1500)}

OTROS ARTÍCULOS RELACIONADOS A ESTA MISMA URL (NO incluyas información de estos temas):
${otherArticleTitles.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}

CONTENIDO ACTUALIZADO DE LA PÁGINA DE REFERENCIA:
${cleanText}

${screenshot ? `CAPTURA DE PANTALLA DE LA PÁGINA:
Incluye esta imagen donde sea relevante: <img src="${screenshot}" alt="Captura de pantalla" style="max-width:100%; border-radius:8px; margin:12px 0;">` : ''}

INSTRUCCIONES:
- Responde únicamente la pregunta: "${article.title}"
- NO incluyas información que corresponda a los otros artículos listados arriba
- Escribe en español, tono amigable y claro
- Usa formato HTML con <p>, <strong>, <ul>, <li>, <ol> según corresponda
- Si hay pasos a seguir, usa una lista numerada <ol>
- Incluye la imagen capturada donde sea más relevante para ilustrar el proceso
- Mantén el artículo conciso y al punto
- NO incluyas el título en el HTML, solo el contenido

Responde ÚNICAMENTE con el HTML del contenido, sin explicaciones ni markdown.`,
            },
          ],
        }),
      })

      const claudeData = await claudeRes.json()
      const newBody = claudeData.content?.[0]?.text ?? article.body

      await supabaseAdmin
        .from('articles')
        .update({
          body: newBody,
          status: 'pending_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id)

      results.push({ id: article.id, title: article.title })
    }

    await supabaseAdmin
      .from('source_urls')
      .update({ last_fetched_at: new Date().toISOString() })
      .eq('id', url_id)

    return NextResponse.json({ ok: true, updated: results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
