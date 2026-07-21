import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import sharp from 'sharp'
import { createWorker } from 'tesseract.js'

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
      if (parts.length === 3) {
        time = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2])
      } else if (parts.length === 2) {
        time = parseInt(parts[0]) * 60 + parseFloat(parts[1])
      }
      const textLines: string[] = []
      i++
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().includes('-->')) {
        const t = lines[i].trim()
        if (t && !/^\d+$/.test(t)) textLines.push(t)
        i++
      }
      const text = textLines.join(' ').replace(/<[^>]*>/g, '').trim()
      if (text && time > 0) entries.push({ time, text })
    } else {
      i++
    }
  }
  return entries
}

async function takeVimeoScreenshot(vimeoId: string, timestamp: number, targetText?: string): Promise<string | null> {
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

    if (!createRes.ok) {
      console.log(`Vimeo pictures API error: ${createRes.status}`)
      return null
    }

    const pictureData = await createRes.json()
    const sizes = pictureData.sizes ?? []
    const largest = sizes.find((s: any) => s.width >= 1280) ?? sizes[sizes.length - 1]
    const imageUrl = largest?.link ?? null
    if (!imageUrl) {
      console.log('No image URL from Vimeo')
      return null
    }

    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) {
      console.log(`Failed to fetch image: ${imgRes.status}`)
      return null
    }

    const rawBuffer = Buffer.from(await imgRes.arrayBuffer())

    const image = sharp(rawBuffer)
    const metadata = await image.metadata()
    const width = metadata.width ?? 1280
    const height = metadata.height ?? 720
    const cropTop = Math.floor(height * 0.12)

    let croppedBuffer = await image
      .extract({ left: 0, top: cropTop, width, height: height - cropTop })
      .jpeg({ quality: 90 })
      .toBuffer()

    if (targetText && targetText.trim()) {
      try {
        const worker = await createWorker('spa')
        const { data } = await worker.recognize(croppedBuffer)
        await worker.terminate()

        const searchWords = targetText.toLowerCase().split(' ').filter(w => w.length > 3)
        const matchedWords = data.words.filter((w: any) =>
          searchWords.some(sw => w.text.toLowerCase().includes(sw))
        )

        if (matchedWords.length > 0) {
          const xs = matchedWords.map((w: any) => w.bbox.x0)
          const ys = matchedWords.map((w: any) => w.bbox.y0)
          const xe = matchedWords.map((w: any) => w.bbox.x1)
          const ye = matchedWords.map((w: any) => w.bbox.y1)

          const x = Math.max(0, Math.min(...xs) - 8)
          const y = Math.max(0, Math.min(...ys) - 8)
          const w2 = Math.min(width, Math.max(...xe) + 8) - x
          const h2 = Math.min(height - cropTop, Math.max(...ye) + 8) - y

          const overlay = Buffer.from(`
            <svg width="${width}" height="${height - cropTop}">
              <rect x="${x}" y="${y}" width="${w2}" height="${h2}"
                fill="none" stroke="#704EFD" stroke-width="3" rx="4"
                filter="drop-shadow(0 0 4px rgba(112,78,253,0.5))"
              />
            </svg>
          `)

          croppedBuffer = await sharp(croppedBuffer)
            .composite([{ input: overlay, blend: 'over' }])
            .jpeg({ quality: 90 })
            .toBuffer()

          console.log(`Highlighted text: "${targetText}"`)
        } else {
          console.log(`Text not found in image: "${targetText}"`)
        }
      } catch (ocrError: any) {
        console.log(`OCR error: ${ocrError.message}`)
      }
    }

    const fileName = `vimeo-${vimeoId}-${Math.floor(timestamp)}-${Math.random().toString(36).slice(2)}.jpg`

    const { error } = await supabaseAdmin.storage
      .from('article-images')
      .upload(fileName, croppedBuffer, { contentType: 'image/jpeg', upsert: true })

    if (error) {
      console.log(`Supabase upload error: ${error.message}`)
      return null
    }

    const { data } = supabaseAdmin.storage.from('article-images').getPublicUrl(fileName)
    console.log(`Screenshot success: ${data.publicUrl}`)
    return data.publicUrl
  } catch (e: any) {
    console.log(`takeVimeoScreenshot error: ${e.message}`)
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
    console.log(`Processing video: vimeoId=${vimeoId}`)

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
    console.log(`Transcript entries: ${transcriptEntries.length}`)

    const created = []

    for (const question of questions) {
      const otherQuestions = questions.filter((q: string) => q !== question)
      console.log(`Processing question: ${question}`)

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
      "timestamp": segundos_exactos,
      "highlightText": "texto exacto que aparece en pantalla y debe resaltarse, o null"
    }
  ]
}

Máximo 5 pasos. Solo incluye pasos donde hay algo visual importante.
Los timestamps deben ser números enteros positivos mayores a 0.
highlightText debe ser el texto exacto que aparece en la interfaz (botón, menú, etc).
Responde ÚNICAMENTE con el JSON puro, sin bloques de código, sin markdown, sin \`\`\`.`,
          }],
        }),
      })

      const timestampData = await timestampRes.json()
      const rawTimestampText = timestampData.content?.[0]?.text ?? '{}'
      console.log(`Claude timestamp response: ${rawTimestampText}`)

      let steps: { description: string; timestamp: number; highlightText?: string }[] = []
      try {
        const cleanedJson = rawTimestampText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim()
        const parsed = JSON.parse(cleanedJson)
        steps = parsed.steps ?? []
      } catch (e) {
        console.log(`Failed to parse steps JSON: ${e}`)
      }

      console.log(`Steps identified: ${JSON.stringify(steps)}`)

      const screenshots: { description: string; url: string; timestamp: number }[] = []

      for (const step of steps.slice(0, 5)) {
        if (!step.timestamp || step.timestamp <= 0) continue
        console.log(`Taking screenshot for: ${step.description} at ${step.timestamp}s highlight: ${step.highlightText}`)
        const screenshotUrl = await takeVimeoScreenshot(vimeoId, step.timestamp, step.highlightText)
        if (screenshotUrl) {
          screenshots.push({ description: step.description, url: screenshotUrl, timestamp: step.timestamp })
          console.log(`Screenshot added: ${screenshotUrl}`)
        }
      }

      console.log(`Total screenshots: ${screenshots.length}`)

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

      if (error || !article) {
        console.log(`Article insert error: ${error?.message}`)
        continue
      }

      await supabaseAdmin
        .from('article_vimeo_videos')
        .insert({ article_id: article.id, vimeo_video_id: video_id })

      created.push({ id: article.id, title: question, screenshots: screenshots.length })
      console.log(`Article created: ${article.id} with ${screenshots.length} screenshots`)
    }

    await supabaseAdmin
      .from('vimeo_videos')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', video_id)

    return NextResponse.json({ ok: true, created })
  } catch (e: any) {
    console.log(`Main error: ${e.message}`)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
