'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { slugify } from '@/lib/zendesk'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setLoading(false)
    }, 350)
  }, [query])

  return (
    <div className="search-wrap">
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
      {(results.length > 0 || loading) && (
        <div className="search-results">
          {loading && (
            <div className="search-result-item" style={{ color: '#aaa' }}>
              Buscando...
            </div>
          )}
          {results.slice(0, 6).map((r: any) => (
            <Link
              key={r.id}
              href={`/articulo/${r.id}-${slugify(r.title)}`}
              className="search-result-item"
              onClick={() => { setQuery(''); setResults([]) }}
            >
              📄 {r.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
