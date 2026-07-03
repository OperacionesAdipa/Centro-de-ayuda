import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'migrate-versions-2026') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { data: articles, error } = await supabaseAdmin
      .from('articles')
      .select('id, title, body')

    if (error) throw error

    let saved = 0
    let skipped = 0

    for (const article of articles ?? []) {
      const { data: existing } = await supabaseAdmin
        .from('article_versions')
        .select('id')
        .eq('article_id', article.id)
        .eq('created_by', 'original')
        .single()

      if (existing) {
        skipped++
        continue
      }

      await supabaseAdmin
        .from('article_versions')
        .insert({
          article_id: article.id,
          title: article.title,
          body: article.body,
          created_by: 'original',
        })

      saved++
    }

    return NextResponse.json({ success: true, saved, skipped })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
