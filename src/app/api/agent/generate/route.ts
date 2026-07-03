import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 300

function cleanHtml(text: string): string {
  return text
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    const { url, questions, category_id, category_name, section_id, section_name, label_names } = await req.json()

    if (!url || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ADIPA-Bot/1.0)' },
    })

    if (!pageRes.ok) {
      return NextResponse.json({ error: `No se pudo leer la URL: ${pageRes.status}` }, { status: 400 })
    }

    const html = await pageRes.text()

    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    const links: { text: string; href: string }[] = []
    let linkMatch
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const href = linkMatch[1]
      const text = linkMatch[2].replace(/<[^>]+>/g, '').trim()
      if (text && href && !href.startsWith('#') && !href.startsWith('javascript') && !href.includes('zendesk.com')) {
        const fullHref = href.startsWith('http') ? href : `${new URL(url).origin}${href}`
        links.push({ text, href: fullHref })
      }
    }

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

    const filteredLinks = links
      .filter(l => !l.href.includes('zendesk.com'))
      .slice(0, 30)

    const linksText = filteredLinks.map(l => `- "${l.text}" → ${l.href}`).join('\n')

    const created = []

    let { data: sourceUrl } = await supabaseAdmin
      .from('source_urls')
      .select('id')
      .eq('url', url)
      .single()

    if (!sourceUrl) {
      const { data: newSourceUrl } = await supabaseAdmin
        .from('source_urls')
        .insert({ url, name: url, description: '' })
        .select()
        .single()
      sourceUrl = newSourceUrl
    }

    for (const question of questions) {
      const otherQuestions = questions.filter((q: string) => q !== question)

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
          messages: [{
            role: 'user',
            content: `Eres un redactor experto de artículos de centro de ayuda para ADIPA, una plataforma de educación online en Latinoamérica.

Tu tarea es crear un artículo nuevo respondiendo ÚNICAMENTE la siguiente pregunta:
"${question}"

OTROS ARTÍCULOS QUE SE CREARÁN A PARTIR DE LA MISMA URL (NO incluyas información de estos temas):
${otherQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

CONTENIDO DE LA PÁGINA DE REFERENCIA (${url}):
${cleanText}

LINKS DISPONIBLES EN LA PÁGINA:
${linksText}

INSTRUCCIONES:
- Responde únicamente la pregunta: "${question}"
- NO incluyas información que corresponda a las otras preguntas listadas arriba
- Escribe en español latinoamericano, tono amigable y claro
- Usa formato HTML con <p>, <strong>, <ul>, <li>, <ol> según corresponda
- Si hay pasos a seguir, usa una lista numerada <ol>
- Cuando hagas referencia a algo de la página, incluye el hipervínculo usando <a href="URL">texto</a>
- NUNCA incluyas links que contengan "zendesk.com"
- NUNCA incluyas ejemplos con fechas específicas, nombres de eventos, precios puntuales o información que pueda expirar. Describe los procesos de forma genérica.
- No incluyas imágenes
- NO incluyas el título en el HTML
- Responde ÚNICAMENTE con HTML puro, sin bloques de código, sin markdown, sin \`\`\``,
          }],
        }),
      })

      const claudeData = await claudeRes.json()
      const rawBody = claudeData.content?.[0]?.text ?? ''
      const body = cleanHtml(rawBody)

      const { data: article, error } = await supabaseAdmin
        .from('articles')
        .insert({
          title: question,
          body,
          category_id: category_id || null,
          category_name: category_name || '',
          section_id: section_id || null,
          section_name: section_name || '',
          label_names: label_names ?? [],
          promoted: false,
          draft: false,
          status: 'pending_review',
          source_urls: [url],
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error || !article) continue

      if (sourceUrl) {
        await supabaseAdmin
          .from('article_source_urls')
          .insert({ article_id: article.id, source_url_id: sourceUrl.id })
      }

      created.push({ id: article.id, title: question })
    }

    return NextResponse.json({ ok: true, created })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
