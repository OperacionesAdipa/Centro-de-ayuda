'use client'

import Link from 'next/link'
import { useState } from 'react'
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
  sections: any[]
  articles: any[]
  currentCategoryId?: number
  currentSectionId?: number
  currentArticleId?: number
}

export function ArticleSidebar({ categories, sections, articles, currentCategoryId, currentSectionId, currentArticleId }: Props) {
  const { country } = useCountry()
  const [expandedCat, setExpandedCat] = useState<number | null>(currentCategoryId ?? null)
  const [expandedSection, setExpandedSection] = useState<number | null>(currentSectionId ?? null)
  const [search, setSearch] = useState('')

  const visibleCategories = categories.filter((cat) => {
    const catSections = sections.filter((s: any) => s.category_id === cat.id)
    return catSections.some((sec: any) => {
      const secArts = articles.filter((a: any) => a.section_id === sec.id)
      return filterArticlesByCountry(secArts, country).length > 0
    })
  })

  const filteredCategories = search.trim()
    ? visibleCategories.filter((cat) => {
        const catSections = sections.filter((s: any) => s.category_id === cat.id)
        return (
          cat.name.toLowerCase().includes(search.toLowerCase()) ||
          catSections.some((sec: any) =>
            sec.name.toLowerCase().includes(search.toLowerCase()) ||
            articles.some((a: any) =>
              a.section_id === sec.id &&
              a.title.toLowerCase().includes(search.toLowerCase())
            )
          )
        )
      })
    : visibleCategories

  return (
    <aside className="article-sidebar">
      <div className="sidebar-title">Categorías</div>

      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            if (e.target.value.trim()) {
              setExpandedCat(null)
              setExpandedSection(null)
            }
          }}
          style={{
            width: '100%',
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '0.5px solid var(--border)',
            fontSize: 12,
            color: 'var(--dark)',
            background: 'var(--bg)',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {filteredCategories.map((cat) => {
        const catSections = sections.filter((s: any) => s.category_id === cat.id)
        const visibleSections = catSections.filter((sec: any) => {
          const secArts = articles.filter((a: any) => a.section_id === sec.id)
          return filterArticlesByCountry(secArts, country).length > 0
        })
        const isCatExpanded = expandedCat === cat.id || (search.trim().length > 0)
        const isCatActive = currentCategoryId === cat.id
        const icon = UPDATED_ICONS[cat.name] ?? CATEGORY_ICONS[cat.name] ?? '📁'

        return (
          <div key={cat.id} className="sidebar-cat">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                className={`sidebar-cat-btn ${isCatActive ? 'active' : ''}`}
                style={{ flex: 1 }}
                onClick={() => setExpandedCat(isCatExpanded && !search.trim() ? null : cat.id)}
              >
                <span className="sidebar-cat-icon">{icon}</span>
                <span className="sidebar-cat-name">{replaceMexicoTerms(cat.name, country)}</span>
                <span className="sidebar-arrow">{isCatExpanded ? '▾' : '›'}</span>
              </button>
              <Link
                href={`/categoria/${cat.id}-${slugify(cat.name)}`}
                style={{
                  fontSize: 11,
                  padding: '4px 8px',
                  borderRadius: 99,
                  border: '0.5px solid var(--border)',
                  color: 'var(--purple)',
                  background: '#fff',
                  textDecoration: 'none',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
                title={'Ver ' + cat.name}
              >
                Ver
              </Link>
            </div>

            {isCatExpanded && visibleSections.map((sec: any) => {
              const secArticles = filterArticlesByCountry(
                articles.filter((a: any) => a.section_id === sec.id),
                country
              ).filter((a: any) =>
                search.trim() ? a.title.toLowerCase().includes(search.toLowerCase()) : true
              )
              if (search.trim() && secArticles.length === 0) return null
              const isSecExpanded = expandedSection === sec.id || search.trim().length > 0
              const isSecActive = currentSectionId === sec.id

              return (
                <div key={sec.id} className="sidebar-section">
                  <button
                    className={`sidebar-section-btn ${isSecActive ? 'active' : ''}`}
                    onClick={() => setExpandedSection(isSecExpanded && !search.trim() ? null : sec.id)}
                  >
                    <span>{replaceMexicoTerms(sec.name, country)}</span>
                    <span className="sidebar-arrow">{isSecExpanded ? '▾' : '›'}</span>
                  </button>
                  {isSecExpanded && secArticles.map((art: any) => (
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
