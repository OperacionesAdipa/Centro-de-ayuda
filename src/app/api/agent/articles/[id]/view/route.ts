import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ ok: false })

    await supabaseAdmin.rpc('increment_view_count', { article_id: id })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
