'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { slugify } from '@/lib/zendesk'

const POPULAR_SEARCHES = [
  'Cómo iniciar sesión',
  'Recuperar contraseña',
  'Certificados',
  'Medios de pago',
  'Inscripción',
  'Aula virtual',
]

type FilterType = 'todos' | 'articulos' | 'videos' | 'faq'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FilterType>('todos')
  const [listening, setListening] = useState(false)
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

  function startVoice() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-CL'
    recognition.continuous = false
    recognition.interimResults = false
    setListening(true)
    recognition.start()
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setQuery(transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
  }

  const showSuggestions = query.length === 0

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
        <button
          className={`voice-btn ${listening ? 'active' : ''}`}
          onClick={startVoice}
          title="Buscar por voz"
          type="button"
        >
          🎤
        </button>
        <button className="search-btn">Buscar</button>
      </div>

      <div className="search-filters">
        {(['todos', 'articulos', 'videos', 'faq'] as FilterType[]).map((f) => (
          <button
            key={f}
            className={`search-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'todos' ? 'Todos' : f === 'articulos' ? 'Artículos' : f === 'videos' ? 'Videos' : 'FAQ'}
          </button>
        ))}
      </div>

      {showSuggestions && (
        <div className="search-suggestions">
          <div className="search-suggestions-label">🔥 Búsquedas populares</div>
          <div className="search-suggestions-list">
            {POPULAR_SEARCHES.map((s) => (
              <button
                key={s}
                className="search-suggestion-tag"
                onClick={() => setQuery(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

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
              {r.type === 'video' ? '🎬' : r.type === 'faq' ? '❓' : '📄'} {r.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
