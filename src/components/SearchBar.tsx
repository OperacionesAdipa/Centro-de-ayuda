'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/useLanguage'
import { t } from '@/lib/translations'
import { slugify } from '@/lib/supabaseQueries'

type FilterType = 'todos' | 'articulos' | 'videos' | 'faq'

const filterLabels: Record<string, Record<FilterType, string>> = {
  es: { todos: 'Todos', articulos: 'Artículos', videos: 'Videos', faq: 'FAQ' },
  en: { todos: 'All', articulos: 'Articles', videos: 'Videos', faq: 'FAQ' },
}

export function SearchBar() {
  const { lang } = useLanguage()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FilterType>('todos')
  const wrapRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const T = (key: Parameters<typeof t>[1]) => t(lang as any, key)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setResults([])
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&filter=${filter}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setLoading(false)
    }, 350)
  }, [query, filter])

  const labels = filterLabels[lang] ?? filterLabels['es']

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className="search-input-row">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder={lang === 'en' ? 'Search articles, guides, tutorials...' : 'Buscar artículos, guías, tutoriales...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="search-btn">{lang === 'en' ? 'Search' : 'Buscar'}</button>
      </div>
      <div className="search-filter-row">
        <span className="search-filter-label">{lang === 'en' ? 'Filter:' : 'Filtrar:'}</span>
        {(['todos', 'articulos', 'videos', 'faq'] as FilterType[]).map((f) => (
          <button
            key={f}
            className={`search-filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {labels[f]}
          </button>
        ))}
      </div>
      {(results.length > 0 || loading) && (
        <div className="search-results">
          {loading && <div className="search-result-item" style={{ color: '#aaa' }}>{lang === 'en' ? 'Searching...' : 'Buscando...'}</div>}
          {results.slice(0, 6).map((r: any) => (
            <Link
              key={r.id}
              href={`/articulo/${r.id}-${slugify(r.title)}`}
              className="search-result-item"
              onClick={() => { setQuery(''); setResults([]) }}
            >
              {r.type === 'video' ? '🎬' : r.type === 'faq' ? '❓' : '📄'} {r.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
