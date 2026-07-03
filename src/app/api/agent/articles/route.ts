import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('id, title, category_name, section_name, status, promoted, view_count, updated_at, label_names, source_urls, needs_images')
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ articles: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { data, error } = await supabaseAdmin
      .from('articles')
      .insert({
        title: body.title,
        body: body.body,
        category_id: body.category_id,
        category_name: body.category_name,
        section_id: body.section_id,
        section_name: body.section_name,
        label_names: body.label_names ?? [],
        promoted: body.promoted ?? false,
        draft: body.draft ?? false,
        status: body.status ?? 'draft',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ article: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
