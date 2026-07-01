import { NextRequest, NextResponse } from 'next/server'

const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN || 'adipa'
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL || ''
const ZENDESK_TOKEN = process.env.ZENDESK_API_TOKEN || ''
const ZENDESK_LOCALE = process.env.ZENDESK_LOCALE || 'es-419'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const BASE = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/help_center/${ZENDESK_LOCALE}`

function zHeaders() {
  const creds = Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_TOKEN}`).toString('base64')
  return { Authorization: `Basic ${creds}`, 'Content-Type': 'application/json' }
}

function sbHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'resolution=merge-duplicates',
  }
}

async function zFetch(path: string) {
  const res = await fetch(`${BASE}${path}`, { headers: zHeaders() })
  if (!res.ok) throw new Error(`Zendesk error: ${res.status} ${path}`)
  return res.json()
}

async function sbUpsert(table: string, data: any[]) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders(), 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase error on ${table}: ${err}`)
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'migrate-adipa-2026') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const results = { categories: 0, sections: 0, articles: 0, errors: [] as string[] }

    const catData = await zFetch('/categories.json?per_page=100')
    const categories = catData.categories ?? []

    const catRows = categories.map((c: any) => ({
      zendesk_id: c.id,
      name: c.name,
      description: c.description ?? '',
      position: c.position ?? 0,
    }))
    await sbUpsert('categories', catRows)
    results.categories = catRows.length

    const secData = await zFetch('/sections.json?per_page=100')
    const sections = secData.sections ?? []

    const catMap: Record<number, number> = {}
    const catRes = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,zendesk_id`, {
      headers: sbHeaders(),
    })
    const catList = await catRes.json()
    catList.forEach((c: any) => { catMap[c.zendesk_id] = c.id })

    const secRows = sections.map((s: any) => ({
      zendesk_id: s.id,
      category_id: catMap[s.category_id] ?? null,
      name: s.name,
      description: s.description ?? '',
      position: s.position ?? 0,
    }))
    await sbUpsert('sections', secRows)
    results.sections = secRows.length

    const secMap: Record<number, number> = {}
    const secRes = await fetch(`${SUPABASE_URL}/rest/v1/sections?select=id,zendesk_id`, {
      headers: sbHeaders(),
    })
    const secList = await secRes.json()
    secList.forEach((s: any) => { secMap[s.zendesk_id] = s.id })

    const secCatMap: Record<number, number> = {}
    sections.forEach((s: any) => { secCatMap[s.id] = s.category_id })

    let page = 1
    let hasMore = true

    while (hasMore) {
      const artData = await zFetch(`/articles.json?per_page=100&page=${page}`)
      const articles = artData.articles ?? []

      if (articles.length === 0) { hasMore = false; break }

      const artRows = articles.map((a: any) => ({
        zendesk_id: a.id,
        title: a.title,
        body: a.body ?? '',
        section_id: secMap[a.section_id] ?? null,
        section_name: sections.find((s: any) => s.id === a.section_id)?.name ?? '',
        category_id: catMap[secCatMap[a.section_id]] ?? null,
        category_name: categories.find((c: any) => c.id === secCatMap[a.section_id])?.name ?? '',
        label_names: a.label_names ?? [],
        promoted: a.promoted ?? false,
        draft: a.draft ?? false,
        view_count: a.view_count ?? 0,
        status: a.draft ? 'draft' : 'published',
        zendesk_url: a.html_url ?? '',
        updated_at: a.updated_at ?? new Date().toISOString(),
      }))

      await sbUpsert('articles', artRows)
      results.articles += artRows.length

      hasMore = artData.next_page !== null
      page++
    }

    return NextResponse.json({ success: true, results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
