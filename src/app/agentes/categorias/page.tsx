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

const ICONS = [
  '📋', '🎓', '💻', '🌐', '🎁', '❓', '📁', '⭐', '🔑', '👤',
  '📚', '🎬', '🏅', '💳', '👥', '📡', '🏛️', '📝', '📅', '🤝',
  '🆓', '📦', '💰', '🔗', '📊', '🛠️', '🎯', '💡', '🔔', '📌',
]

function splitIconAndName(fullName: string): { icon: string; name: string } {
  const trimmed = fullName.trim()
  const emojiRegex = /^([\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{1F300}-\u{1F9FF}]|[\u{FE00}-\u{FEFF}]|\u00A9|\u00AE|[\u2000-\u3300])\s*/u
  const match = trimmed.match(emojiRegex)
  if (match) {
    return { icon: match[0].trim(), name: trimmed.slice(match[0].length).trim() }
  }
  // Intentar con el primer caracter si es emoji
  const firstChar = [...trimmed][0]
  const codePoint = firstChar?.codePointAt(0) ?? 0
  if (codePoint > 127) {
    const rest = trimmed.slice(firstChar.length).trim()
    return { icon: firstChar, name: rest }
  }
  return { icon: '📁', name: trimmed }
}

export default function CategoriasPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCat, setEditingCat] = useState<number | null>(null)
  const [editingCatName, setEditingCatName] = useState('')
  const [editingCatIcon, setEditingCatIcon] = useState('')
  const [showCatIconPicker, setShowCatIconPicker] = useState(false)
  const [editingSec, setEditingSec] = useState<number | null>(null)
  const [editingSecName, setEditingSecName] = useState('')
  const [editingSecIcon, setEditingSecIcon] = useState('')
  const [showSecIconPicker, setShowSecIconPicker] = useState(false)
  const [expandedSec, setExpandedSec] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const localToken = localStorage.getItem('agent_token')
    const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('agent_google_token='))?.split('=')?.[1]
    const token = localToken || cookieToken

    if (!token) { router.push('/acceso'); return }

    if (cookieToken && !localToken) {
      localStorage.setItem('agent_token', cookieToken)
    }

    fetch('/api/agent/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then((r) => {
      if (!r.ok) router.push('/acceso')
      else setLoading(false)
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
    const fullName = editingCatIcon + ' ' + editingCatName.trim()
    await fetch(`/api/agent/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fullName }),
    })
    setEditingCat(null)
    setShowCatIconPicker(false)
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
    const fullName = editingSecIcon + ' ' + editingSecName.trim()
    await fetch(`/api/agent/sections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fullName }),
    })
    setEditingSec(null)
    setShowSecIconPicker(false)
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
    await Promise.all(
      catSections.map((s, i) =>
        fetch(`/api/agent/sections/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: i }) })
      )
    )
    await Promise.all([
      fetch(`/api/agent/sections/${catSections[idx].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx - 1 }) }),
      fetch(`/api/agent/sections/${catSections[idx - 1].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx }) }),
    ])
    await loadData()
  }

  async function moveSectionDown(sec: Section, catSections: Section[]) {
    const idx = catSections.findIndex(s => s.id === sec.id)
    if (idx === catSections.length - 1) return
    await Promise.all(
      catSections.map((s, i) =>
        fetch(`/api/agent/sections/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: i }) })
      )
    )
    await Promise.all([
      fetch(`/api/agent/sections/${catSections[idx].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx + 1 }) }),
      fetch(`/api/agent/sections/${catSections[idx + 1].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx }) }),
    ])
    await loadData()
  }

  async function moveArticleUp(art: Article, secArticles: Article[]) {
    const idx = secArticles.findIndex(a => a.id === art.id)
    if (idx === 0) return
    await Promise.all(
      secArticles.map((a, i) =>
        fetch(`/api/agent/articles/${a.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: i }) })
      )
    )
    await Promise.all([
      fetch(`/api/agent/articles/${secArticles[idx].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx - 1 }) }),
      fetch(`/api/agent/articles/${secArticles[idx - 1].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx }) }),
    ])
    await loadData()
  }

  async function moveArticleDown(art: Article, secArticles: Article[]) {
    const idx = secArticles.findIndex(a => a.id === art.id)
    if (idx === secArticles.length - 1) return
    await Promise.all(
      secArticles.map((a, i) =>
        fetch(`/api/agent/articles/${a.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: i }) })
      )
    )
    await Promise.all([
      fetch(`/api/agent/articles/${secArticles[idx].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx + 1 }) }),
      fetch(`/api/agent/articles/${secArticles[idx + 1].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: idx }) }),
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

