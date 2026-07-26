import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import sharp from 'sharp'

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
    const createRes = await fetch('https://api.vimeo.com/videos/' + vimeoId + '/pictures', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.VIMEO_TOKEN,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ time: Math.floor(timestamp), active: false }),
    })

    if (!createRes.ok) {
      console.log('Vimeo pictures API error: ' + createRes.status)
      return null
    }

    const pictureData = await createRes.json()
    const sizes = pictureData.sizes ?? []
    const largest = sizes.find((s: any) => s.width >= 1280) ?? sizes[sizes.length - 1]
    const imageUrl = largest?.link ?? null
    if (!imageUrl) return null

    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) return null

    const rawBuffer = Buffer.from(await imgRes.arrayBuffer())
    const image = sharp(rawBuffer)
    const metadata = await image.metadata()
    const origWidth = metadata.width ?? 1280
    const origHeight = metadata.height ?? 720

    const cropTop = Math.floor(origHeight * 0.13)
    const croppedHeight = origHeight - cropTop

    const VISION_WIDTH = 600
    const VISION_HEIGHT = Math.round((croppedHeight / origWidth) * VISION_WIDTH)

    let visionBuffer = await image
      .extract({ left: 0, top: cropTop, width: origWidth, height: croppedHeight })
      .resize(VISION_WIDTH, VISION_HEIGHT, { fit: 'fill' })
      .jpeg({ quality: 90 })
      .toBuffer()

    if (targetText && targetText.trim()) {
      try {
        const base64Image = visionBuffer.toString('base64')

        const visionPrompt =
          'En esta imagen de una interfaz web, encuentra la ubicacion EXACTA del texto o boton: "' + targetText + '"\n\n' +
          'Es muy importante que las coordenadas sean PRECISAS - marca solo el texto exacto, no el area circundante.\n\n' +
          'Si lo encuentras, responde UNICAMENTE en JSON con coordenadas RELATIVAS (valores entre 0.0 y 1.0, donde 0,0 es esquina superior izquierda y 1,1 es esquina inferior derecha):\n' +
          '{"found": true, "x": 0.45, "y": 0.23, "width": 0.12, "height": 0.04}\n\n' +
          'Si NO lo encuentras, responde:\n{"found": false}\n\n' +
          'Responde UNICAMENTE con el JSON.'

        const visionRes = await fetch('https://api.anthropic.com/v1/messages', {
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
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: 'image/jpeg', data: base64Image },
                },
                { type: 'text', text: visionPrompt },
              ],
            }],
          }),
        })

        const visionData = await visionRes.json()
        const visionText = visionData.content?.[0]?.text?.trim() ?? '{}'
        const cleaned = visionText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim()
        const coords = JSON.parse(cleaned)

        if (coords.found && coords.x >= 0 && coords.y >= 0) {
          const padding = 4
          const rx = Math.max(0, Math.round(coords.x * VISION_WIDTH) - padding)
          const ry = Math.max(0, Math.round(coords.y * VISION_HEIGHT) - padding)
          const rw = Math.min(VISION_WIDTH - rx, Math.round(coords.width * VISION_WIDTH) + padding * 2)
          const rh = Math.min(VISION_HEIGHT - ry, Math.round(coords.height * VISION_HEIGHT) + padding * 2)

          const overlay = Buffer.from(
            '<svg width="' + VISION_WIDTH + '" height="' + VISION_HEIGHT + '">' +
            '<rect x="' + rx + '" y="' + ry + '" width="' + rw + '" height="' + rh + '" ' +
            'fill="rgba(112,78,253,0.12)" stroke="#704EFD" stroke-width="3" rx="4"/>' +
            '</svg>'
          )

          visionBuffer = await sharp(visionBuffer)
            .composite([{ input: overlay, blend: 'over' }])
            .jpeg({ quality: 90 })
            .toBuffer()

          console.log('Highlighted "' + targetText + '" at x=' + coords.x + ' y=' + coords.y)
        }
      } catch (e: any) {
        console.log('Vision error: ' + e.message)
      }
    }

    const fileName = 'vimeo-' + vimeoId + '-' + Math.floor(timestamp) + '-' + Math.random().toString(36).slice(2) + '.jpg'

    const { error } = await supabaseAdmin.storage
      .from('article-images')
      .upload(fileName, visionBuffer, { contentType: 'image/jpeg', upsert: true })

    if (error) {
      console.log('Supabase upload error: ' + error.message)
      return null
    }

    const { data } = supabaseAdmin.storage.from('article-images').getPublicUrl(fileName)
    console.log('Screenshot success: ' + data.publicUrl)
    return data.publicUrl
  } catch (e: any) {
    console.log('takeVimeoScreenshot error: ' + e.message)
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
    console.log('Processing video: vimeoId=' + vimeoId)

    let transcript = video.transcript ?? ''
    if (!transcript && vimeoId) {
      const res = await fetch('https://api.vimeo.com/videos/' + vimeoId + '/texttracks', {
        headers: {
          Authorization: 'Bearer ' + process.env.VIMEO_TOKEN,
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
    const transcriptText = transcriptEntries.map(e => '[' + Math.floor(e.time) + 's] ' + e.text).join('\n')
    console.log('Transcript entries: ' + transcriptEntries.length)

    const created = []

    for (const question of questions) {
      const otherQuestions = questions.filter((q: string) => q !== question)
      console.log('Processing question: ' + question)

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
            content: 'Analiza esta transcripcion de video tutorial e identifica los timestamps exactos donde se muestra visualmente cada paso para responder la pregunta: "' + question + '"\n\nTRANSCRIPCION CON TIMESTAMPS:\n' + transcriptText.slice(0, 5000) + '\n\nResponde en JSON:\n{\n  "steps": [\n    {\n      "description": "descripcion breve del paso",\n      "timestamp": segundos_exactos,\n      "highlightText": "texto exacto que aparece en pantalla y debe resaltarse, o null"\n    }\n  ]\n}\n\nMaximo 5 pasos. Solo incluye pasos donde hay algo visual importante.\nLos timestamps deben ser numeros enteros positivos mayores a 0.\nhighlightText debe ser el texto exacto que aparece en la interfaz.\nResponde UNICAMENTE con el JSON puro, sin bloques de codigo, sin markdown.',
          }],
        }),
      })

      const timestampData = await timestampRes.json()
      const rawTimestampText = timestampData.content?.[0]?.text ?? '{}'
      console.log('Claude timestamp response: ' + rawTimestampText)

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
        console.log('Failed to parse steps JSON: ' + e)
      }

      console.log('Steps identified: ' + JSON.stringify(steps))

      const screenshots: { description: string; url: string; timestamp: number }[] = []

      for (const step of steps.slice(0, 5)) {
        if (!step.timestamp || step.timestamp <= 0) continue
        console.log('Taking screenshot for: ' + step.description + ' at ' + step.timestamp + 's')
        const screenshotUrl = await takeVimeoScreenshot(vimeoId, step.timestamp, step.highlightText)
        if (screenshotUrl) {
          screenshots.push({ description: step.description, url: screenshotUrl, timestamp: step.timestamp })
          console.log('Screenshot added: ' + screenshotUrl)
        }
      }

      console.log('Total screenshots: ' + screenshots.length)

      const screenshotsText = screenshots.length > 0
        ? 'CAPTURAS DE PANTALLA DEL VIDEO (incluye cada imagen INMEDIATAMENTE despues del paso que describe):\n' +
          screenshots.map((s, i) => {
            const min = Math.floor(s.timestamp / 60)
            const sec = String(Math.floor(s.timestamp % 60)).padStart(2, '0')
            return 'Paso ' + (i + 1) + ' - "' + s.description + '" (' + min + ':' + sec + '):\n' +
              '<figure style="margin:12px 0;"><img src="' + s.url + '" alt="' + s.description + '" style="max-width:100%; border-radius:8px; border: 1px solid #e5e7eb;"></figure>'
          }).join('\n\n')
        : 'No se pudieron obtener capturas del video. Redacta el articulo con pasos claros y detallados.'

      const articlePrompt = 'Eres un redactor experto de articulos de centro de ayuda para ADIPA, una plataforma de educacion online en Latinoamerica.\n\nTu tarea es crear un articulo paso a paso respondiendo UNICAMENTE la siguiente pregunta basandote en la transcripcion del video:\n"' + question + '"\n\nOTROS ARTICULOS QUE SE CREARAN (NO incluyas informacion de estos temas):\n' + otherQuestions.map((q: string, i: number) => (i + 1) + '. ' + q).join('\n') + '\n\nTRANSCRIPCION DEL VIDEO "' + video.title + '":\n' + transcriptText.slice(0, 4000) + '\n\n' + screenshotsText + '\n\nINSTRUCCIONES:\n- Responde unicamente la pregunta: "' + question + '"\n- Basa el contenido EXCLUSIVAMENTE en la transcripcion del video\n- NO incluyas informacion de las otras preguntas listadas\n- Escribe en espanol latinoamericano, tono amigable y claro\n- Usa <ol> para pasos numerados\n- ' + (screenshots.length > 0 ? 'Incluye cada captura de pantalla INMEDIATAMENTE despues del paso que ilustra usando el HTML exacto proporcionado arriba' : 'Redacta pasos claros y detallados') + '\n- NUNCA incluyas ejemplos con fechas, nombres de eventos especificos o informacion que pueda expirar\n- NO incluyas el titulo en el HTML\n- Responde UNICAMENTE con HTML puro, sin markdown'

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
          messages: [{ role: 'user', content: articlePrompt }],
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
        console.log('Article insert error: ' + error?.message)
        continue
      }

      await supabaseAdmin
        .from('article_vimeo_videos')
        .insert({ article_id: article.id, vimeo_video_id: video_id })

      created.push({ id: article.id, title: question, screenshots: screenshots.length })
      console.log('Article created: ' + article.id + ' with ' + screenshots.length + ' screenshots')
    }

    await supabaseAdmin
      .from('vimeo_videos')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', video_id)

    return NextResponse.json({ ok: true, created })
  } catch (e: any) {
    console.log('Main error: ' + e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
