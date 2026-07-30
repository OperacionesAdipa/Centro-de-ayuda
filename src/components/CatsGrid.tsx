'use client'

import Link from 'next/link'
import { useCountry } from '@/lib/useCountry'
import { slugify, filterArticlesByCountry } from '@/lib/supabaseQueries'
import { replaceMexicoTerms } from '@/lib/countryUtils'

function getIconFromName(fullName: string): { icon: string; name: string } {
  const chars = [...fullName.trim()]
  if (chars.length === 0) return { icon: '📁', name: fullName }
  const first = chars[0]
  const codePoint = first.codePointAt(0) ?? 0
  if (codePoint > 127) {
    return { icon: first, name: fullName.slice(first.length).trim() }
  }
  return { icon: '📁', name: fullName.trim() }
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
        const { icon, name } = getIconFromName(cat.name)
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
            <span className="cat-card-large-icon">{icon}</span>
            <div className="cat-card-large-name">{replaceMexicoTerms(name, country)}</div>
            <div className="cat-card-large-meta">{visibleSections.length} secciones</div>
            <span className="cat-card-arrow">→</span>
          </Link>
        )
      })}
    </div>
  )
}