const IconPicker = ({ selected, onSelect }: { selected: string; onSelect: (icon: string) => void }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 10, background: '#fff', border: '0.5px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', position: 'fixed', zIndex: 9999, width: 280, maxHeight: 200, overflowY: 'auto' }}>
    {ICONS.map(icon => (
      <button
        key={icon}
        onClick={() => onSelect(icon)}
        style={{
          fontSize: 20,
          padding: '4px 6px',
          borderRadius: 6,
          border: selected === icon ? '2px solid var(--purple)' : '1px solid var(--border)',
          background: selected === icon ? 'var(--lp)' : '#fff',
          cursor: 'pointer',
        }}
      >
        {icon}
      </button>
    ))}
  </div>
)

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div className="agent-wrap">
      <AgentNav />
      <div className="agent-body">
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--dark)', marginBottom: 4 }}>Gestionar categorías y secciones</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Edita nombres, íconos, elimina o reordena categorías, secciones y artículos.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {categories.map((cat) => {
            const { icon: catIcon, name: catName } = splitIconAndName(cat.name)
            const catSections = sections.filter(s => s.category_id === cat.id)

            return (
              <div key={cat.id} style={{ border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'var(--lp)', borderBottom: catSections.length > 0 ? '0.5px solid var(--border)' : 'none' }}>
                  {editingCat === cat.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, position: 'relative' }}>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setShowCatIconPicker(!showCatIconPicker)}
                          style={{ fontSize: 22, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}
                          title="Cambiar ícono"
                        >
                          {editingCatIcon}
                        </button>
                        {showCatIconPicker && (
                          <div style={{ position: 'absolute', top: 40, left: 0, zIndex: 100 }}>
                            <IconPicker selected={editingCatIcon} onSelect={(icon) => { setEditingCatIcon(icon); setShowCatIconPicker(false) }} />
                          </div>
                        )}
                      </div>
                      <input
                        className="agent-input"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveCategoryName(cat.id)
                          if (e.key === 'Escape') { setEditingCat(null); setShowCatIconPicker(false) }
                        }}
                        autoFocus
                        style={{ flex: 1 }}
                      />
                    </div>
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', flex: 1 }}>{cat.name}</span>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {editingCat === cat.id ? (
                      <>
                        <button className="agent-nav-btn primary" onClick={() => saveCategoryName(cat.id)} disabled={saving} style={{ fontSize: 12 }}>
                          {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button className="agent-nav-btn" onClick={() => { setEditingCat(null); setShowCatIconPicker(false) }} style={{ fontSize: 12 }}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <button className="agent-action-btn" onClick={() => { setEditingCat(cat.id); setEditingCatName(catName); setEditingCatIcon(catIcon); setShowCatIconPicker(false) }} style={{ fontSize: 12 }}>
                          Editar
                        </button>
                        <button className="agent-url-remove" onClick={() => deleteCategoryConfirm(cat.id, cat.name)}>✕</button>
                      </>
                    )}
                  </div>
                </div>

                {catSections.map((sec, secIdx) => {
                  const { icon: secIcon, name: secName } = splitIconAndName(sec.name)
                  const secArticles = articles.filter(a => a.section_id === sec.id)
                  const isExpanded = expandedSec === sec.id

                  return (
                    <div key={sec.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 10px 32px', borderBottom: '0.5px solid var(--border)', background: isExpanded ? '#f5f3ff' : '#fff' }}>
                        {editingSec === sec.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, position: 'relative' }}>
                            <div style={{ position: 'relative' }}>
                              <button
                                onClick={() => setShowSecIconPicker(!showSecIconPicker)}
                                style={{ fontSize: 18, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '3px 6px', cursor: 'pointer' }}
                                title="Cambiar ícono"
                              >
                                {editingSecIcon}
                              </button>
                              {showSecIconPicker && (
                                <div style={{ position: 'absolute', top: 36, left: 0, zIndex: 100 }}>
                                  <IconPicker selected={editingSecIcon} onSelect={(icon) => { setEditingSecIcon(icon); setShowSecIconPicker(false) }} />
                                </div>
                              )}
                            </div>
                            <input
                              className="agent-input"
                              value={editingSecName}
                              onChange={(e) => setEditingSecName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveSectionName(sec.id)
                                if (e.key === 'Escape') { setEditingSec(null); setShowSecIconPicker(false) }
                              }}
                              autoFocus
                              style={{ flex: 1 }}
                            />
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, color: 'var(--dark)', flex: 1 }}>↳ {sec.name}</span>
                        )}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                          {arrowBtn(() => moveSectionUp(sec, catSections), '↑', secIdx === 0)}
                          {arrowBtn(() => moveSectionDown(sec, catSections), '↓', secIdx === catSections.length - 1)}
                          <button className="agent-action-btn" onClick={() => setExpandedSec(isExpanded ? null : sec.id)} style={{ fontSize: 11 }}>
                            {isExpanded ? 'Ocultar' : `Artículos (${secArticles.length})`}
                          </button>
                          {editingSec === sec.id ? (
                            <>
                              <button className="agent-nav-btn primary" onClick={() => saveSectionName(sec.id)} disabled={saving} style={{ fontSize: 12 }}>
                                {saving ? '...' : 'Guardar'}
                              </button>
                              <button className="agent-nav-btn" onClick={() => { setEditingSec(null); setShowSecIconPicker(false) }} style={{ fontSize: 12 }}>Cancelar</button>
                            </>
                          ) : (
                            <>
                              <button className="agent-action-btn" onClick={() => { setEditingSec(sec.id); setEditingSecName(secName); setEditingSecIcon(secIcon); setShowSecIconPicker(false) }} style={{ fontSize: 12 }}>
                                Editar
                              </button>
                              <button className="agent-url-remove" onClick={() => deleteSectionConfirm(sec.id, sec.name)}>✕</button>
                            </>
                          )}
                        </div>
                      </div>

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
