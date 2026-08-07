'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/useLanguage'

interface ViewedArticle {
  id: string
  title: string
  slug: string
  viewedAt: number
}

const STORAGE_KEY = 'adipa_recently_viewed'
const MAX_ITEMS = 3

export function trackArticleView(id: string, title: string, slug: string) {
  try {
    const existing: ViewedArticle[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    const filtered = existing.filter((a) => a.id !== id)
    const updated = [{ id, title, slug, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

export function RecentlyViewed() {
  const { lang } = useLanguage()
  const [articles, setArticles] = useState<ViewedArticle[]>([])
  const [translatedTitles, setTranslatedTitles] = useState<Record<string, string>>({})

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      setArticles(stored.slice(0, MAX_ITEMS))
    } catch {}
  }, [])

  useEffect(() => {
    if (lang === 'es' || articles.length === 0) {
      setTranslatedTitles({})
      return
    }
    const titles = articles.map(a => a.title)
    fetch('/api/translate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: titles, lang }),
    })
      .then(r => r.json())
      .then(data => {
        const newTitles: Record<string, string> = {}
        articles.forEach((art, i) => {
          newTitles[art.id] = data.translations?.[i] ?? art.title
        })
        setTranslatedTitles(newTitles)
      })
      .catch(() => {})
  }, [lang, articles.length])

  if (articles.length === 0) return null

  return (
    <div className="recently-viewed">
      <div className="section-title" style={{ marginBottom: 12 }}>
        <span className="section-title-icon">🕐</span>
        {lang === 'en' ? 'Recently viewed' : 'Vistos recientemente'}
      </div>
      <div className="recently-viewed-list">
        {articles.map((art) => (
          <Link key={art.id} href={`/articulo/${art.slug}`} className="recently-viewed-item">
            <span className="recently-viewed-icon">📄</span>
            <span className="recently-viewed-title">{translatedTitles[art.id] ?? art.title}</span>
            <span className="recently-viewed-arrow">›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
