'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Article {
  id: number
  title: string
  category_name: string
  section_name: string
  status: string
  promoted: boolean
  view_count: number
  updated_at: string
  label_names: string[]
}

export default function AgentesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCat, setFilterCat] = useState('all')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const token = localStorage.getItem('agent_token')
    if (!token) { router.push('/acceso'); return }

    fetch('/api/agent/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then((r) => {
      if (!r.ok) { router.push('/acceso') }
      else loadArticles()
    })
  }, [])

  async function loadArticles() {
    const res = await fetch('/api/agent/articles')
    const data = await res.json()
    setArticles(data.articles ?? [])
    const cats = [...new Set((data.articles ?? []).map((a: Article) => a.category_name).filter(Boolean))] as string[]
    setCategories(cats)
    setLoading(false)
  }

  function logout() {
    localStorage.removeItem('agent_token')
    router.push('/acceso')
  }

  const filtered = articles.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    const matchCat = filterCat === 'all' || a.category_name === filterCat
    return matchSearch && matchStatus && matchCat
  })

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div className="agent-wrap">
      <div className="agent-header">
        <div className="agent-header-left">
          <img src="https://adipa.cl/content/uploads/2022/10/logo-adipa.svg" alt="ADIPA" style={{ height: 28 }} />
          <span className="agent-header-title">Portal de agentes</span>
        </div>
        <div className="agent-header-right">
          <Link href="/" className="agent-nav-btn" target="_blank">Ver sitio</Link>
          <Link href="/agentes/nuevo" className="agent-nav-btn primary">+ Nuevo artículo</Link>
          <button className="agent-nav-btn" onClick={logout}>Cerrar sesión</button>
        </div>
      </div>

      <div className="agent-body">
        <div className="agent-stats">
          <div className="agent-stat"><div className="agent-stat-n">{articles.length}</div><div className="agent-stat-l">Total artículos</div></div>
          <div className="agent-stat"><div className="agent-stat-n">{articles.filter(a => a.status === 'published').length}</div><div className="agent-stat-l">Publicados</div></div>
          <div className="agent-stat"><div className="agent-stat-n">{articles.filter(a => a.status === 'draft').length}</div><div className="agent-stat-l">Borradores</div></div>
          <div className="agent-stat"><div className="agent-stat-n">{articles.filter(a => a.status === 'pending_review').length}</div><div className="agent-stat-l">Pendientes</div></div>
          <div className="agent-stat"><div className="agent-stat-n">{articles.filter(a => a.promoted).length}</div><div className="agent-stat-l">Destacados</div></div>
        </div>

        <div className="agent-filters">
          <input
            className="agent-search"
            type="text"
            placeholder="Buscar artículo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="agent-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
            <option value="pending_review">Pendientes de revisión</option>
          </select>
          <select className="agent-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="all">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="agent-table-wrap">
          <table className="agent-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Categoría</th>
                <th>Sección</th>
                <th>País</th>
                <th>Estado</th>
                <th>Vistas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((art) => (
                <tr key={art.id}>
                  <td className="agent-td-title">{art.title}</td>
                  <td>{art.category_name}</td>
                  <td>{art.section_name}</td>
                  <td>
                    <div className="agent-tags">
                      {(art.label_names ?? []).filter(l => l.startsWith('pais_') || l === 'pais_todos').map(l => (
                        <span key={l} className="agent-tag">{l.replace('pais_', '')}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`agent-status ${art.status}`}>
                      {art.status === 'published' ? 'Publicado' : art.status === 'draft' ? 'Borrador' : 'Pendiente'}
                    </span>
                  </td>
                  <td>{art.view_count}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/agentes/editar/${art.id}`} className="agent-action-btn">Editar</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="agent-empty">No se encontraron artículos.</div>
          )}
        </div>
      </div>
    </div>
  )
}
