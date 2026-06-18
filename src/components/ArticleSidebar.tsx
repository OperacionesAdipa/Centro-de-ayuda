'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCountry } from '@/lib/useCountry'
import { ZCategory, ZSection, slugify } from '@/lib/zendesk'
import { replaceMexicoTerms } from '@/lib/countryUtils'

interface Props {
  categories: ZCategory[]
  sections: ZSection[]
  currentCategoryId?: number
  currentSectionId?: number
}

export function ArticleSidebar({ categories, sections, currentCategoryId, currentSectionId }: Props) {
  const { country } = useCountry()
  const [expanded, setExpanded] = useState<number | null>(currentCategoryId ?? null)

  return (
    <aside className="article-sidebar">
      <div className="sidebar-title">Categorías</div>
      {categories.map((cat) => {
        const catSections = sections.filter((s) => s.category_id === cat.id)
        const isExpanded = expanded === cat.id
        const isActive = currentCategoryId === cat.id

        return (
          <div key={cat.id} className="sidebar-cat">
            <button
              className={`sidebar-cat-btn ${isActive ? 'active' : ''}`}
              onClick={() => setExpanded(isExpanded ? null : cat.id)}
            >
              <span>{replaceMexicoTerms(cat.name, country)}</span>
              <span className="sidebar-arrow">{isExpanded ? '▾' : '›'}</span>
            </button>
            {isExpanded && catSections.length > 0 && (
              <div className="sidebar-sections">
                {catSections.map((sec) => (
                  <Link
                    key={sec.id}
                    href={`/categoria/${cat.id}-${slugify(cat.name)}#section-${sec.id}`}
                    className={`sidebar-section-link ${currentSectionId === sec.id ? 'active' : ''}`}
                  >
                    {replaceMexicoTerms(sec.name, country)}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </aside>
  )
}
