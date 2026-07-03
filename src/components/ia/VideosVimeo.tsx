'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface VimeoVideo {
  id: number
  vimeo_id: string
  title: string
  vimeo_url: string
  description: string
  last_synced_at: string
  articles: { id: number; title: string; status: string }[]
}

interface Article {
  id: number
  title: string
  status: string
  category_name: string
  section_name: string
}

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

type SubTab = 'gestionar' | 'generar'

export function VideosVimeo() {
  const [subTab, setSubTab] = useState<SubTab>('gestionar')
  const [videos, setVideos] = useState<VimeoVideo[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [newUrl, setNewUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [regenerating, setRegenerating] = useState<number | null>(null)
  const [regenerateResult, setRegenerateResult] = useState<Record<number, string>>({})
  const [expandedVideo, setExpandedVideo] = useState<number | null>(null)
  const [linkingVideo, setLinkingVideo] = useState<number | null>(null)
  const [articleSearch, setArticleSearch] = useState('')
  const [selectedArticles, setSelectedArticles] = useState<number[]>([])

  const [genVideoId, setGenVideoId] = useState<number | null>(null)
  const [genQuestions, setGenQuestions] = useState('')
  const [genCategoryId, setGenCategoryId] = useState<number>(0)
  const [genCategoryName, setGenCategoryName] = useState('')
  const [genSectionId, setGenSectionId] = useState<number>(0)
  const [genSectionName, setGenSectionName] = useState('')
  const [genCountries, setGenCountries] = useState<string[]>(['pais_todos'])
  const [generating, setGenerating] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [createdArticles, setCreatedArticles] = useState<CreatedArticle[]>([])
  const [previewArticle, setPreviewArticle] = useState<CreatedArticle | null>(null)
  const [publishing, setPublishing] = useState<number | null>(null)
  const [genError, setGenError] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [videosRes, artsRes, catRes, secRes] = await Promise.all([
      fetch('/api/agent/vimeo'),
      fetch('/api/agent/articles'),
      fetch('/api/agent/categories'),
      fetch('/api/agent/sections'),
    ])
    const videosData = await videosRes.json()
    const artsData = await artsRes.json()
    const catData = await catRes.json()
    const secData = await secRes.json()
    setVideos(videosData.videos ?? [])
    setArticles(artsData.articles ?? [])
    setCategories(catData.categories ?? [])
    setSections(secData.sections ?? [])
    if (catData.categories?.length > 0) {
      setGenCategoryId(catData.categories[0].id)
      setGenCategoryName(catData.categories[0].name)
    }
    setLoading(false)
  }

  async function addVideo() {
    if (!newUrl.trim()) return
    setAdding(true)
    const res = await fetch('/api/agent/vimeo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newUrl.trim() }),
    })
    if (res.ok) { setNewUrl(''); await loadData() }
    setAdding(false)
  }

  async function deleteVideo(id: number) {
    if (!confirm('¿Eliminar este video?')) return
    await fetch('/api/agent/vimeo', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await loadData()
  }

  async function regenerateFromVideo(videoId: number) {
    setRegenerating(videoId)
    setRegenerateResult(prev => ({ ...prev, [videoId]: '' }))
    const res = await fetch('/api/agent/regenerate-vimeo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId }),
    })
    const data = await res.json()
    if (res.ok) {
      setRegenerateResult(prev => ({ ...prev, [videoId]: `Se actualizaron ${data.updated.length} articulo(s)` }))
      await loadData()
    } else {
      setRegenerateResult(prev => ({ ...prev, [videoId]: `Error: ${data.error}` }))
    }
    setRegenerating(null)
  }

  async function linkArticles(videoId: number) {
    for (const articleId of selectedArticles) {
      await fetch(`/api/agent/vimeo/${videoId}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      })
    }
    setLinkingVideo(null)
    setSelectedArticles([])
    setArticleSearch('')
    await loadData()
  }

  async function unlinkArticle(videoId: number, articleId: number) {
    await fetch(`/api/agent/vimeo/${videoId}/articles`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: articleId }),
    })
    await loadData()
  }

  async function suggestFromVideo() {
    if (!genVideoId) { setGenError('Selecciona un video primero'); return }
    setSuggesting(true)
    setGenError('')
    const res = await fetch('/api/agent/suggest-from-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: genVideoId }),
    })
    const data = await res.json()
    if (res.ok) {
      setGenQuestions(data.questions.join('\n'))
    } else {
      setGenError(`Error: ${data.error}`)
    }
    setSuggesting(false)
  }

  async function generateFromVideo() {
    if (!genVideoId || !genQuestions.trim()) { setGenError('Selecciona un video e ingresa preguntas'); return }
    setGenerating(true)
    setGenError('')
    setCreatedArticles([])

    const questionList = genQuestions.split('\n').map(q => q.trim()).filter(q => q.length > 0)

    const res = await fetch('/api/agent/generate-from-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: genVideoId,
        questions: questionList,
        category_id: genCategoryId,
        category_name: genCategoryName,
        section_id: genSectionId,
        section_name: genSectionName,
        label_names: genCountries,
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
      setGenQuestions('')
    } else {
      setGenError(`Error: ${data.error}`)
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

  const filteredSections = sections.filter(s => s.category_id === genCategoryId)

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '0.5px solid var(--border)', paddingBottom: 0 }}>
        <button className={`ia-tab ${subTab === 'gestionar' ? 'active' : ''}`} onClick={() => setSubTab('gestionar')}>
          Gestionar videos
        </button>
        <button className={`ia-tab ${subTab === 'generar' ? 'active' : ''}`} onClick={() => setSubTab('generar')}>
          Generar artículos desde video
        </button>
      </div>

      {subTab === 'gestionar' && (
        <div>
          <div className="agent-side-card" style={{ marginBottom: 24 }}>
            <div className="agent-side-title">Agregar video de Vimeo</div>
            <p className="agent-side-desc">Pega la URL del video. Se obtendrá el título y la transcripción automáticamente.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="agent-input" type="url" placeholder="https://vimeo.com/123456789" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addVideo()} />
              <button className="agent-nav-btn primary" onClick={addVideo} disabled={adding}>{adding ? 'Agregando...' : '+ Agregar'}</button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {videos.length === 0 && <div className="agent-empty">No hay videos registrados aún.</div>}
            {videos.map((v) => (
              <div key={v.id} className="agent-side-card" style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1 }}>
                    <div style={{ width: 80, height: 50, background: 'linear-gradient(135deg, #704EFD, #2CB7FF)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, flexShrink: 0 }}>&#9654;</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--dark)', marginBottom: 2 }}>{v.title}</div>
                      <a href={v.vimeo_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--purple)' }}>{v.vimeo_url}</a>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {v.last_synced_at ? `Sincronizado ${new Date(v.last_synced_at).toLocaleDateString('es-CL')}` : 'Sin sincronizar'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span className="agent-tag">{v.articles.length} artículo(s)</span>
                    <button className="agent-nav-btn primary" onClick={() => regenerateFromVideo(v.id)} disabled={regenerating === v.id || v.articles.length === 0} style={{ fontSize: 12, padding: '5px 12px' }}>
                      {regenerating === v.id ? 'Actualizando...' : 'Actualizar con video'}
                    </button>
                    <button className="agent-action-btn" onClick={() => setExpandedVideo(expandedVideo === v.id ? null : v.id)}>
                      {expandedVideo === v.id ? 'Ocultar' : 'Ver artículos'}
                    </button>
                    <button className="agent-url-remove" onClick={() => deleteVideo(v.id)}>✕</button>
                  </div>
                </div>

                {regenerateResult[v.id] && (
                  <div style={{ padding: '8px 18px', fontSize: 13, background: regenerateResult[v.id].startsWith('Error') ? '#fcebeb' : '#eaf3de', color: regenerateResult[v.id].startsWith('Error') ? '#a32d2d' : '#3b6d11' }}>
                    {regenerateResult[v.id]}
                  </div>
                )}

                {expandedVideo === v.id && (
                  <div style={{ borderTop: '0.5px solid var(--border)', padding: '14px 18px', background: '#f8f8fc' }}>
                    <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>Artículos vinculados:</div>
                    {v.articles.length === 0 ? (
                      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>No hay artículos vinculados.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                        {v.articles.map((art) => (
                          <div key={art.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--border)' }}>
                            <span style={{ fontSize: 13, flex: 1 }}>{art.title}</span>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span className={`agent-status ${art.status}`}>{art.status === 'published' ? 'Publicado' : art.status === 'draft' ? 'Borrador' : 'Pendiente'}</span>
                              <Link href={`/agentes/editar/${art.id}`} className="agent-action-btn" style={{ fontSize: 11 }}>Editar</Link>
                              <button className="agent-url-remove" onClick={() => unlinkArticle(v.id, art.id)}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {linkingVideo === v.id ? (
                      <div className="agent-side-card" style={{ background: '#fff' }}>
                        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>
                          Selecciona artículos para vincular
                          {selectedArticles.length > 0 && <span className="agent-tag" style={{ marginLeft: 8 }}>{selectedArticles.length} seleccionados</span>}
                        </div>
                        <input className="agent-search" type="text" placeholder="Buscar artículo..." value={articleSearch} onChange={(e) => setArticleSearch(e.target.value)} style={{ marginBottom: 10 }} autoFocus />
                        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {articles.filter(a => !v.articles.some(va => va.id === a.id) && a.title.toLowerCase().includes(articleSearch.toLowerCase())).map(a => (
                            <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: selectedArticles.includes(a.id) ? 'var(--lp)' : 'transparent', border: `0.5px solid ${selectedArticles.includes(a.id) ? 'var(--purple)' : 'transparent'}` }}>
                              <input type="checkbox" checked={selectedArticles.includes(a.id)} onChange={() => setSelectedArticles(prev => prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id])} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, color: 'var(--dark)' }}>{a.title}</div>
                                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.category_name} · {a.section_name}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button className="agent-nav-btn primary" onClick={() => linkArticles(v.id)} disabled={selectedArticles.length === 0}>
                            Vincular {selectedArticles.length > 0 ? `(${selectedArticles.length})` : ''}
                          </button>
                          <button className="agent-nav-btn" onClick={() => { setLinkingVideo(null); setSelectedArticles([]); setArticleSearch('') }}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <button className="agent-action-btn" onClick={() => setLinkingVideo(v.id)}>+ Vincular artículos</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'generar' && (
        <div>
          {createdArticles.length === 0 ? (
            <div style={{ maxWidth: 800 }}>
              <div className="agent-side-card" style={{ marginBottom: 16 }}>
                <div className="agent-side-title">Seleccionar video</div>
                <p className="agent-side-desc">Selecciona el video de Vimeo desde el que se generarán los artículos.</p>
                <select className="agent-select" value={genVideoId ?? ''} onChange={(e) => setGenVideoId(Number(e.target.value) || null)}>
                  <option value="">Seleccionar video...</option>
                  {videos.map(v => <option key={v.id} value={v.id}>{v.title || v.vimeo_url}</option>)}
                </select>
                {videos.length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>No hay videos registrados. Ve a "Gestionar videos" para agregar uno.</p>
                )}
              </div>

              <div className="agent-side-card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div className="agent-side-title">Preguntas a responder</div>
                  <button className="agent-nav-btn" onClick={suggestFromVideo} disabled={suggesting || !genVideoId} style={{ fontSize: 12 }}>
                    {suggesting ? 'Sugiriendo...' : 'Sugerir desde transcripción'}
                  </button>
                </div>
                <p className="agent-side-desc">Escribe una pregunta por línea o usa "Sugerir desde transcripción" para generarlas automáticamente.</p>
                <textarea
                  className="agent-textarea"
                  placeholder={`¿Cómo inicio sesión?\n¿Cómo actualizo mis datos?\n¿Cómo cambio mi contraseña?`}
                  value={genQuestions}
                  onChange={(e) => setGenQuestions(e.target.value)}
                  rows={6}
                />
                {genQuestions.trim() && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                    {genQuestions.split('\n').filter(q => q.trim()).length} artículo(s) se crearán
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="agent-side-card">
                  <div className="agent-side-title">Categoría y sección</div>
                  <select className="agent-select" value={genCategoryId} onChange={(e) => {
                    const cat = categories.find(c => c.id === Number(e.target.value))
                    setGenCategoryId(Number(e.target.value))
                    setGenCategoryName(cat?.name ?? '')
                    setGenSectionId(0)
                    setGenSectionName('')
                  }}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select className="agent-select" value={genSectionId} onChange={(e) => {
                    const sec = sections.find(s => s.id === Number(e.target.value))
                    setGenSectionId(Number(e.target.value))
                    setGenSectionName(sec?.name ?? '')
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
                        <input type="checkbox" checked={genCountries.includes(label)} onChange={() => setGenCountries(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label])} />
                        {name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {genError && (
                <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13, background: '#fcebeb', color: '#a32d2d' }}>
                  {genError}
                </div>
              )}

              <button className="agent-nav-btn primary" onClick={generateFromVideo} disabled={generating || !genVideoId || !genQuestions.trim()} style={{ padding: '10px 24px', fontSize: 14 }}>
                {generating ? 'Generando artículos...' : 'Generar artículos desde video'}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--dark)', marginBottom: 4 }}>Se crearon {createdArticles.length} artículo(s) exitosamente</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>Revisa cada artículo y publícalo cuando esté listo.</p>
                </div>
                <button className="agent-nav-btn" onClick={() => { setCreatedArticles([]); setPreviewArticle(null) }}>Generar más</button>
              </div>

              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {createdArticles.map((art) => (
                    <div key={art.id} className="agent-side-card" style={{ cursor: 'pointer', border: previewArticle?.id === art.id ? '2px solid var(--purple)' : '0.5px solid var(--border)', opacity: art.published ? 0.6 : 1 }} onClick={() => setPreviewArticle(art)}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--dark)', marginBottom: 8 }}>{art.title}</div>
                      {art.published ? (
                        <div style={{ fontSize: 12, color: '#3b6d11', background: '#eaf3de', padding: '4px 10px', borderRadius: 99, display: 'inline-block' }}>Publicado</div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="agent-nav-btn primary" onClick={(e) => { e.stopPropagation(); publishArticle(art.id) }} disabled={publishing === art.id} style={{ fontSize: 11, padding: '4px 10px' }}>
                            {publishing === art.id ? 'Publicando...' : 'Publicar'}
                          </button>
                          <Link href={`/agentes/editar/${art.id}`} className="agent-action-btn" style={{ fontSize: 11 }} onClick={(e) => e.stopPropagation()}>Editar</Link>
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
      )}
    </div>
  )
}
