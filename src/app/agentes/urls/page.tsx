'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SourceUrl {
  id: number
  url: string
  name: string
  description: string
  last_fetched_at: string
  created_at: string
  articles: { id: number; title: string; status: string }[]
}

interface Article {
  id: number
  title: string
  status: string
}

export default function UrlsPage() {
  const router = useRouter()
  const [urls, setUrls] = useState<SourceUrl[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [newUrl, setNewUrl] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [adding, setAdding] = useState(false)
  const [regenerating, setRegenerating] = useState<number | null>(null)
  const [regenerateResult, setRegenerateResult] = useState<Record<number, string>>({})
  const [expandedUrl, setExpandedUrl] = useState<number | null>(null)
  const [linkingArticle, setLinkingArticle] = useState<number | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<number>(0)

  useEffect(() => {
    const token = localStorage.getItem('agent_token')
    if (!token) { router.push('/acceso'); return }

    fetch('/api/agent/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then((r) => {
      if (!r.ok) router.push('/acceso')
      else loadData()
    })
  }, [])

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
    const res = await fetch('/api/agent/urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newUrl.trim(), name: newName.trim() || newUrl.trim(), description: newDesc.trim() }),
    })
    if (res.ok) {
      setNewUrl('')
      setNewName('')
      setNewDesc('')
      await loadData()
    }
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
      setRegenerateResult(prev => ({ ...prev, [urlId]: `✅ ${data.updated.length} artículo(s) actualizados y pendientes de revisión` }))
      await loadData()
    } else {
      setRegenerateResult(prev => ({ ...prev, [urlId]: `❌ Error: ${data.error}` }))
    }
    setRegenerating(null)
  }

  async function linkArticle(urlId: number) {
    if (!selectedArticle) return
    await fetch(`/api/agent/urls/${urlId}/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: selectedArticle }),
    })
    setLinkingArticle(null)
    setSelectedArticle(0)
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

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div className="agent-wrap">
      <div className="agent-header">
        <div className="agent-header-left">
          <img src="https://adipa.cl/content/uploads/2022/10/logo-adipa.svg" alt="ADIPA" style={{ height: 28 }} />
          <span className="agent-header-title">URLs de referencia</span>
        </div>
        <div className="agent-header-right">
          <Link href="/agentes" className="agent-nav-btn">Volver</Link>
        </div>
      </div>

      <div className="agent-body">
        <div className="agent-side-card" style={{ marginBottom: 24 }}>
          <div className="agent-side-title">Agregar nueva URL</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input className="agent-input" type="url" placeholder="https://adipa.cl/..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} style={{ flex: 2, minWidth: 200 }} />
            <input className="agent-input" type="text" placeholder="Nombre descriptivo" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ flex: 1, minWidth: 150 }} />
            <input className="agent-input" type="text" placeholder="Descripción (opcional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} style={{ flex: 1, minWidth: 150 }} />
            <button className="agent-nav-btn primary" onClick={addUrl} disabled={adding}>
              {adding ? 'Agregando...' : '+ Agregar'}
            </button>
          </div>
        </div>

        <div className="agent-table-wrap">
          <table className="agent-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Artículos vinculados</th>
                <th>Última actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {urls.map((u) => (
                <>
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--dark)', marginBottom: 2 }}>{u.name}</div>
                      <a href={u.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--purple)' }}>{u.url}</a>
                      {u.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{u.description}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="agent-tag">{u.articles.length} artículo(s)</span>
                        <button
                          className="agent-action-btn"
                          onClick={() => setExpandedUrl(expandedUrl === u.id ? null : u.id)}
                        >
                          {expandedUrl === u.id ? 'Ocultar' : 'Ver'}
                        </button>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {u.last_fetched_at
                        ? new Date(u.last_fetched_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Nunca'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          className="agent-nav-btn primary"
                          onClick={() => regenerate(u.id)}
                          disabled={regenerating === u.id || u.articles.length === 0}
                          style={{ fontSize: 12, padding: '5px 10px' }}
                        >
                          {regenerating === u.id ? 'Actualizando...' : '🔄 Actualizar artículos'}
                        </button>
                        <button className="agent-action-btn" onClick={() => deleteUrl(u.id)}>Eliminar</button>
                      </div>
                      {regenerateResult[u.id] && (
                        <div style={{ fontSize: 12, marginTop: 6, color: regenerateResult[u.id].startsWith('✅') ? '#3b6d11' : '#e24b4a' }}>
                          {regenerateResult[u.id]}
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedUrl === u.id && (
                    <tr key={`${u.id}-expanded`}>
                      <td colSpan={4} style={{ background: '#f8f8fc', padding: '12px 16px' }}>
                        <div style={{ marginBottom: 10, fontWeight: 500, fontSize: 13 }}>Artículos vinculados a esta URL:</div>
                        {u.articles.length === 0 ? (
                          <p style={{ fontSize: 13, color: 'var(--muted)' }}>No hay artículos vinculados aún.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                            {u.articles.map((art) => (
                              <div key={art.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '8px 12px', borderRadius: 8, border: '0.5px solid var(--border)' }}>
                                <span style={{ fontSize: 13 }}>{art.title}</span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <span className={`agent-status ${art.status}`}>{art.status === 'published' ? 'Publicado' : art.status === 'draft' ? 'Borrador' : 'Pendiente'}</span>
                                  <button className="agent-url-remove" onClick={() => unlinkArticle(u.id, art.id)}>✕</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {linkingArticle === u.id ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <select className="agent-select" value={selectedArticle} onChange={(e) => setSelectedArticle(Number(e.target.value))}>
                              <option value={0}>Seleccionar artículo...</option>
                              {articles
                                .filter(a => !u.articles.some(ua => ua.id === a.id))
                                .map(a => <option key={a.id} value={a.id}>{a.title}</option>)
                              }
                            </select>
                            <button className="agent-nav-btn primary" onClick={() => linkArticle(u.id)} style={{ fontSize: 12 }}>Vincular</button>
                            <button className="agent-nav-btn" onClick={() => setLinkingArticle(null)} style={{ fontSize: 12 }}>Cancelar</button>
                          </div>
                        ) : (
                          <button className="agent-action-btn" onClick={() => setLinkingArticle(u.id)}>+ Vincular artículo</button>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          {urls.length === 0 && <div className="agent-empty">No hay URLs registradas aún.</div>}
        </div>
      </div>
    </div>
  )
}
