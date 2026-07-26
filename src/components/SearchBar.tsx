'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { slugify } from '@/lib/supabaseQueries'

type FilterType = 'todos' | 'articulos' | 'videos' | 'faq'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FilterType>('todos')
  const wrapRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

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

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className="search-input-row">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="Buscar artículos, guías, tutoriales..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="search-btn">Buscar</button>
      </div>

      <div className="search-filter-row">
        <span className="search-filter-label">Filtrar:</span>
        {(['todos', 'articulos', 'videos', 'faq'] as FilterType[]).map((f) => (
          <button
            key={f}
            className={`search-filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'todos' ? 'Todos' : f === 'articulos' ? 'Artículos' : f === 'videos' ? 'Videos' : 'FAQ'}
          </button>
        ))}
      </div>

      {(results.length > 0 || loading) && (
        <div className="search-results">
          {loading && <div className="search-result-item" style={{ color: '#aaa' }}>Buscando...</div>}
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
