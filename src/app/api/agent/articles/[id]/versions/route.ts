import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('article_versions')
      .select('*')
      .eq('article_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return NextResponse.json({ versions: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { title, body } = await req.json()

    const { error } = await supabaseAdmin
      .from('article_versions')
      .insert({
        article_id: parseInt(params.id),
        title,
        body,
        created_by: 'agent',
      })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
