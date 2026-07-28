'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AgentNav } from '@/components/AgentNav'

interface Category {
  id: number
  name: string
  position: number
}

interface Section {
  id: number
  category_id: number
  name: string
  position: number
}

interface Article {
  id: number
  title: string
  section_id: number
  position: number
  status: string
}

export default function CategoriasPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCat, setEditingCat] = useState<number | null>(null)
  const [editingCatName, setEditingCatName] = useState('')
  const [editingSec, setEditingSec] = useState<number | null>(null)
  const [editingSecName, setEditingSecName] = useState('')
  const [expandedSec, setExpandedSec] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('agent_token')
    if (!token) { router.push('/acceso'); return }
    fetch('/api/agent/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(r => {
      if (!r.ok) router.push('/acceso')
      else loadData()
    })
  }, [])

  async function loadData() {
    const [catRes, secRes, artRes] = await Promise.all([
      fetch('/api/agent/categories'),
      fetch('/api/agent/sections'),
      fetch('/api/agent/articles'),
    ])
    const catData = await catRes.json()
    const secData = await secRes.json()
    const artData = await artRes.json()
    setCategories((catData.categories ?? []).sort((a: Category, b: Category) => a.position - b.position))
    setSections((secData.sections ?? []).sort((a: Section, b: Section) => a.position - b.position))
    setArticles((artData.articles ?? []).sort((a: Article, b: Article) => (a.position ?? 0) - (b.position ?? 0)))
    setLoading(false)
  }

  async function saveCategoryName(id: number) {
    if (!editingCatName.trim()) return
    setSaving(true)
    await fetch(`/api/agent/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingCatName.trim() }),
    })
    setEditingCat(null)
    await loadData()
    setSaving(false)
  }

  async function deleteCategoryConfirm(id: number, name: string) {
    if (!confirm(`¿Eliminar la categoría "${name}"? Se eliminarán también todas sus secciones.`)) return
    await fetch(`/api/agent/categories/${id}`, { method: 'DELETE' })
    await loadData()
  }

  async function saveSectionName(id: number) {
    if (!editingSecName.trim()) return
    setSaving(true)
    await fetch(`/api/agent/sections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingSecName.trim() }),
    })
    setEditingSec(null)
    await loadData()
    setSaving(false)
  }

  async function deleteSectionConfirm(id: number, name: string) {
    if (!confirm(`¿Eliminar la sección "${name}"?`)) return
    await fetch(`/api/agent/sections/${id}`, { method: 'DELETE' })
    await loadData()
  }

  async function moveSectionUp(sec: Section, catSections: Section[]) {
    const idx = catSections.findIndex(s => s.id === sec.id)
    if (idx === 0) return
    const prev = catSections[idx - 1]
    await Promise.all([
      fetch(`/api/agent/sections/${sec.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: prev.position }) }),
      fetch(`/api/agent/sections/${prev.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: sec.position }) }),
    ])
    await loadData()
  }

  async function moveSectionDown(sec: Section, catSections: Section[]) {
    const idx = catSections.findIndex(s => s.id === sec.id)
    if (idx === catSections.length - 1) return
    const next = catSections[idx + 1]
    await Promise.all([
      fetch(`/api/agent/sections/${sec.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: next.position }) }),
      fetch(`/api/agent/sections/${next.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: sec.position }) }),
    ])
    await loadData()
  }

async function moveArticleUp(art: Article, secArticles: Article[]) {
  const idx = secArticles.findIndex(a => a.id === art.id)
  if (idx === 0) return
  const reindexed = secArticles.map((a, i) => ({ ...a, position: i }))
  const current = reindexed[idx]
  const prev = reindexed[idx - 1]
  await Promise.all([
    fetch(`/api/agent/articles/${current.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx - 1 }) }),
    fetch(`/api/agent/articles/${prev.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx }) }),
  ])
  await loadData()
}

