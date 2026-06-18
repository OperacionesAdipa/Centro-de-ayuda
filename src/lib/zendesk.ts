const SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN || 'adipa'
const EMAIL = process.env.ZENDESK_EMAIL || ''
const TOKEN = process.env.ZENDESK_API_TOKEN || ''
const LOCALE = process.env.ZENDESK_LOCALE || 'es-419'

const BASE = `https://${SUBDOMAIN}.zendesk.com/api/v2/help_center/${LOCALE}`

function authHeaders() {
  const creds = Buffer.from(`${EMAIL}/token:${TOKEN}`).toString('base64')
  return {
    Authorization: `Basic ${creds}`,
    'Content-Type': 'application/json',
  }
}

async function zFetch(path: string) {
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    headers: TOKEN ? authHeaders() : {},
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`Zendesk API error: ${res.status} ${url}`)
  return res.json()
}

export interface ZCategory {
  id: number
  name: string
  description: string
  html_url: string
  position: number
}

export interface ZSection {
  id: number
  category_id: number
  name: string
  description: string
  html_url: string
  position: number
}

export interface ZArticle {
  id: number
  section_id: number
  title: string
  body: string
  html_url: string
  label_names: string[]
  vote_count: number
  view_count: number
  promoted: boolean
  draft: boolean
  updated_at: string
}

export async function getCategories(): Promise<ZCategory[]> {
  const data = await zFetch('/categories.json?per_page=100')
  return data.categories ?? []
}

export async function getSections(categoryId?: number): Promise<ZSection[]> {
  if (categoryId) {
    const data = await zFetch(`/categories/${categoryId}/sections.json?per_page=100`)
    const sections = data.sections ?? []
    const seen = new Set<number>()
    return sections.filter((s: ZSection) => {
      if (seen.has(s.id)) return false
      seen.add(s.id)
      return s.category_id === categoryId
    })
  }
  const data = await zFetch('/sections.json?per_page=100')
  return data.sections ?? []
}

export async function getArticles(sectionId?: number): Promise<ZArticle[]> {
  const path = sectionId
    ? `/sections/${sectionId}/articles.json?per_page=100`
    : '/articles.json?per_page=100'
  const data = await zFetch(path)
  return (data.articles ?? []).filter((a: ZArticle) => !a.draft)
}

export async function getArticle(articleId: number): Promise<ZArticle> {
  const data = await zFetch(`/articles/${articleId}.json`)
  return data.article
}

export async function searchArticles(query: string): Promise<ZArticle[]> {
  const url = `https://${SUBDOMAIN}.zendesk.com/api/v2/help_center/articles/search.json?query=${encodeURIComponent(query)}&locale=${LOCALE}`
  const res = await fetch(url, {
    headers: TOKEN ? authHeaders() : {},
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.results ?? []).filter((a: ZArticle) => !a.draft)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const COUNTRY_TAG_MAP: Record<string, string> = {
  chile: 'Chile',
  mexico: 'México',
  colombia: 'Colombia',
  argentina: 'Argentina',
  todos: 'Todos',
}

function normalizeTag(tag: string): string {
  return tag.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function extractTagsFromBody(body: string): { countries: string[]; isFaq: boolean; cleanBody: string } {
  const countries: string[] = []
  let isFaq = false

  const plainText = body.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
  const tagRegex = /#([a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+)/gi
  const allTags = [...plainText.matchAll(tagRegex)]

  allTags.forEach((m) => {
    const normalized = normalizeTag(m[1])
    if (normalized === 'faq') { isFaq = true; return }
    const mapped = COUNTRY_TAG_MAP[normalized]
    if (mapped && !countries.includes(mapped)) countries.push(mapped)
  })

  const cleanBody = body
    .replace(/<p[^>]*>[\s\S]*?<\/p>/gi, (match) => {
      const text = match.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
      const onlyTags = text.replace(/#[a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+/gi, '').trim()
      return onlyTags === '' ? '' : match
    })
    .trim()

  return { countries, isFaq, cleanBody }
}

export function filterArticlesByCountry(articles: ZArticle[], country: string): ZArticle[] {
  return articles.filter((art) => {
    const { countries } = extractTagsFromBody(art.body ?? '')
    if (countries.length === 0) return true
    if (countries.includes('Todos')) return true
    return countries.includes(country)
  })
}

export function fixMediaUrls(html: string): string {
  return html.replace(
    /https:\/\/adipa\.zendesk\.com\/guide-media\//g,
    '/media/'
  )
}

export const CATEGORY_ICONS: Record<string, string> = {
  'Admisión y Matrícula': '📋',
  'Comunidad y Beneficios': '🎁',
  'Sitio Web': '🌐',
  'Aula Virtual': '💻',
  'Programas y Cursos': '🎓',
  'Preguntas frecuentes': '❓',
}
