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
  const path = categoryId
    ? `/categories/${categoryId}/sections.json?per_page=100`
    : '/sections.json?per_page=100'
  const data = await zFetch(path)
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

export async function getPromotedArticles(): Promise<ZArticle[]> {
  const all = await getArticles()
  return all.filter((a) => a.promoted).slice(0, 6)
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

export function filterByCountry(
  items: { label_names?: string[] }[],
  country: string
): typeof items {
  const tag = `pais_${country.toLowerCase()}`
  return items.filter((item) => {
    const labels = item.label_names ?? []
    if (labels.length === 0) return true
    if (labels.includes('pais_todos')) return true
    return labels.includes(tag)
  })
}

export const COUNTRY_TAGS: Record<string, string> = {
  Chile: 'pais_chile',
  México: 'pais_mexico',
  Colombia: 'pais_colombia',
  Argentina: 'pais_argentina',
}

export const CATEGORY_ICONS: Record<string, string> = {
  Accesos: '🔑',
  Adipartners: '🤝',
  'Aula Virtual': '💻',
  'Acreditaciones Internacionales': '🏅',
  Beneficios: '🎁',
  'Clasificación Productos': '📦',
  Comunidad: '👥',
  'Cursos Síncronos': '🎥',
  'Cursos Asíncronos': '📚',
  'Diplomados y Postítulos': '🎓',
  Especializaciones: '⭐',
  Inscripciones: '📋',
  'Mi perfil': '👤',
  'Preguntas frecuentes': '❓',
  'Recursos Gratuitos': '🆓',
  Seminarios: '📡',
  'Sesiones Magistrales': '🏛️',
}
