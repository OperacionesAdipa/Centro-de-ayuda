import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const vimeoId = req.nextUrl.searchParams.get('id') ?? '1202296335'
    const timestamp = parseInt(req.nextUrl.searchParams.get('t') ?? '30')

    const res = await fetch(`https://api.vimeo.com/videos/${vimeoId}?fields=pictures,duration`, {
      headers: {
        Authorization: `Bearer ${process.env.VIMEO_TOKEN}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    })

    if (!res.ok) return NextResponse.json({ error: `Vimeo API error: ${res.status}` })

    const data = await res.json()
    const pictures = data.pictures?.sizes ?? []
    const largest = pictures[pictures.length - 1]

    return NextResponse.json({
      duration: data.duration,
      timestamp,
      picturesCount: pictures.length,
      largestPicture: largest?.link ?? null,
      allSizes: pictures.map((p: any) => ({ width: p.width, link: p.link })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
