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

export function VideosVimeo() {
  const [videos, setVideos] = useState<VimeoVideo[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [newUrl, setNewUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [regenerating, setRegenerating] = useState<number | null>(null)
  const [regenerateResult, setRegenerateResult] = useState<Record<number, string>>({})
  const [expandedVideo, setExpandedVideo] = useState<number | null>(null)
  const [linkingVideo, setLinkingVideo] = useState<number | null>(null)
  const [articleSearch, setArticleSearch] = useState('')
  const [selectedArticles, setSelectedArticles] = useState<number[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [videosRes, artsRes] = await Promise.all([
      fetch('/api/agent/vimeo'),
      fetch('/api/agent/articles'),
    ])
    const videosData = await videosRes.json()
    const artsData = await artsRes.json()
    setVideos(videosData.videos ?? [])
    setArticles(artsData.articles ?? [])
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
    if (res.ok) {
      setNewUrl('')
      await loadData()
    }
    setAdding(false)
  }

  async function deleteVideo(id: number) {
    if (!confirm('¿Eliminar este video?')) return
    await fetch('/api/agent/vimeo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
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
      setRegenerateResult(prev => ({ ...prev, [videoId]: `✅ ${data.updated.length} artículo(s) actualizados y pendientes de revisión` }))
      await loadData()
    } else {
      setRegenerateResult(prev => ({ ...prev, [videoId]: `❌ Error: ${data.error}` }))
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

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div>
      <div className="agent-side-card" style={{ marginBottom: 24 }}>
        <div className="agent-side-title">Agregar video de Vimeo</div>
        <p className="agent-side-desc">Pega la URL del video de Vimeo. Se obtendrá automáticamente el título y la transcripción.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="agent-input"
            type="url"
            placeholder="https://vimeo.com/123456789"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addVideo()}
          />
          <button className="agent-nav-btn primary" onClick={addVideo} disabled={adding}>
            {adding ? 'Agregando...' : '+ Agregar video'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {videos.length === 0 && <div className="agent-empty">No hay videos de Vimeo registrados aún.</div>}
        {videos.map((v) => (
          <div key={v.id} className="agent-side-card" style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', flex: 1 }}>
                <div style={{ width: 80, height: 50, background: 'linear-gradient(135deg, #704EFD, #2CB7FF)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, flexShrink: 0 }}>▶</div>
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
                <button
                  className="agent-nav-btn primary"
                  onClick={() => regenerateFromVideo(v.id)}
                  disabled={regenerating === v.id || v.articles.length === 0}
                  style={{ fontSize: 12, padding: '5px 12px' }}
                  title={v.articles.length === 0 ? 'Vincula artículos primero' : ''}
                >
                  {regenerating === v.id ? 'Actualizando...' : '🎬 Actualizar con video'}
                </button>
                <button className="agent-action-btn" onClick={() => setExpandedVideo(expandedVideo === v.id ? null : v.id)}>
                  {expandedVideo === v.id ? 'Ocultar' : 'Ver artículos'}
                </button>
                <button className="agent-url-remove" onClick={() => deleteVideo(v.id)}>✕</button>
              </div>
            </div>

            {regenerateResult[v.id] && (
              <div style={{ padding: '8px 18px', fontSize: 13, background: regenerateResult[v.id].startsWith('✅') ? '#eaf3de' : '#fcebeb', color: regenerateResult[v.id].startsWith('✅') ? '#3b6d11' : '#a32d2d' }}>
                {regenerateResult[v.id]}
              </div>
            )}

            {expandedVideo === v.id && (
              <div style={{ borderTop: '0.5px solid var(--border)', padding: '14px 18px', background: '#f8f8fc' }}>
                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>Artículos vinculados:</div>
                {v.articles.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>No hay artículos vinculados aún.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {v.articles.map((art) => (
                      <div key={art.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--border)' }}>
                        <span style={{ fontSize: 13, flex: 1 }}>{art.title}</span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className={`agent-status ${art.status}`}>
                            {art.status === 'published' ? 'Publicado' : art.status === 'draft' ? 'Borrador' : 'Pendiente'}
                          </span>
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
                    <input
                      className="agent-search"
                      type="text"
                      placeholder="Buscar artículo por título..."
                      value={articleSearch}
                      onChange={(e) => setArticleSearch(e.target.value)}
                      style={{ marginBottom: 10 }}
                      autoFocus
                    />
                    <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {articles
                        .filter(a => !v.articles.some(va => va.id === a.id) && a.title.toLowerCase().includes(articleSearch.toLowerCase()))
                        .map(a => (
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
  )
}
