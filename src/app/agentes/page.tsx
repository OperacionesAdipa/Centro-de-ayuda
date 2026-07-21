'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AgentNav } from '@/components/AgentNav'

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
  source_urls: string[]
  needs_images: boolean
}

interface Category { id: number; name: string }
interface Section { id: number; category_id: number; name: string }

export default function AgentesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCat, setFilterCat] = useState('all')
  const [categoryNames, setCategoryNames] = useState<string[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [bulkAction, setBulkAction] = useState('')
  const [bulkCategory, setBulkCategory] = useState<number>(0)
  const [bulkSection, setBulkSection] = useState<number>(0)
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [showBulkPanel, setShowBulkPanel] = useState(false)

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
    const [artsRes, catRes, secRes] = await Promise.all([
      fetch('/api/agent/articles'),
      fetch('/api/agent/categories'),
      fetch('/api/agent/sections'),
    ])
    const artsData = await artsRes.json()
    const catData = await catRes.json()
    const secData = await secRes.json()
    setArticles(artsData.articles ?? [])
    setCategories(catData.categories ?? [])
    setSections(secData.sections ?? [])
    const cats = [...new Set((artsData.articles ?? []).map((a: Article) => a.category_name).filter(Boolean))] as string[]
    setCategoryNames(cats)
    setLoading(false)
  }

  const filtered = articles.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all'
      ? true
      : filterStatus === 'no_url' ? (!a.source_urls || a.source_urls.length === 0)
      : filterStatus === 'needs_images' ? a.needs_images === true
      : a.status === filterStatus
    const matchCat = filterCat === 'all' || a.category_name === filterCat
    return matchSearch && matchStatus && matchCat
  })

  function toggleSelect(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleSelectAll() {
    if (selected.length === filtered.length) {
      setSelected([])
    } else {
      setSelected(filtered.map(a => a.id))
    }
  }

  async function applyBulkAction() {
    if (!bulkAction || selected.length === 0) return
    setBulkProcessing(true)

    if (bulkAction === 'delete') {
      if (!confirm(`¿Eliminar ${selected.length} artículo(s)? Esta acción no se puede deshacer.`)) {
        setBulkProcessing(false)
        return
      }
      for (const id of selected) {
        await fetch(`/api/agent/articles/${id}`, { method: 'DELETE' })
      }
    }

    if (bulkAction === 'status' && bulkStatus) {
      for (const id of selected) {
        await fetch(`/api/agent/articles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: bulkStatus }),
        })
      }
    }

    if (bulkAction === 'move' && bulkCategory) {
      const cat = categories.find(c => c.id === bulkCategory)
      const sec = sections.find(s => s.id === bulkSection)
      for (const id of selected) {
        await fetch(`/api/agent/articles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category_id: bulkCategory,
            category_name: cat?.name ?? '',
            section_id: bulkSection || null,
            section_name: sec?.name ?? '',
          }),
        })
      }
    }

    setSelected([])
    setBulkAction('')
    setBulkStatus('')
    setBulkCategory(0)
    setBulkSection(0)
    setShowBulkPanel(false)
    await loadData()
    setBulkProcessing(false)
  }

  const stats = [
    { label: 'Total artículos', value: articles.length, filter: 'all' },
    { label: 'Publicados', value: articles.filter(a => a.status === 'published').length, filter: 'published' },
    { label: 'Borradores', value: articles.filter(a => a.status === 'draft').length, filter: 'draft' },
    { label: 'Pendientes', value: articles.filter(a => a.status === 'pending_review').length, filter: 'pending_review' },
    { label: 'Sin URL', value: articles.filter(a => !a.source_urls || a.source_urls.length === 0).length, filter: 'no_url' },
    { label: 'Faltan imágenes', value: articles.filter(a => a.needs_images).length, filter: 'needs_images' },
  ]

  const filteredSections = sections.filter(s => s.category_id === bulkCategory)

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div className="agent-wrap">
      <AgentNav />

      <div className="agent-body">
        <div className="agent-stats" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {stats.map(({ label, value, filter }) => (
            <button
              key={filter}
              className="agent-stat"
              onClick={() => setFilterStatus(filter)}
              style={{
                cursor: 'pointer',
                border: filterStatus === filter ? '2px solid var(--purple)' : '0.5px solid var(--border)',
                background: filterStatus === filter ? 'var(--lp)' : '#fff',
                borderRadius: 'var(--radius)',
                transition: 'all 0.15s',
                textAlign: 'center',
              }}
            >
              <div className="agent-stat-n">{value}</div>
              <div className="agent-stat-l">{label}</div>
            </button>
          ))}
        </div>

        <div className="agent-filters">
          <input className="agent-search" type="text" placeholder="Buscar artículo..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="agent-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Todos los estados</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
            <option value="pending_review">Pendientes de revisión</option>
            <option value="no_url">Sin URL asociada</option>
            <option value="needs_images">Faltan imágenes</option>
          </select>
          <select className="agent-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="all">Todas las categorías</option>
            {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {selected.length > 0 && (
          <div style={{ background: 'var(--lp)', border: '1px solid var(--purple)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)' }}>{selected.length} artículo(s) seleccionados</span>
            <select className="agent-select" value={bulkAction} onChange={(e) => { setBulkAction(e.target.value); setShowBulkPanel(true) }} style={{ fontSize: 12 }}>
              <option value="">Seleccionar acción...</option>
              <option value="status">Cambiar estado</option>
              <option value="move">Mover a categoría</option>
              <option value="delete">Eliminar</option>
            </select>

            {bulkAction === 'status' && (
              <select className="agent-select" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} style={{ fontSize: 12 }}>
                <option value="">Seleccionar estado...</option>
                <option value="published">Publicado</option>
                <option value="draft">Borrador</option>
                <option value="pending_review">Pendiente de revisión</option>
              </select>
            )}

            {bulkAction === 'move' && (
              <>
                <select className="agent-select" value={bulkCategory} onChange={(e) => { setBulkCategory(Number(e.target.value)); setBulkSection(0) }} style={{ fontSize: 12 }}>
                  <option value={0}>Seleccionar categoría...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {bulkCategory > 0 && (
                  <select className="agent-select" value={bulkSection} onChange={(e) => setBulkSection(Number(e.target.value))} style={{ fontSize: 12 }}>
                    <option value={0}>Seleccionar sección...</option>
                    {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </>
            )}

            <button
              className="agent-nav-btn primary"
              onClick={applyBulkAction}
              disabled={bulkProcessing || !bulkAction || (bulkAction === 'status' && !bulkStatus) || (bulkAction === 'move' && !bulkCategory)}
              style={{ fontSize: 12 }}
            >
              {bulkProcessing ? 'Procesando...' : 'Aplicar'}
            </button>
            <button className="agent-nav-btn" onClick={() => { setSelected([]); setBulkAction(''); setBulkStatus(''); setBulkCategory(0); setBulkSection(0) }} style={{ fontSize: 12 }}>
              Cancelar
            </button>
          </div>
        )}

        <div className="agent-table-wrap">
          <table className="agent-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Título</th>
                <th>Categoría</th>
                <th>Sección</th>
                <th>País</th>
                <th>Estado</th>
                <th>Imágenes</th>
                <th>Vistas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((art) => (
                <tr key={art.id} style={{ background: selected.includes(art.id) ? 'var(--lp)' : 'transparent' }}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(art.id)}
                      onChange={() => toggleSelect(art.id)}
                    />
                  </td>
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
                  <td>
                    {art.needs_images && (
                      <span style={{ fontSize: 11, background: '#faeeda', color: '#854f0b', padding: '3px 8px', borderRadius: 99 }}>
                        Faltan imágenes
                      </span>
                    )}
                  </td>
                  <td>{art.view_count}</td>
                  <td>
                    <Link href={`/agentes/editar/${art.id}`} className="agent-action-btn">Editar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="agent-empty">No se encontraron artículos.</div>}
        </div>
      </div>
    </div>
  )
}
