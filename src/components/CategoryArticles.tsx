'use client'

import Link from 'next/link'
import { useCountry } from '@/lib/useCountry'
import { ZArticle, ZSection, slugify, extractTagsFromBody } from '@/lib/zendesk'

interface Props {
  articlesPerSection: { section: ZSection; arts: ZArticle[] }[]
}

export function CategoryArticles({ articlesPerSection }: Props) {
  const { country } = useCountry()

  return (
    <>
      {articlesPerSection.map(({ section, arts }) => {
        const filtered = arts.filter((art) => {
          const { countries } = extractTagsFromBody(art.body ?? '')
          if (countries.length === 0) return true
          if (countries.includes('Todos')) return true
          return countries.includes(country)
        })

        if (filtered.length === 0) return null

        return (
          <div key={section.id} className="section-group">
            <div className="section-group-name">{section.name}</div>
            {section.description && (
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                {section.description}
              </p>
            )}
            <div className="article-list">
              {filtered.map((art) => (
                <Link
                  key={art.id}
                  href={`/articulo/${art.id}-${slugify(art.title)}`}
                  className="article-list-item"
                >
                  <div className="article-list-icon">📄</div>
                  <div style={{ flex: 1 }}>
                    <div className="article-list-title">{art.title}</div>
                    {(art.view_count ?? 0) > 0 && (
                      <div className="article-list-meta">
                        👁 {art.view_count.toLocaleString()} vistas
                      </div>
                    )}
                  </div>
                  <span className="article-list-arrow">›</span>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </>
  )
}
