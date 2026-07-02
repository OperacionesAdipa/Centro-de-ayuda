'use client'

import Link from 'next/link'
import { useCountry } from '@/lib/useCountry'
import { slugify, CATEGORY_ICONS, filterArticlesByCountry } from '@/lib/supabaseQueries'
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
  categories: any[]
  allSections: any[]
  catArticleMap: Record<number, any[]>
}

export function CatsGrid({ categories, allSections, catArticleMap }: Props) {
  const { country } = useCountry()

  const visibleCats = categories.filter((cat) => {
    const arts = catArticleMap[cat.id] ?? []
    const filtered = filterArticlesByCountry(arts, country)
    return filtered.length > 0
  })

  return (
    <div className="cats-grid-large" style={{ marginBottom: 40 }}>
      {visibleCats.map((cat, i) => {
        const catSections = allSections.filter((s: any) => s.category_id === cat.id)
        const visibleSections = catSections.filter((sec: any) => {
          const arts = filterArticlesByCountry(catArticleMap[cat.id]?.filter((a: any) => a.section_id === sec.id) ?? [], country)
          return arts.length > 0
        })

        return (
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
              {visibleSections.length} secciones
            </div>
            <span className="cat-card-arrow">→</span>
          </Link>
        )
      })}
    </div>
  )
}
