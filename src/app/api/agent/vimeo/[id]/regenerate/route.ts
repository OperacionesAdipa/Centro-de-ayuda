import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 300

function parseVttTimestamp(timestamp: string): number {
  const parts = timestamp.split(':')
  if (parts.length === 3) {
    const [h, m, s] = parts
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s)
  }
  const [m, s] = parts
  return parseInt(m) * 60 + parseFloat(s)
}

function parseTranscript(vtt: string): { time: number; text: string }[] {
  const lines = vtt.split('\n')
  const entries: { time: number; text: string }[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    if (line.includes('-->')) {
      const startTime = line.split('-->')[0].trim()
      const time = parseVttTimestamp(startTime)
      const textLines: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i].trim())
        i++
      }
      const text = textLines.join(' ').replace(/<[^>]*>/g, '')
      if (text) entries.push({ time, text })
    }
    i++
  }

  return entries
}

async function getVimeoThumbnail(vimeoId: string, timestamp: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.vimeo.com/videos/${vimeoId}/pictures`,
      {
        headers: {
          Authorization: `Bearer ${process.env.VIMEO_TOKEN}`,
          Accept: 'application/vnd.vimeo.*+json;version=3.4',
        },
      }
    )

    if (!res.ok) return null
    const data = await res.json()
    const picture = data.data?.[0]
    if (!picture) return null

    const sizes = picture.sizes ?? []
    const large = sizes.find((s: any) => s.width >= 1280) ?? sizes[sizes.length - 1]
    return large?.link ?? null
  } catch {
    return null
  }
}

function cleanHtml(text: string): string {
  return text
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const videoId = parseInt(params.id)

    const { data: video, error: videoError } = await supabaseAdmin
      .from('vimeo_videos')
      .select('*')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })
    }

    const vimeoIdMatch = video.vimeo_url?.match(/vimeo\.com\/(\d+)/)
    const vimeoId = vimeoIdMatch?.[1]
    if (!vimeoId) {
      return NextResponse.json({ error: 'ID de Vimeo inválido' }, { status: 400 })
    }

    const transcriptEntries = video.transcript ? parseTranscript(video.transcript) : []
    const transcriptText = transcriptEntries.map(e => `[${Math.floor(e.time)}s] ${e.text}`).join('\n')

    const { data: articleVideoData } = await supabaseAdmin
      .from('article_vimeo_videos')
      .select('article_id')
      .eq('vimeo_video_id', videoId)

    const articleIds = (articleVideoData ?? []).map((r: any) => r.article_id)

    if (articleIds.length === 0) {
      return NextResponse.json({ error: 'No hay artículos asociados a este video' }, { status: 400 })
    }

    const { data: articles } = await supabaseAdmin
      .from('articles')
      .select('*')
      .in('id', articleIds)

    const allArticleTitles = (articles ?? []).map((a: any) => a.title)
    const results = []

    for (const article of articles ?? []) {
      const otherArticleTitles = allArticleTitles.filter((t: string) => t !== article.title)

      const timestampRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: `De esta transcripción de video, identifica el timestamp (en segundos) más relevante para ilustrar el artículo "${article.title}".

Transcripción:
${transcriptText.slice(0, 3000)}

Responde ÚNICAMENTE con un número entero (los segundos), por ejemplo: 45
Si no hay un momento relevante, responde: 0`,
          }],
        }),
      })

      const timestampData = await timestampRes.json()
      const timestamp = parseInt(timestampData.content?.[0]?.text?.trim() ?? '0') || 0

      const thumbnail = await getVimeoThumbnail(vimeoId, timestamp)

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

Tu tarea es crear un artículo paso a paso respondiendo ÚNICAMENTE la pregunta del título, basándote en la transcripción del video tutorial.

ARTÍCULO A ACTUALIZAR:
Título: ${article.title}
Contenido actual:
${article.body?.replace(/<[^>]*>/g, ' ').slice(0, 1000)}

OTROS ARTÍCULOS RELACIONADOS A ESTE VIDEO (NO incluyas información de estos temas):
${otherArticleTitles.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}

TRANSCRIPCIÓN DEL VIDEO TUTORIAL:
${transcriptText.slice(0, 4000)}

${thumbnail ? `IMAGEN DEL VIDEO (úsala para ilustrar el paso más importante):
<img src="${thumbnail}" alt="Captura del videotutorial" style="max-width:100%; border-radius:8px; margin:12px 0; border: 1px solid #e5e7eb;">` : ''}

INSTRUCCIONES:
- Responde únicamente la pregunta: "${article.title}"
- NO incluyas información que corresponda a los otros artículos listados arriba
- Escribe en español latinoamericano, tono amigable y claro
- Usa una lista numerada <ol> para los pasos del tutorial
- Incluye la imagen del video en el paso más relevante
- Basa el contenido en la transcripción del video
- NO incluyas el título en el HTML
- Responde ÚNICAMENTE con HTML puro, sin bloques de código, sin markdown, sin \`\`\``,
          }],
        }),
      })

      const claudeData = await claudeRes.json()
      const rawBody = claudeData.content?.[0]?.text ?? article.body
      const newBody = cleanHtml(rawBody)

      await supabaseAdmin
        .from('articles')
        .update({
          body: newBody,
          status: 'pending_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id)

      results.push({ id: article.id, title: article.title, thumbnail: !!thumbnail, timestamp })
    }

    await supabaseAdmin
      .from('vimeo_videos')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', videoId)

    return NextResponse.json({ ok: true, updated: results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
