import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: urls, error } = await supabaseAdmin
      .from('source_urls')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const urlsWithArticles = await Promise.all(
      (urls ?? []).map(async (url: any) => {
        const { data: relations } = await supabaseAdmin
          .from('article_source_urls')
          .select('article_id, articles(id, title, status)')
          .eq('source_url_id', url.id)

        return {
          ...url,
          articles: (relations ?? []).map((r: any) => r.articles).filter(Boolean),
        }
      })
    )

    return NextResponse.json({ urls: urlsWithArticles })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url, name, description } = await req.json()

    if (!url) return NextResponse.json({ error: 'Falta URL' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('source_urls')
      .insert({ url, name: name ?? url, description: description ?? '' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ url: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    const { error } = await supabaseAdmin
      .from('source_urls')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
