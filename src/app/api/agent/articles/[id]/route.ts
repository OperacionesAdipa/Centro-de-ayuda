import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json({ article: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const articleId = parseInt(params.id)

    const { data, error } = await supabaseAdmin
      .from('articles')
      .update({
        title: body.title,
        body: body.body,
        category_id: body.category_id,
        category_name: body.category_name,
        section_id: body.section_id,
        section_name: body.section_name,
        label_names: body.label_names ?? [],
        promoted: body.promoted ?? false,
        draft: body.draft ?? false,
        status: body.status ?? 'published',
        source_urls: body.source_urls ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', articleId)
      .select()
      .single()

    if (error) throw error

    if (body.source_urls && body.source_urls.length > 0) {
      for (const url of body.source_urls) {
        const { data: existing } = await supabaseAdmin
          .from('source_urls')
          .select('id')
          .eq('url', url)
          .single()

        let sourceUrlId: number

        if (existing) {
          sourceUrlId = existing.id
        } else {
          const { data: newUrl, error: insertError } = await supabaseAdmin
            .from('source_urls')
            .insert({ url, name: url, description: '' })
            .select()
            .single()

          if (insertError || !newUrl) continue
          sourceUrlId = newUrl.id
        }

        const { data: existingLink } = await supabaseAdmin
          .from('article_source_urls')
          .select('*')
          .eq('article_id', articleId)
          .eq('source_url_id', sourceUrlId)
          .single()

        if (!existingLink) {
          await supabaseAdmin
            .from('article_source_urls')
            .insert({ article_id: articleId, source_url_id: sourceUrlId })
        }
      }
    }

    return NextResponse.json({ article: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin
      .from('articles')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
