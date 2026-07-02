import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const { video_id } = await req.json()

    if (!video_id) {
      return NextResponse.json({ error: 'Falta video_id' }, { status: 400 })
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://centro-de-ayuda-eta.vercel.app'}/api/agent/vimeo/${video_id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.error }, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
