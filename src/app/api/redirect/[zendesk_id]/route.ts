import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { slugify } from '@/lib/supabaseQueries'

export async function GET(req: NextRequest, { params }: { params: { zendesk_id: string } }) {
  const zendeskId = params.zendesk_id.split('-')[0]

  const { data, error } = await supabaseAdmin
    .from('articles')
    .select('id, title')
    .eq('zendesk_id', zendeskId)
    .single()

  if (error || !data) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const slug = `${data.id}-${slugify(data.title)}`
  return NextResponse.redirect(new URL(`/articulo/${slug}`, req.url), { status: 301 })
}
