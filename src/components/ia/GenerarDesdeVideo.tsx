'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Category {
  id: number
  name: string
}

interface Section {
  id: number
  category_id: number
  name: string
}

interface CreatedArticle {
  id: number
  title: string
  body?: string
  published?: boolean
}

export function GenerarDesdeVideo() {
  const [categories, setCategories] = useState<Category[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState('')
  const [addingVideo, setAddingVideo] = useState(false)
  const [videoId, setVideoId] = useState<number | null>(null)
  const [videoTitle, setVideoTitle] = useState('')
  const [questions, setQuestions] = useState('')
  const [categoryId, setCategoryId] = useState<number>(0)
  const [categoryName, setCategoryName] = useState('')
  const [sectionId, setSectionId] = useState<number>(0)
  const [sectionName, setSectionName] = useState('')
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['pais_todos'])
  const [generating, setGenerating] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [createdArticles, setCreatedArticles] = useState<CreatedArticle[]>([])
  const [previewArticle, setPreviewArticle] = useState<CreatedArticle | null>(null)
  const [publishing, setPublishing] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [catRes, secRes] = await Promise.all([
      fetch('/api/agent/categories'),
      fetch('/api/agent/sections'),
    ])
    const catData = await catRes.json()
    const secData = await secRes.json()
    setCategories(catData.categories ?? [])
    setSections(secData.sections ?? [])
    if (catData.categories?.length > 0) {
      setCategoryId(catData.categories[0].id)
      setCategoryName(catData.categories[0].name)
    }
    setLoading(false)
  }

  async function addVideo() {
    if (!videoUrl.trim()) { setError('Ingresa una URL de Vimeo'); return }
    setAddingVideo(true)
    setError('')
    const res = await fetch('/api/agent/vimeo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: videoUrl.trim() }),
    })
    const data = await res.json()
    if (res.ok && data.video) {
      setVideoId(data.video.id)
      setVideoTitle(data.video.title || videoUrl)
    } else {
      setError(`Error al cargar el video: ${data.error}`)
    }
    setAddingVideo(false)
  }

  async function suggestQuestions() {
    if (!videoId) { setError('Carga un video primero'); return }
    setSuggesting(true)
    setError('')
    const res = await fetch('/api/agent/suggest-from-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId }),
    })
    const data = await res.json()
    if (res.ok) {
      setQuestions(data.questions.join('\n'))
    } else {
      setError(`Error: ${data.error}`)
    }
    setSuggesting(false)
  }

  async function generate() {
    if (!videoId || !questions.trim()) { setError('Carga un video e ingresa preguntas'); return }
    setGenerating(true)
    setError('')
    setCreatedArticles([])

    const questionList = questions.split('\n').map(q => q.trim()).filter(q => q.length > 0)

    const res = await fetch('/api/agent/generate-from-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: videoId,
        questions: questionList,
        category_id: categoryId,
        category_name: categoryName,
        section_id: sectionId,
        section_name: sectionName,
        label_names: selectedCountries,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      const articlesWithBody = await Promise.all(
        data.created.map(async (a: { id: number; title: string }) => {
          const artRes = await fetch(`/api/agent/articles/${a.id}`)
          const artData = await artRes.json()
          return { id: a.id, title: a.title, body: artData.article?.body ?? '', published: false }
        })
      )
      setCreatedArticles(articlesWithBody)
      setQuestions('')
    } else {
      setError(`Error: ${data.error}`)
    }
    setGenerating(false)
  }

  async function publishArticle(id: number) {
    setPublishing(id)
    await fetch(`/api/agent/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    })
    setCreatedArticles(prev => prev.map(a => a.id === id ? { ...a, published: true } : a))
    if (previewArticle?.id === id) setPreviewArticle(prev => prev ? { ...prev, published: true } : null)
    setPublishing(null)
  }

  function toggleCountry(label: string) {
    setSelectedCountries(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  const filteredSections = sections.filter(s => s.category_id === categoryId)

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div>
      {createdArticles.length === 0 ? (
        <div style={{ maxWidth: 800 }}>
          <div className="agent-side-card" style={{ marginBottom: 16, borderTop: '3px solid #0ea5e9' }}>
            <div className="agent-side-title">Video de Vimeo</div>
            <p className="agent-side-desc">Ingresa la URL del video desde el que se generarán los artículos. Se guardará automáticamente en la sección de actualizar artículos con video.</p>
            {!videoId ? (
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  className="agent-input"
                  type="url"
                  placeholder="https://vimeo.com/123456789"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addVideo()}
                />
                <button
                  style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 99, padding: '8px 16px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  onClick={addVideo}
                  disabled={addingVideo}
                >
                  {addingVideo ? 'Cargando...' : 'Cargar video'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e0f2fe', padding: '10px 14px', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0284c7' }}>{videoTitle}</div>
                  <div style={{ fontSize: 11, color: '#0ea5e9' }}>{videoUrl}</div>
                </div>
                <button className="agent-url-remove" onClick={() => { setVideoId(null); setVideoTitle(''); setVideoUrl(''); setQuestions('') }}>✕</button>
              </div>
            )}
          </div>

          <div className="agent-side-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div className="agent-side-title">Preguntas a responder</div>
              <button
                style={{ background: videoId ? '#0ea5e9' : '#ccc', color: '#fff', border: 'none', borderRadius: 99, padding: '5px 12px', fontSize: 12, cursor: videoId ? 'pointer' : 'not-allowed' }}
                onClick={suggestQuestions}
                disabled={suggesting || !videoId}
              >
                {suggesting ? 'Sugiriendo...' : 'Sugerir desde transcripción'}
              </button>
            </div>
            <p className="agent-side-desc">Escribe una pregunta por línea o usa "Sugerir desde transcripción".</p>
            <textarea
              className="agent-textarea"
              placeholder={`¿Cómo inicio sesión?\n¿Cómo actualizo mis datos?\n¿Cómo cambio mi contraseña?`}
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              rows={6}
            />
            {questions.trim() && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                {questions.split('\n').filter(q => q.trim()).length} artículo(s) se crearán
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="agent-side-card">
              <div className="agent-side-title">Categoría y sección</div>
              <select className="agent-select" value={categoryId} onChange={(e) => {
                const cat = categories.find(c => c.id === Number(e.target.value))
                setCategoryId(Number(e.target.value))
                setCategoryName(cat?.name ?? '')
                setSectionId(0)
                setSectionName('')
              }}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="agent-select" value={sectionId} onChange={(e) => {
                const sec = sections.find(s => s.id === Number(e.target.value))
                setSectionId(Number(e.target.value))
                setSectionName(sec?.name ?? '')
              }}>
                <option value={0}>Seleccionar sección</option>
                {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="agent-side-card">
              <div className="agent-side-title">Países</div>
              <div className="agent-country-checks">
                {[
                  { label: 'pais_chile', name: 'Chile' },
                  { label: 'pais_mexico', name: 'México' },
                  { label: 'pais_colombia', name: 'Colombia' },
                  { label: 'pais_argentina', name: 'Argentina' },
                  { label: 'pais_todos', name: 'Todos los países' },
                ].map(({ label, name }) => (
                  <label key={label} className="agent-check-label">
                    <input type="checkbox" checked={selectedCountries.includes(label)} onChange={() => toggleCountry(label)} />
                    {name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13, background: '#fcebeb', color: '#a32d2d' }}>
              {error}
            </div>
          )}

          <button
            style={{ background: videoId && questions.trim() && !generating ? '#0ea5e9' : '#ccc', color: '#fff', border: 'none', borderRadius: 99, padding: '10px 24px', fontSize: 14, cursor: videoId && questions.trim() && !generating ? 'pointer' : 'not-allowed' }}
            onClick={generate}
            disabled={generating || !videoId || !questions.trim()}
          >
            {generating ? 'Generando artículos...' : 'Generar artículos desde video'}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--dark)', marginBottom: 4 }}>
                Se crearon {createdArticles.length} artículo(s) exitosamente
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Los artículos quedaron vinculados al video y pendientes de revisión.</p>
            </div>
            <button className="agent-nav-btn" onClick={() => { setCreatedArticles([]); setPreviewArticle(null) }}>
              Generar más artículos
            </button>
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {createdArticles.map((art) => (
                <div
                  key={art.id}
                  className="agent-side-card"
                  style={{ cursor: 'pointer', border: previewArticle?.id === art.id ? '2px solid #0ea5e9' : '0.5px solid var(--border)', opacity: art.published ? 0.6 : 1 }}
                  onClick={() => setPreviewArticle(art)}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--dark)', marginBottom: 8 }}>{art.title}</div>
                  {art.published ? (
                    <div style={{ fontSize: 12, color: '#3b6d11', background: '#eaf3de', padding: '4px 10px', borderRadius: 99, display: 'inline-block' }}>Publicado</div>
                  ) : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 99, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); publishArticle(art.id) }}
                        disabled={publishing === art.id}
                      >
                        {publishing === art.id ? 'Publicando...' : 'Publicar'}
                      </button>
                      <Link href={`/agentes/editar/${art.id}`} className="agent-action-btn" style={{ fontSize: 11 }} onClick={(e) => e.stopPropagation()}>
                        Editar
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {previewArticle ? (
              <div className="agent-side-card" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>{previewArticle.title}</h3>
                  {previewArticle.published && <div style={{ fontSize: 12, color: '#3b6d11', background: '#eaf3de', padding: '4px 10px', borderRadius: 99 }}>Publicado</div>}
                </div>
                <div className="article-body" dangerouslySetInnerHTML={{ __html: previewArticle.body ?? '' }} />
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 14, border: '0.5px dashed var(--border)', borderRadius: 'var(--radius)', minHeight: 300 }}>
                Haz clic en un artículo para previsualizarlo
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
