'use client'

import { useState, useEffect } from 'react'
import { useCountry } from '@/lib/useCountry'
import { useLanguage } from '@/lib/useLanguage'
import { slugify, filterArticlesByCountry } from '@/lib/supabaseQueries'
import { replaceMexicoTerms } from '@/lib/countryUtils'
import { t } from '@/lib/translations'
import Link from 'next/link'

function getIconFromName(fullName: string): { icon: string; name: string } {
  const chars = [...fullName.trim()]
  if (chars.length === 0) return { icon: '📂', name: fullName }
  const first = chars[0]
  const codePoint = first.codePointAt(0) ?? 0
  if (codePoint > 127) {
    const rest = chars.slice(1).join('').trim()
    return { icon: first, name: rest }
  }
  return { icon: '📂', name: fullName.trim() }
}

interface Props {
  sections: any[]
  articlesPerSection: { section: any; arts: any[] }[]
}

export function SectionCardsGrid({ sections, articlesPerSection }: Props) {
  const { country } = useCountry()
  const { lang } = useLanguage()
  const [activeSection, setActiveSection] = useState<number | null>(null)
  const [sectionTranslations, setSectionTranslations] = useState<Record<number, string>>({})
  const [articleTranslations, setArticleTranslations] = useState<Record<number, string>>({})
  const T = (key: Parameters<typeof t>[1]) => t(lang as any, key)

  const uniqueSections = sections.filter(
    (sec, index, self) => self.findIndex((s) => s.id === sec.id) === index
  )

  const visibleSections = uniqueSections.filter((sec) => {
    const arts = articlesPerSection.find((a) => a.section.id === sec.id)?.arts ?? []
    return filterArticlesByCountry(arts, country).length > 0
  })

  useEffect(() => {
    if (lang === 'es') {
      setSectionTranslations({})
      setArticleTranslations({})
      return
    }

    // Traducir nombres de secciones
    const sectionNames = visibleSections.map(s => getIconFromName(s.name).name)
    fetch('/api/translate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: sectionNames, lang }),
    })
      .then(r => r.json())
      .then(data => {
        const newTranslations: Record<number, string> = {}
        visibleSections.forEach((sec, i) => {
          newTranslations[sec.id] = data.translations?.[i] ?? getIconFromName(sec.name).name
        })
        setSectionTranslations(newTranslations)
      })
      .catch(() => {})

    // Traducir títulos de artículos
    const allArts: any[] = []
    visibleSections.forEach(sec => {
      const entry = articlesPerSection.find(a => a.section.id === sec.id)
      const arts = filterArticlesByCountry(entry?.arts ?? [], country)
      allArts.push(...arts)
    })

    const artTitles = allArts.map(a => a.title)
    if (artTitles.length === 0) return

    fetch('/api/translate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: artTitles, lang }),
    })
      .then(r => r.json())
      .then(data => {
        const newTranslations: Record<number, string> = {}
        allArts.forEach((art, i) => {
          newTranslations[art.id] = data.translations?.[i] ?? art.title
        })
        setArticleTranslations(newTranslations)
      })
      .catch(() => {})
  }, [lang, sections.length])

  return (
    <div className="section-accordion">
      {visibleSections.map((sec, i) => {
        const entry = articlesPerSection.find((a) => a.section.id === sec.id)
        const arts = filterArticlesByCountry(entry?.arts ?? [], country)
        const isActive = activeSection === sec.id
        const { icon, name } = getIconFromName(sec.name)
        const displayName = sectionTranslations[sec.id] ?? replaceMexicoTerms(name, country)

        return (
          <div key={sec.id} className="section-accordion-item">
            <button
              className={`section-card-large ${isActive ? 'active' : i % 2 === 0 ? 'purple' : 'blue'}`}
              onClick={() => setActiveSection(isActive ? null : sec.id)}
              style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span className="section-card-large-icon">{icon}</span>
              <div style={{ flex: 1 }}>
                <div className="section-card-large-name">{displayName}</div>
                <div className="section-card-large-meta">{arts.length} {T('articles')}</div>
              </div>
              <span style={{ fontSize: 18, color: 'var(--purple)', marginLeft: 8 }}>
                {isActive ? '▾' : '›'}
              </span>
            </button>

            {isActive && (
              <div className="section-accordion-articles">
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
                          {articleTranslations[art.id] ?? replaceMexicoTerms(art.title, country)}
                        </div>
                        {(art.view_count ?? 0) > 0 && (
                          <div className="article-list-meta">
                            {art.view_count.toLocaleString()} {T('views')}
                          </div>
                        )}
                      </div>
                      <span className="article-list-arrow">›</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
