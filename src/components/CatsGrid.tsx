'use client'

import Link from 'next/link'
import { useCountry } from '@/lib/useCountry'
import { ZCategory, ZSection, ZArticle, slugify, extractTagsFromBody, CATEGORY_ICONS } from '@/lib/zendesk'
import { replaceMexicoTerms } from '@/lib/countryUtils'

const UPDATED_ICONS: Record<string, string> = {
  'Admisión y Matrícula': '📋',
  'Comunidad y Beneficios': '🎁',
  'Sitio Web': '🌐',
  'Aula Virtual': '💻',
  'Programas y Cursos': '🎓',
  'Preguntas frecuentes': '❓',
}

interface Props {
  categories: ZCategory[]
  allSections: ZSection[]
  catArticleMap: Record<number, ZArticle[]>
}

export function CatsGrid({ categories, allSections, catArticleMap }: Props) {
  const { country } = useCountry()

  const visibleCats = categories.filter((cat) => {
    const arts = catArticleMap[cat.id] ?? []
    if (arts.length === 0) return false
    const filtered = arts.filter((art) => {
      const { countries } = extractTagsFromBody(art.body ?? '')
      if (countries.length === 0) return true
      if (countries.includes('Todos')) return true
      return countries.includes(country)
    })
    return filtered.length > 0
  })

  return (
    <div className="cats-grid-large" style={{ marginBottom: 40 }}>
      {visibleCats.map((cat, i) => (
        <Link
          key={cat.id}
          href={`/categoria/${cat.id}-${slugify(cat.name)}`}
          className={`cat-card-large ${i % 2 === 0 ? 'purple' : 'blue'}`}
        >
          <span className="cat-card-large-icon">
            {UPDATED_ICONS[cat.name] ?? CATEGORY_ICONS[cat.name] ?? '📁'}
          </span>
          <div className="cat-card-large-name">
            {replaceMexicoTerms(cat.name, country)}
          </div>
          <div className="cat-card-large-meta">
            {allSections.filter((s) => s.category_id === cat.id).length} secciones
          </div>
          <span className="cat-card-arrow">→</span>
        </Link>
      ))}
    </div>
  )
}