async function moveArticleDown(art: Article, secArticles: Article[]) {
  const idx = secArticles.findIndex(a => a.id === art.id)
  if (idx === secArticles.length - 1) return
  const reindexed = secArticles.map((a, i) => ({ ...a, position: i }))
  const current = reindexed[idx]
  const next = reindexed[idx + 1]
  await Promise.all([
    fetch(`/api/agent/articles/${current.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx + 1 }) }),
    fetch(`/api/agent/articles/${next.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx }) }),
  ])
  await loadData()
}

  const arrowBtn = (onClick: () => void, label: string, disabled: boolean) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        background: 'none',
        border: '0.5px solid var(--border)',
        borderRadius: 6,
        width: 28,
        height: 28,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--dark)',
      }}
    >
      {label}
    </button>
  )

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div className="agent-wrap">
      <AgentNav />
      <div className="agent-body">
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--dark)', marginBottom: 4 }}>Gestionar categorías y secciones</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Edita nombres, elimina o reordena categorías, secciones y artículos.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {categories.map((cat) => {
            const catSections = sections.filter(s => s.category_id === cat.id)

            return (
              <div key={cat.id} style={{ border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                {/* Categoría */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--lp)', borderBottom: catSections.length > 0 ? '0.5px solid var(--border)' : 'none' }}>
                  {editingCat === cat.id ? (
                    <input
                      className="agent-input"
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveCategoryName(cat.id)
                        if (e.key === 'Escape') setEditingCat(null)
                      }}
                      autoFocus
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', flex: 1 }}>{cat.name}</span>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {editingCat === cat.id ? (
                      <>
                        <button className="agent-nav-btn primary" onClick={() => saveCategoryName(cat.id)} disabled={saving} style={{ fontSize: 12 }}>
                          {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button className="agent-nav-btn" onClick={() => setEditingCat(null)} style={{ fontSize: 12 }}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="agent-action-btn" onClick={() => { setEditingCat(cat.id); setEditingCatName(cat.name) }} style={{ fontSize: 12 }}>
                          Editar nombre
                        </button>
                        <button className="agent-url-remove" onClick={() => deleteCategoryConfirm(cat.id, cat.name)}>✕</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Secciones */}
                {catSections.map((sec, secIdx) => {
                  const secArticles = articles.filter(a => a.section_id === sec.id)
                  const isExpanded = expandedSec === sec.id

                  return (
                    <div key={sec.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 10px 32px', borderBottom: '0.5px solid var(--border)', background: isExpanded ? '#f5f3ff' : '#fff' }}>
                        {editingSec === sec.id ? (
                          <input
                            className="agent-input"
                            value={editingSecName}
                            onChange={(e) => setEditingSecName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveSectionName(sec.id)
                              if (e.key === 'Escape') setEditingSec(null)
                            }}
                            autoFocus
                            style={{ flex: 1 }}
                          />
                        ) : (
                          <span style={{ fontSize: 13, color: 'var(--dark)', flex: 1 }}>↳ {sec.name}</span>
                        )}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                          {arrowBtn(() => moveSectionUp(sec, catSections), '↑', secIdx === 0)}
                          {arrowBtn(() => moveSectionDown(sec, catSections), '↓', secIdx === catSections.length - 1)}
                          <button
                            className="agent-action-btn"
                            onClick={() => setExpandedSec(isExpanded ? null : sec.id)}
                            style={{ fontSize: 11 }}
                          >
                            {isExpanded ? 'Ocultar artículos' : `Ver artículos (${secArticles.length})`}
                          </button>
                          {editingSec === sec.id ? (
                            <>
                              <button className="agent-nav-btn primary" onClick={() => saveSectionName(sec.id)} disabled={saving} style={{ fontSize: 12 }}>
                                {saving ? '...' : 'Guardar'}
                              </button>
                              <button className="agent-nav-btn" onClick={() => setEditingSec(null)} style={{ fontSize: 12 }}>Cancelar</button>
                            </>
                          ) : (
                            <>
                              <button className="agent-action-btn" onClick={() => { setEditingSec(sec.id); setEditingSecName(sec.name) }} style={{ fontSize: 12 }}>
                                Editar
                              </button>
                              <button className="agent-url-remove" onClick={() => deleteSectionConfirm(sec.id, sec.name)}>✕</button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Artículos de la sección */}
                      {isExpanded && (
                        <div style={{ background: '#fafafa', borderBottom: '0.5px solid var(--border)' }}>
                          {secArticles.length === 0 ? (
                            <div style={{ padding: '10px 18px 10px 48px', fontSize: 12, color: 'var(--muted)' }}>Sin artículos en esta sección</div>
                          ) : (
                            secArticles.map((art, artIdx) => (
                              <div key={art.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px 8px 48px', borderBottom: '0.5px solid var(--border)' }}>
                                <span style={{ fontSize: 12, color: 'var(--muted)', width: 20, textAlign: 'center' }}>{artIdx + 1}</span>
                                <span style={{ fontSize: 12, color: 'var(--dark)', flex: 1 }}>{art.title}</span>
                                <span className={`agent-status ${art.status}`} style={{ fontSize: 10 }}>
                                  {art.status === 'published' ? 'Publicado' : art.status === 'draft' ? 'Borrador' : 'Pendiente'}
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  {arrowBtn(() => moveArticleUp(art, secArticles), '↑', artIdx === 0)}
                                  {arrowBtn(() => moveArticleDown(art, secArticles), '↓', artIdx === secArticles.length - 1)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {catSections.length === 0 && (
                  <div style={{ padding: '10px 18px 10px 32px', fontSize: 12, color: 'var(--muted)' }}>Sin secciones</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
