import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { article_id } = await req.json()
    const sourceUrlId = parseInt(params.id)

    const { data: urlData } = await supabaseAdmin
      .from('source_urls')
      .select('url')
      .eq('id', sourceUrlId)
      .single()

    const { error } = await supabaseAdmin
      .from('article_source_urls')
      .insert({ source_url_id: sourceUrlId, article_id })

    if (error) throw error

    if (urlData?.url) {
      const { data: article } = await supabaseAdmin
        .from('articles')
        .select('source_urls')
        .eq('id', article_id)
        .single()

      const currentUrls = article?.source_urls ?? []
      if (!currentUrls.includes(urlData.url)) {
        await supabaseAdmin
          .from('articles')
          .update({ source_urls: [...currentUrls, urlData.url] })
          .eq('id', article_id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { article_id } = await req.json()
    const sourceUrlId = parseInt(params.id)

    const { data: urlData } = await supabaseAdmin
      .from('source_urls')
      .select('url')
      .eq('id', sourceUrlId)
      .single()

    const { error } = await supabaseAdmin
      .from('article_source_urls')
      .delete()
      .eq('source_url_id', sourceUrlId)
      .eq('article_id', article_id)

    if (error) throw error

    if (urlData?.url) {
      const { data: article } = await supabaseAdmin
        .from('articles')
        .select('source_urls')
        .eq('id', article_id)
        .single()

      const currentUrls = (article?.source_urls ?? []).filter((u: string) => u !== urlData.url)
      await supabaseAdmin
        .from('articles')
        .update({ source_urls: currentUrls })
        .eq('id', article_id)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
