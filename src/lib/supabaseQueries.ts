import { supabaseAdmin } from './supabase'

export async function getCategories() {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('position', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getSections(categoryId?: number) {
  let query = supabaseAdmin
    .from('sections')
    .select('*')
    .order('position', { ascending: true })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query
  if (error) throw error

  if (categoryId) {
    const seen = new Set<number>()
    return (data ?? []).filter((s: any) => {
      if (seen.has(s.id)) return false
      seen.add(s.id)
      return true
    })
  }

  return data ?? []
}

export async function getArticles(sectionId?: number) {
  let query = supabaseAdmin
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })

  if (sectionId) {
    query = query.eq('section_id', sectionId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getArticle(articleId: number) {
  const { data, error } = await supabaseAdmin
    .from('articles')
    .select('*')
    .eq('id', articleId)
    .single()
  if (error) throw error
  return data
}

export async function searchArticles(query: string) {
  const { data, error } = await supabaseAdmin
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,body.ilike.%${query}%`)
    .limit(12)
  if (error) throw error
  return data ?? []
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const CATEGORY_ICONS: Record<string, string> = {
  'Admisión y Matrícula': '📋',
  'Comunidad y Beneficios': '🎁',
  'Sitio Web': '🌐',
  'Aula Virtual': '💻',
  'Programas y Cursos': '🎓',
  'Preguntas frecuentes': '❓',
}

export function extractTagsFromBody(body: string): { countries: string[]; isFaq: boolean; cleanBody: string } {
  const countries: string[] = []
  let isFaq = false

  const plainText = body.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
  const tagRegex = /#([a-záéíóúüñA-ZÁÉÍÓÚÜÑ]+)/gi
  const allTags = [...plainText.matchAll(tagRegex)]

  const COUNTRY_TAG_MAP: Record<string, string> = {
    chile: 'Chile',
    mexico: 'México',
    colombia: 'Colombia',
    argentina: 'Argentina',
    todos: 'Todos',
  }

  allTags.forEach((m) => {
    const normalized = m[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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

export function fixMediaUrls(html: string): string {
  return html.replace(
    /https:\/\/adipa\.zendesk\.com\/guide-media\//g,
    '/media/'
  )
}

export function filterArticlesByCountry(articles: any[], country: string): any[] {
  return articles.filter((art) => {
    const labelNames = art.label_names ?? []
    if (labelNames.length === 0) return true

    const hasCountryTag = labelNames.some((l: string) =>
      l.startsWith('pais_') || l === 'pais_todos'
    )
    if (!hasCountryTag) return true
    if (labelNames.includes('pais_todos')) return true

    const countryTag = `pais_${country.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace('é', 'e')}`
    return labelNames.includes(countryTag)
  })
}
