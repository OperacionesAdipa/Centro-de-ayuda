'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SourceUrl {
  id: number
  url: string
  name: string
  description: string
  last_fetched_at: string
  articles: { id: number; title: string; status: string }[]
}

interface Article {
  id: number
  title: string
  status: string
  category_name: string
  section_name: string
}

export function ActualizarArticulos() {
  const [urls, setUrls] = useState<SourceUrl[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchUrl, setSearchUrl] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const [regenerating, setRegenerating] = useState<number | null>(null)
  const [regenerateResult, setRegenerateResult] = useState<Record<number, string>>({})
  const [expandedUrl, setExpandedUrl] = useState<number | null>(null)
  const [linkingUrl, setLinkingUrl] = useState<number | null>(null)
  const [articleSearch, setArticleSearch] = useState('')
  const [selectedArticles, setSelectedArticles] = useState<number[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [urlsRes, artsRes] = await Promise.all([
      fetch('/api/agent/urls'),
      fetch('/api/agent/articles'),
    ])
    const urlsData = await urlsRes.json()
    const artsData = await artsRes.json()
    setUrls(urlsData.urls ?? [])
    setArticles(artsData.articles ?? [])
    setLoading(false)
  }

  async function addUrl() {
    if (!newUrl.trim()) return
    setAdding(true)
    await fetch('/api/agent/urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newUrl.trim(), name: newName.trim() || newUrl.trim(), description: newDesc.trim() }),
    })
    setNewUrl(''); setNewName(''); setNewDesc('')
    await loadData()
    setAdding(false)
  }

  async function deleteUrl(id: number) {
    if (!confirm('¿Eliminar esta URL?')) return
    await fetch('/api/agent/urls', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await loadData()
  }

  async function regenerate(urlId: number) {
    setRegenerating(urlId)
    setRegenerateResult(prev => ({ ...prev, [urlId]: '' }))
    const res = await fetch('/api/agent/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url_id: urlId }),
    })
    const data = await res.json()
    if (res.ok) {
      setRegenerateResult(prev => ({ ...prev, [urlId]: `Se actualizaron ${data.updated.length} artículo(s) y quedaron pendientes de revisión` }))
      await loadData()
    } else {
      setRegenerateResult(prev => ({ ...prev, [urlId]: `Error: ${data.error}` }))
    }
    setRegenerating(null)
  }

  async function linkArticles(urlId: number) {
    for (const articleId of selectedArticles) {
      await fetch(`/api/agent/urls/${urlId}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      })
    }
    setLinkingUrl(null)
    setSelectedArticles([])
    setArticleSearch('')
    await loadData()
  }

  async function unlinkArticle(urlId: number, articleId: number) {
    await fetch(`/api/agent/urls/${urlId}/articles`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: articleId }),
    })
    await loadData()
  }

  const filteredUrls = urls.filter(u =>
    u.name?.toLowerCase().includes(searchUrl.toLowerCase()) ||
    u.url?.toLowerCase().includes(searchUrl.toLowerCase())
  )

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div>
      <div className="agent-side-card" style={{ marginBottom: 24 }}>
        <div className="agent-side-title">Agregar nueva URL de referencia</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10 }}>
          <input className="agent-input" type="url" placeholder="https://adipa.cl/..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
          <input className="agent-input" type="text" placeholder="Nombre descriptivo" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className="agent-input" type="text" placeholder="Descripción (opcional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <button className="agent-nav-btn primary" onClick={addUrl} disabled={adding}>
            {adding ? 'Agregando...' : '+ Agregar'}
          </button>
        </div>
      </div>

      <input
        className="agent-search"
        type="text"
        placeholder="Buscar por nombre o URL..."
        value={searchUrl}
        onChange={(e) => setSearchUrl(e.target.value)}
        style={{ marginBottom: 16, width: '100%' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredUrls.length === 0 && <div className="agent-empty">No se encontraron URLs.</div>}
        {filteredUrls.map((u) => (
          <div key={u.id} className="agent-side-card" style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--dark)', marginBottom: 2 }}>{u.name}</div>
                <a href={u.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--purple)' }}>{u.url}</a>
                {u.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{u.description}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span className="agent-tag">{u.articles.length} artículo(s)</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {u.last_fetched_at ? `Actualizado ${new Date(u.last_fetched_at).toLocaleDateString('es-CL')}` : 'Nunca actualizado'}
                </span>
                <button
                  className="agent-nav-btn primary"
                  onClick={() => regenerate(u.id)}
                  disabled={regenerating === u.id || u.articles.length === 0}
                  style={{ fontSize: 12, padding: '5px 12px' }}
                >
                  {regenerating === u.id ? 'Actualizando...' : 'Actualizar artículos'}
                </button>
                <button className="agent-action-btn" onClick={() => setExpandedUrl(expandedUrl === u.id ? null : u.id)}>
                  {expandedUrl === u.id ? 'Ocultar' : 'Ver artículos'}
                </button>
                <button className="agent-url-remove" onClick={() => deleteUrl(u.id)}>✕</button>
              </div>
            </div>

            {regenerateResult[u.id] && (
              <div style={{ padding: '8px 18px', fontSize: 13, background: regenerateResult[u.id].startsWith('Error') ? '#fcebeb' : '#eaf3de', color: regenerateResult[u.id].startsWith('Error') ? '#a32d2d' : '#3b6d11' }}>
                {regenerateResult[u.id]}
              </div>
            )}

            {expandedUrl === u.id && (
              <div style={{ borderTop: '0.5px solid var(--border)', padding: '14px 18px', background: '#f8f8fc' }}>
                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 10 }}>Artículos vinculados:</div>
                {u.articles.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>No hay artículos vinculados aún.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {u.articles.map((art) => (
                      <div key={art.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--border)' }}>
                        <span style={{ fontSize: 13, flex: 1 }}>{art.title}</span>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className={`agent-status ${art.status}`}>
                            {art.status === 'published' ? 'Publicado' : art.status === 'draft' ? 'Borrador' : 'Pendiente'}
                          </span>
                          <Link href={`/agentes/editar/${art.id}`} className="agent-action-btn" style={{ fontSize: 11 }}>Editar</Link>
                          <button className="agent-url-remove" onClick={() => unlinkArticle(u.id, art.id)}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {linkingUrl === u.id ? (
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
                        .filter(a => !u.articles.some(ua => ua.id === a.id) && a.title.toLowerCase().includes(articleSearch.toLowerCase()))
                        .map(a => (
                          <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: selectedArticles.includes(a.id) ? 'var(--lp)' : 'transparent', border: `0.5px solid ${selectedArticles.includes(a.id) ? 'var(--purple)' : 'transparent'}` }}>
                            <input type="checkbox" checked={selectedArticles.includes(a.id)} onChange={() => setSelectedArticles(prev => prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id])} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, color: 'var(--dark)' }}>{a.title}</div>
                              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.category_name} · {a.section_name}</div>
                            </div>
                            <span className={`agent-status ${a.status}`} style={{ fontSize: 11 }}>
                              {a.status === 'published' ? 'Publicado' : a.status === 'draft' ? 'Borrador' : 'Pendiente'}
                            </span>
                          </label>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button className="agent-nav-btn primary" onClick={() => linkArticles(u.id)} disabled={selectedArticles.length === 0}>
                        Vincular {selectedArticles.length > 0 ? `(${selectedArticles.length})` : ''}
                      </button>
                      <button className="agent-nav-btn" onClick={() => { setLinkingUrl(null); setSelectedArticles([]); setArticleSearch('') }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button className="agent-action-btn" onClick={() => setLinkingUrl(u.id)}>+ Vincular artículos</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
