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

function parseTranscript(vtt: string): { time: number; text: string }[] {
  const lines = vtt.split('\n')
  const entries: { time: number; text: string }[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (line.includes('-->')) {
      const startTime = line.split('-->')[0].trim()
      const parts = startTime.split(':')
      let time = 0
      if (parts.length === 3) time = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2])
      else time = parseInt(parts[0]) * 60 + parseFloat(parts[1])
      const textLines: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== '') { textLines.push(lines[i].trim()); i++ }
      const text = textLines.join(' ').replace(/<[^>]*>/g, '')
      if (text) entries.push({ time, text })
    }
    i++
  }
  return entries
}

async function getVimeoThumbnailAtTime(vimeoId: string, timestamp: number): Promise<string | null> {
  try {
    const res = await fetch(`https://api.vimeo.com/videos/${vimeoId}/pictures`, {
      headers: {
        Authorization: `Bearer ${process.env.VIMEO_TOKEN}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    })
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

export async function POST(req: NextRequest) {
  try {
    const { video_id, questions, category_id, category_name, section_id, section_name, label_names } = await req.json()

    if (!video_id || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const { data: video, error: videoError } = await supabaseAdmin
      .from('vimeo_videos')
      .select('*')
      .eq('id', video_id)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })
    }

    const vimeoIdMatch = video.vimeo_url?.match(/vimeo\.com\/(\d+)/)
    const vimeoId = vimeoIdMatch?.[1] ?? ''

    let transcript = video.transcript ?? ''
    if (!transcript && vimeoId) {
      const res = await fetch(`https://api.vimeo.com/videos/${vimeoId}/texttracks`, {
        headers: {
          Authorization: `Bearer ${process.env.VIMEO_TOKEN}`,
          Accept: 'application/vnd.vimeo.*+json;version=3.4',
        },
      })
      if (res.ok) {
        const data = await res.json()
        const track = data.data?.[0]
        if (track?.link) {
          const trackRes = await fetch(track.link)
          if (trackRes.ok) transcript = await trackRes.text()
        }
      }
    }

    const transcriptEntries = transcript ? parseTranscript(transcript) : []
    const transcriptText = transcriptEntries.map(e => `[${Math.floor(e.time)}s] ${e.text}`).join('\n')

    const created = []

    for (const question of questions) {
      const otherQuestions = questions.filter((q: string) => q !== question)

      const timestampRes = await fetch('https://api.anthropic.com/v1/messages', {
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
            content: `Del siguiente video tutorial, identifica los timestamps más relevantes para responder la pregunta: "${question}"

TRANSCRIPCIÓN:
${transcriptText.slice(0, 4000)}

Responde en JSON con este formato:
{
  "timestamps": [
    {"time": segundos, "description": "qué se muestra en este momento"},
    {"time": segundos, "description": "qué se muestra en este momento"}
  ]
}

Máximo 4 timestamps. Si no hay momentos relevantes, devuelve timestamps vacío.
Responde ÚNICAMENTE con el JSON.`,
          }],
        }),
      })

      const timestampData = await timestampRes.json()
      let timestamps: { time: number; description: string }[] = []
      try {
        const parsed = JSON.parse(timestampData.content?.[0]?.text ?? '{}')
        timestamps = parsed.timestamps ?? []
      } catch {}

      const screenshots: { description: string; url: string }[] = []
      for (const ts of timestamps.slice(0, 4)) {
        const thumbnail = await getVimeoThumbnailAtTime(vimeoId, ts.time)
        if (thumbnail) {
          screenshots.push({ description: ts.description, url: thumbnail })
        }
      }

      const screenshotsText = screenshots.length > 0
        ? `IMÁGENES DEL VIDEO (incluye cada imagen después del paso que corresponde):
${screenshots.map(s => `- "${s.description}": <img src="${s.url}" alt="${s.description}" style="max-width:100%; border-radius:8px; margin:12px 0; border: 1px solid #e5e7eb;">`).join('\n')}`
        : ''

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

Tu tarea es crear un artículo respondiendo ÚNICAMENTE la siguiente pregunta basándote en la transcripción del video:
"${question}"

OTROS ARTÍCULOS QUE SE CREARÁN (NO incluyas información de estos temas):
${otherQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

TRANSCRIPCIÓN DEL VIDEO "${video.title}":
${transcriptText.slice(0, 4000)}

${screenshotsText}

INSTRUCCIONES:
- Responde únicamente la pregunta: "${question}"
- Basa el contenido en la transcripción del video
- NO incluyas información de las otras preguntas listadas
- Escribe en español latinoamericano, tono amigable y claro
- Usa <ol> para pasos numerados
- Incluye cada imagen inmediatamente después del paso que ilustra
- NUNCA incluyas ejemplos con fechas, nombres de eventos específicos o información que pueda expirar
- NO incluyas el título en el HTML
- Responde ÚNICAMENTE con HTML puro, sin markdown, sin \`\`\``,
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
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error || !article) continue

      await supabaseAdmin
        .from('article_vimeo_videos')
        .insert({ article_id: article.id, vimeo_video_id: video_id })

      created.push({ id: article.id, title: question, screenshots: screenshots.length })
    }

    await supabaseAdmin
      .from('vimeo_videos')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', video_id)

    return NextResponse.json({ ok: true, created })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
