import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    const results = []

    for (const article of articles ?? []) {
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
              content: `Eres un redactor de artículos de centro de ayuda para ADIPA, una plataforma de educación online.

Tienes el siguiente artículo existente:
TÍTULO: ${article.title}
CONTENIDO ACTUAL:
${article.body?.replace(/<[^>]*>/g, ' ').slice(0, 2000)}

Y el contenido actualizado de la página de referencia:
${cleanText}

Tu tarea es reescribir el artículo en HTML manteniendo:
- El mismo título
- El mismo estilo y tono amigable
- Formato HTML con párrafos <p>, negritas <strong>, listas <ul><li>, etc.
- Información actualizada basada en el contenido de la página
- Instrucciones claras paso a paso si corresponde

Responde ÚNICAMENTE con el HTML del contenido del artículo, sin título, sin explicaciones, sin markdown.`,
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
