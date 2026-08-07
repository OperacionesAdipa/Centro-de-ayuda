'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/useLanguage'
import { slugify } from '@/lib/supabaseQueries'
import { useEffect, useState } from 'react'

interface Props {
  display: any[]
  sectionMap: Record<number, any>
}

export function HomeClient({ display, sectionMap }: Props) {
  const { lang } = useLanguage()
  const [translatedTitles, setTranslatedTitles] = useState<Record<number, string>>({})
  const [translatedSections, setTranslatedSections] = useState<Record<number, string>>({})

  useEffect(() => {
    if (lang === 'es') {
      setTranslatedTitles({})
      setTranslatedSections({})
      return
    }

    const titles = display.map(a => a.title)
    const sectionNames = display.map(a => sectionMap[a.section_id]?.name ?? '').filter(Boolean)

    fetch('/api/translate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: titles, lang }),
    })
      .then(r => r.json())
      .then(data => {
        const newTitles: Record<number, string> = {}
        display.forEach((art, i) => {
          newTitles[art.id] = data.translations?.[i] ?? art.title
        })
        setTranslatedTitles(newTitles)
      })
      .catch(() => {})

    if (sectionNames.length > 0) {
      fetch('/api/translate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: sectionNames, lang }),
      })
        .then(r => r.json())
        .then(data => {
          const newSections: Record<number, string> = {}
          let idx = 0
          display.forEach(art => {
            const sec = sectionMap[art.section_id]
            if (sec) {
              newSections[sec.id] = data.translations?.[idx] ?? sec.name
              idx++
            }
          })
          setTranslatedSections(newSections)
        })
        .catch(() => {})
    }
  }, [lang, display.length])

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">
          <span className="section-title-icon">🔥</span>
          {lang === 'en' ? 'Most viewed articles' : 'Artículos más vistos'}
        </h2>
      </div>
      <div className="articles-ranked">
        {display.map((art: any, i: number) => {
          const section = sectionMap[art.section_id]
          const views = art.view_count ?? 0
          const displayTitle = translatedTitles[art.id] ?? art.title
          const displaySection = section ? (translatedSections[section.id] ?? section.name) : null

          return (
            <Link
              key={art.id}
              href={`/articulo/${art.id}-${slugify(art.title)}`}
              className="art-rank-card"
            >
              <span className="art-rank-num">{i + 1}</span>
              <div className="art-rank-info">
                <div className="art-rank-title">{displayTitle}</div>
                <div className="art-rank-meta">
                  {views > 0 && <>👁 {views.toLocaleString()} {lang === 'en' ? 'views' : 'vistas'}</>}
                  {displaySection && <> · {displaySection}</>}
                </div>
              </div>
              <span className="art-rank-arrow">›</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
