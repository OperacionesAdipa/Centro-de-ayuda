import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { video_id } = await req.json()
    if (!video_id) return NextResponse.json({ error: 'Falta video_id' }, { status: 400 })

    const { data: video, error } = await supabaseAdmin
      .from('vimeo_videos')
      .select('*')
      .eq('id', video_id)
      .single()

    if (error || !video) return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })

    let transcript = video.transcript ?? ''

    if (!transcript) {
      const vimeoIdMatch = video.vimeo_url?.match(/vimeo\.com\/(\d+)/)
      const vimeoId = vimeoIdMatch?.[1]
      if (vimeoId) {
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
    }

    if (!transcript) return NextResponse.json({ error: 'No hay transcripción disponible para este video' }, { status: 400 })

    const cleanTranscript = transcript
      .replace(/WEBVTT[\s\S]*?\n\n/, '')
      .replace(/\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\n+/g, ' ')
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
          content: `Analiza esta transcripción de un video tutorial y genera entre 3 y 6 preguntas frecuentes que los usuarios podrían tener sobre el tema que se explica en el video.

TRANSCRIPCIÓN:
${cleanTranscript}

INSTRUCCIONES:
- Genera preguntas específicas que se puedan responder con el contenido del video
- Las preguntas deben ser sobre procesos o funcionalidades que se muestran en el video
- NO generes preguntas sobre fechas, eventos específicos o información que pueda expirar
- Escribe en español latinoamericano
- Formato: una pregunta por línea, comenzando con signo de interrogación
- Responde ÚNICAMENTE con las preguntas, sin numeración ni explicaciones`,
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
