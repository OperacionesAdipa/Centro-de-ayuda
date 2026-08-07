'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCountry } from '@/lib/useCountry'
import { useLanguage } from '@/lib/useLanguage'
import { t } from '@/lib/translations'
import { slugify, filterArticlesByCountry } from '@/lib/supabaseQueries'
import { replaceMexicoTerms } from '@/lib/countryUtils'

function getIconFromName(fullName: string): { icon: string; name: string } {
  const chars = [...fullName.trim()]
  if (chars.length === 0) return { icon: '📁', name: fullName }
  const first = chars[0]
  const codePoint = first.codePointAt(0) ?? 0
  if (codePoint > 127) {
    const rest = chars.slice(1).join('').trim()
    return { icon: first, name: rest }
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
  const { lang } = useLanguage()
  const [catTranslations, setCatTranslations] = useState<Record<number, string>>({})
  const T = (key: Parameters<typeof t>[1]) => t(lang as any, key)

  const visibleCats = categories.filter((cat) => {
    const arts = catArticleMap[cat.id] ?? []
    const filtered = filterArticlesByCountry(arts, country)
    return filtered.length > 0
  })

  useEffect(() => {
    if (lang === 'es') {
      setCatTranslations({})
      return
    }

    const names = visibleCats.map(c => getIconFromName(c.name).name)
    fetch('/api/translate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: names, lang }),
    })
      .then(r => r.json())
      .then(data => {
        const newTranslations: Record<number, string> = {}
        visibleCats.forEach((cat, i) => {
          newTranslations[cat.id] = data.translations?.[i] ?? getIconFromName(cat.name).name
        })
        setCatTranslations(newTranslations)
      })
      .catch(() => {})
  }, [lang, categories.length])

  return (
    <div className="cats-grid-large" style={{ marginBottom: 40 }}>
      {visibleCats.map((cat, i) => {
        const { icon, name } = getIconFromName(cat.name)
        const displayName = catTranslations[cat.id] ?? replaceMexicoTerms(name, country)
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
            <div className="cat-card-large-name">{displayName}</div>
            <div className="cat-card-large-meta">{visibleSections.length} {T('sections')}</div>
            <span className="cat-card-arrow">→</span>
          </Link>
        )
      })}
    </div>
  )
}
