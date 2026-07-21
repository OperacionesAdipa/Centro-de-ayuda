import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('position', { ascending: true })
    if (error) throw error
    return NextResponse.json({ categories: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json()
    if (!name) return NextResponse.json({ error: 'Falta nombre' }, { status: 400 })

    const { data: maxPos } = await supabaseAdmin
      .from('categories')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({ name, description: description ?? '', position: (maxPos?.position ?? 0) + 1 })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ category: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
