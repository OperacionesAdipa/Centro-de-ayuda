'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCountry } from '@/lib/useCountry'
import { ZCategory, ZSection, ZArticle, slugify } from '@/lib/zendesk'
import { replaceMexicoTerms } from '@/lib/countryUtils'

interface Props {
  categories: ZCategory[]
  sections: ZSection[]
  articles: ZArticle[]
  currentCategoryId?: number
  currentSectionId?: number
  currentArticleId?: number
}

export function ArticleSidebar({ categories, sections, articles, currentCategoryId, currentSectionId, currentArticleId }: Props) {
  const { country } = useCountry()
  const [expandedCat, setExpandedCat] = useState<number | null>(currentCategoryId ?? null)
  const [expandedSection, setExpandedSection] = useState<number | null>(currentSectionId ?? null)

  return (
    <aside className="article-sidebar">
      <div className="sidebar-title">Categorías</div>
      {categories.map((cat) => {
        const catSections = sections.filter((s) => s.category_id === cat.id)
        const isCatExpanded = expandedCat === cat.id
        const isCatActive = currentCategoryId === cat.id

        return (
          <div key={cat.id} className="sidebar-cat">
            <button
              className={`sidebar-cat-btn ${isCatActive ? 'active' : ''}`}
              onClick={() => setExpandedCat(isCatExpanded ? null : cat.id)}
            >
              <span>{replaceMexicoTerms(cat.name, country)}</span>
              <span className="sidebar-arrow">{isCatExpanded ? '▾' : '›'}</span>
            </button>

            {isCatExpanded && catSections.map((sec) => {
              const secArticles = articles.filter((a) => a.section_id === sec.id)
              const isSecExpanded = expandedSection === sec.id
              const isSecActive = currentSectionId === sec.id

              return (
                <div key={sec.id} className="sidebar-section">
                  <button
                    className={`sidebar-section-btn ${isSecActive ? 'active' : ''}`}
                    onClick={() => setExpandedSection(isSecExpanded ? null : sec.id)}
                  >
                    <span>{replaceMexicoTerms(sec.name, country)}</span>
                    <span className="sidebar-arrow">{isSecExpanded ? '▾' : '›'}</span>
                  </button>

                  {isSecExpanded && secArticles.map((art) => (
                    <Link
                      key={art.id}
                      href={`/articulo/${art.id}-${slugify(art.title)}`}
                      className={`sidebar-article-link ${currentArticleId === art.id ? 'active' : ''}`}
                    >
                      📄 {replaceMexicoTerms(art.title, country)}
                    </Link>
                  ))}
                </div>
              )
            })}
          </div>
        )
      })}
    </aside>
  )
}
