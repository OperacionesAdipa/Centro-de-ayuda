import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('sections')
      .select('*')
      .order('position', { ascending: true })
    if (error) throw error
    return NextResponse.json({ sections: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, category_id, description } = await req.json()
    if (!name || !category_id) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

    const { data: maxPos } = await supabaseAdmin
      .from('sections')
      .select('position')
      .eq('category_id', category_id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const { data, error } = await supabaseAdmin
      .from('sections')
      .insert({ name, category_id, description: description ?? '', position: (maxPos?.position ?? 0) + 1 })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ section: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
