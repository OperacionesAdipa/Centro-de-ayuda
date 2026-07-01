import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { article_id } = await req.json()

    const { error } = await supabaseAdmin
      .from('article_source_urls')
      .insert({ source_url_id: parseInt(params.id), article_id })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { article_id } = await req.json()

    const { error } = await supabaseAdmin
      .from('article_source_urls')
      .delete()
      .eq('source_url_id', parseInt(params.id))
      .eq('article_id', article_id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
