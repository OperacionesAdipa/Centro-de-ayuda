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

async function takeVimeoScreenshot(vimeoId: string, timestamp: number, description: string): Promise<string | null> {
  try {
    const createRes = await fetch(`https://api.vimeo.com/videos/${vimeoId}/pictures`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VIMEO_TOKEN}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ time: Math.floor(timestamp), active: false }),
    })

    if (!createRes.ok) return null

    const pictureData = await createRes.json()
    const sizes = pictureData.sizes ?? []
    const largest = sizes.find((s: any) => s.width >= 1280) ?? sizes[sizes.length - 1]
    const imageUrl = largest?.link ?? null

    if (!imageUrl) return null

    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) return null

    const buffer = await imgRes.arrayBuffer()
    const fileName = `vimeo-${vimeoId}-${Math.floor(timestamp)}-${Math.random().toString(36).slice(2)}.jpg`

    const { error } = await supabaseAdmin.storage
      .from('article-images')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })

    if (error) return null

    const { data } = supabaseAdmin.storage.from('article-images').getPublicUrl(fileName)
    return data.publicUrl
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
          if (trackRes.ok) {
            transcript = await trackRes.text()
            await supabaseAdmin.from('vimeo_videos').update({ transcript }).eq('id', video_id)
          }
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
          max_tokens: 600,
          messages: [{
            role: 'user',
            content: `Analiza esta transcripción de video tutorial e identifica los timestamps exactos donde se muestra visualmente cada paso para responder la pregunta: "${question}"

TRANSCRIPCIÓN CON TIMESTAMPS:
${transcriptText.slice(0, 5000)}

Responde en JSON:
{
  "steps": [
    {
      "description": "descripción breve del paso",
      "timestamp": segundos_exactos
    }
  ]
}

Máximo 5 pasos. Solo incluye pasos donde hay algo visual importante que mostrar.
Responde ÚNICAMENTE con el JSON, sin explicaciones.`,
          }],
        }),
      })

      const timestampData = await timestampRes.json()
      let steps: { description: string; timestamp: number }[] = []
      try {
        const parsed = JSON.parse(timestampData.content?.[0]?.text ?? '{}')
        steps = parsed.steps ?? []
      } catch {}

      const screenshots: { description: string; url: string; timestamp: number }[] = []
      for (const step of steps.slice(0, 5)) {
        const screenshotUrl = await takeVimeoScreenshot(vimeoId, step.timestamp, step.description)
        if (screenshotUrl) {
          screenshots.push({ description: step.description, url: screenshotUrl, timestamp: step.timestamp })
        }
      }

      const screenshotsText = screenshots.length > 0
        ? `CAPTURAS DE PANTALLA DEL VIDEO (incluye cada imagen INMEDIATAMENTE después del paso que describe):
${screenshots.map((s, i) => `Paso ${i + 1} - "${s.description}" (${Math.floor(s.timestamp / 60)}:${String(Math.floor(s.timestamp % 60)).padStart(2, '0')}):
<figure style="margin:12px 0;"><img src="${s.url}" alt="${s.description}" style="max-width:100%; border-radius:8px; border: 1px solid #e5e7eb;"><figcaption style="font-size:12px; color:#6b7280; margin-top:4px;">${s.description}</figcaption></figure>`).join('\n\n')}`
        : 'No se pudieron obtener capturas del video. Redacta el artículo con pasos claros y detallados.'

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

Tu tarea es crear un artículo paso a paso respondiendo ÚNICAMENTE la siguiente pregunta basándote en la transcripción del video:
"${question}"

OTROS ARTÍCULOS QUE SE CREARÁN (NO incluyas información de estos temas):
${otherQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

TRANSCRIPCIÓN DEL VIDEO "${video.title}":
${transcriptText.slice(0, 4000)}

${screenshotsText}

INSTRUCCIONES:
- Responde únicamente la pregunta: "${question}"
- Basa el contenido EXCLUSIVAMENTE en la transcripción del video
- NO incluyas información de las otras preguntas listadas
- Escribe en español latinoamericano, tono amigable y claro
- Usa <ol> para pasos numerados — cada paso debe ser una acción concreta
- ${screenshots.length > 0 ? 'Incluye cada captura de pantalla INMEDIATAMENTE después del paso que ilustra usando el HTML exacto proporcionado arriba' : 'Redacta pasos claros y detallados'}
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
          needs_images: false,
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
