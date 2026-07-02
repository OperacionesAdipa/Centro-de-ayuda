import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function getVimeoInfo(url: string) {
  const match = url.match(/vimeo\.com\/(\d+)/)
  if (!match) throw new Error('URL de Vimeo inválida')
  const vimeoId = match[1]

  const res = await fetch(`https://api.vimeo.com/videos/${vimeoId}`, {
    headers: {
      Authorization: `Bearer ${process.env.VIMEO_TOKEN}`,
      Accept: 'application/vnd.vimeo.*+json;version=3.4',
    },
  })

  if (!res.ok) throw new Error(`Error al obtener video de Vimeo: ${res.status}`)
  const data = await res.json()

  const transcriptRes = await fetch(`https://api.vimeo.com/videos/${vimeoId}/texttracks`, {
    headers: {
      Authorization: `Bearer ${process.env.VIMEO_TOKEN}`,
      Accept: 'application/vnd.vimeo.*+json;version=3.4',
    },
  })

  let transcript = ''
  if (transcriptRes.ok) {
    const transcriptData = await transcriptRes.json()
    const track = transcriptData.data?.[0]
    if (track?.link) {
      const trackRes = await fetch(track.link)
      if (trackRes.ok) {
        transcript = await trackRes.text()
      }
    }
  }

  return {
    vimeoId,
    title: data.name ?? 'Video sin título',
    description: data.description ?? '',
    transcript,
  }
}

export async function GET() {
  try {
    const { data: videos, error } = await supabaseAdmin
      .from('vimeo_videos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const videosWithArticles = await Promise.all(
      (videos ?? []).map(async (v: any) => {
        const { data: relations } = await supabaseAdmin
          .from('article_vimeo_videos')
          .select('article_id, articles(id, title, status)')
          .eq('vimeo_video_id', v.id)

        return {
          ...v,
          articles: (relations ?? []).map((r: any) => r.articles).filter(Boolean),
        }
      })
    )

    return NextResponse.json({ videos: videosWithArticles })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'Falta URL' }, { status: 400 })

    const info = await getVimeoInfo(url)

    const { data, error } = await supabaseAdmin
      .from('vimeo_videos')
      .upsert({
        vimeo_id: info.vimeoId,
        title: info.title,
        vimeo_url: url,
        description: info.description,
        transcript: info.transcript,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'vimeo_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ video: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    const { error } = await supabaseAdmin
      .from('vimeo_videos')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
