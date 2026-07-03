import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url) return NextResponse.json({ error: 'Falta URL' }, { status: 400 })

    const pageRes = await fetch(url, {
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
      .slice(0, 6000)

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Analiza el contenido de esta página web y genera entre 3 y 6 preguntas frecuentes que los usuarios podrían tener sobre este tema. Las preguntas deben ser específicas, útiles y en español latinoamericano.

CONTENIDO DE LA PÁGINA:
${cleanText}

INSTRUCCIONES:
- Genera preguntas que un usuario real haría
- Cada pregunta debe poder responderse con la información de la página
- NO generes preguntas sobre fechas, eventos específicos o información que pueda expirar
- Formato: una pregunta por línea, comenzando con signo de interrogación
- Responde ÚNICAMENTE con las preguntas, sin numeración, sin explicaciones`,
        }],
      }),
    })

    const claudeData = await claudeRes.json()
    const text = claudeData.content?.[0]?.text ?? ''
    const questions = text
      .split('\n')
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0 && q.includes('?'))

    return NextResponse.json({ questions })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
