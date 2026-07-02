'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useCountry } from '@/lib/useCountry'
import { slugify, filterArticlesByCountry, replaceMexicoTerms as replaceMX } from '@/lib/supabaseQueries'
import { replaceMexicoTerms } from '@/lib/countryUtils'

interface Props {
  articlesPerSection: { section: any; arts: any[] }[]
}

export function CategoryArticles({ articlesPerSection }: Props) {
  const { country } = useCountry()
  const [activeSection, setActiveSection] = useState<number | null>(null)
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({})

  const visibleSections = articlesPerSection
    .map(({ section, arts }) => ({
      section,
      arts: filterArticlesByCountry(arts, country),
    }))
    .filter(({ arts }) => arts.length > 0)

  useEffect(() => {
    if (visibleSections.length > 0) {
      setActiveSection(visibleSections[0].section.id)
    }
  }, [country])

  function scrollToSection(id: number) {
    setActiveSection(id)
    const el = sectionRefs.current[id]
    if (el) {
      const offset = 80
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  if (visibleSections.length === 0) {
    return (
      <p style={{ fontSize: 14, color: '#aaa', padding: '20px 0' }}>
        No hay artículos disponibles para tu país en esta categoría.
      </p>
    )
  }

  return (
    <>
      {visibleSections.length > 1 && (
        <div className="section-tabs">
          {visibleSections.map(({ section }) => (
            <button
              key={section.id}
              className={`section-tab ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => scrollToSection(section.id)}
            >
              {replaceMexicoTerms(section.name, country)}
            </button>
          ))}
        </div>
      )}

      <div className="sections-content">
        {visibleSections.map(({ section, arts }) => (
          <div
            key={section.id}
            ref={(el) => { sectionRefs.current[section.id] = el }}
            className="section-group"
            id={`section-${section.id}`}
          >
            <div className="section-group-name">
              {replaceMexicoTerms(section.name, country)}
            </div>
            {section.description && (
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                {section.description}
              </p>
            )}
            <div className="article-list">
              {arts.map((art: any) => (
                <Link
                  key={art.id}
                  href={`/articulo/${art.id}-${slugify(art.title)}`}
                  className="article-list-item"
                >
                  <div className="article-list-icon">📄</div>
                  <div style={{ flex: 1 }}>
                    <div className="article-list-title">
                      {replaceMexicoTerms(art.title, country)}
                    </div>
                    {(art.view_count ?? 0) > 0 && (
                      <div className="article-list-meta">
                        {art.view_count.toLocaleString()} vistas
                      </div>
                    )}
                  </div>
                  <span className="article-list-arrow">›</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
