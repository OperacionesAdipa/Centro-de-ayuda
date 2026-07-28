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

export default function CategoriasPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCat, setEditingCat] = useState<number | null>(null)
  const [editingCatName, setEditingCatName] = useState('')
  const [editingSec, setEditingSec] = useState<number | null>(null)
  const [editingSecName, setEditingSecName] = useState('')
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
    const [catRes, secRes] = await Promise.all([
      fetch('/api/agent/categories'),
      fetch('/api/agent/sections'),
    ])
    const catData = await catRes.json()
    const secData = await secRes.json()
    setCategories(catData.categories ?? [])
    setSections(secData.sections ?? [])
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

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div className="agent-wrap">
      <AgentNav />
      <div className="agent-body">
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--dark)', marginBottom: 4 }}>Gestionar categorías y secciones</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Edita o elimina categorías y secciones existentes.</p>
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
                {catSections.map((sec) => (
                  <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 10px 32px', borderBottom: '0.5px solid var(--border)' }}>
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
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {editingSec === sec.id ? (
                        <>
                          <button className="agent-nav-btn primary" onClick={() => saveSectionName(sec.id)} disabled={saving} style={{ fontSize: 12 }}>
                            {saving ? 'Guardando...' : 'Guardar'}
                          </button>
                          <button className="agent-nav-btn" onClick={() => setEditingSec(null)} style={{ fontSize: 12 }}>Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button className="agent-action-btn" onClick={() => { setEditingSec(sec.id); setEditingSecName(sec.name) }} style={{ fontSize: 12 }}>
                            Editar nombre
                          </button>
                          <button className="agent-url-remove" onClick={() => deleteSectionConfirm(sec.id, sec.name)}>✕</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

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
