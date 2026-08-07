'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/useLanguage'
import { useEffect, useState } from 'react'

interface Props {
  icon: string
  name: string
  description?: string
  sectionsCount: number
  articlesCount: number
}

export function CategoryHeader({ icon, name, description, sectionsCount, articlesCount }: Props) {
  const { lang } = useLanguage()
  const [translatedName, setTranslatedName] = useState<string | null>(null)
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null)

  useEffect(() => {
    if (lang === 'es') {
      setTranslatedName(null)
      setTranslatedDesc(null)
      return
    }

    const texts = [name, description].filter(Boolean) as string[]
    if (texts.length === 0) return

    fetch('/api/translate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, lang }),
    })
      .then(r => r.json())
      .then(data => {
        setTranslatedName(data.translations?.[0] ?? name)
        if (description) setTranslatedDesc(data.translations?.[1] ?? description)
      })
      .catch(() => {})
  }, [lang, name])

  return (
    <div className="cat-page-header">
      <div style={{ marginBottom: 16 }}>
        <Link href="/" className="back-btn-top back-btn-solid">
          {lang === 'en' ? '← Back to home' : '← Volver al inicio'}
        </Link>
      </div>
      <div className="cat-page-title-row">
        <div className="cat-page-icon">{icon}</div>
        <div>
          <div className="cat-page-name">{translatedName ?? name}</div>
          {description && (
            <div className="cat-page-desc">{translatedDesc ?? description}</div>
          )}
          <div className="cat-page-desc">
            {sectionsCount} {lang === 'en' ? 'sections' : 'secciones'} · {articlesCount} {lang === 'en' ? 'articles' : 'artículos'}
          </div>
        </div>
      </div>
    </div>
  )
}
