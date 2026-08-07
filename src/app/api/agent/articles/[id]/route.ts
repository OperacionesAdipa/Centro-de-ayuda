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

    // Si solo viene position, solo actualizar position
    if (Object.keys(body).length === 1 && 'position' in body) {
      const { error } = await supabaseAdmin
        .from('articles')
        .update({ position: body.position })
        .eq('id', articleId)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    // Si solo viene status, solo actualizar status
    if (Object.keys(body).length === 1 && 'status' in body) {
      const { error } = await supabaseAdmin
        .from('articles')
        .update({ status: body.status })
        .eq('id', articleId)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    // Actualización completa del artículo
    const updateData: any = { updated_at: new Date().toISOString() }
    if (body.title !== undefined) updateData.title = body.title
    if (body.body !== undefined) updateData.body = body.body
    if (body.category_id !== undefined) updateData.category_id = body.category_id
    if (body.category_name !== undefined) updateData.category_name = body.category_name
    if (body.section_id !== undefined) updateData.section_id = body.section_id
    if (body.section_name !== undefined) updateData.section_name = body.section_name
    if (body.label_names !== undefined) updateData.label_names = body.label_names
    if (body.promoted !== undefined) updateData.promoted = body.promoted
    if (body.draft !== undefined) updateData.draft = body.draft
    if (body.status !== undefined) updateData.status = body.status
    if (body.source_urls !== undefined) updateData.source_urls = body.source_urls
    if (body.needs_images !== undefined) updateData.needs_images = body.needs_images
    if (body.position !== undefined) updateData.position = body.position

    // Invalidar cache de traducciones al actualizar título o body
    if (body.body !== undefined || body.title !== undefined) {
      updateData.translations_cache = {}
    }

    const { data, error } = await supabaseAdmin
      .from('articles')
      .update(updateData)
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
