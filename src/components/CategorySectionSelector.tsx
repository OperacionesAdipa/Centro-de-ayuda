'use client'

import { useState } from 'react'

const ICONS = [
  '📋', '🎓', '💻', '🌐', '🎁', '❓', '📁', '⭐', '🔑', '👤',
  '📚', '🎬', '🏅', '💳', '👥', '📡', '🏛️', '📝', '📅', '🤝',
  '🆓', '📦', '💰', '🔗', '📊', '🛠️', '🎯', '💡', '🔔', '📌',
]

interface Category { id: number; name: string }
interface Section { id: number; category_id: number; name: string }

interface Props {
  categories: Category[]
  sections: Section[]
  categoryId: number
  categoryName: string
  sectionId: number
  sectionName: string
  onCategoryChange: (id: number, name: string) => void
  onSectionChange: (id: number, name: string) => void
  onCategoryCreated: (cat: Category) => void
  onSectionCreated: (sec: Section) => void
}

export function CategorySectionSelector({
  categories, sections,
  categoryId, categoryName,
  sectionId, sectionName,
  onCategoryChange, onSectionChange,
  onCategoryCreated, onSectionCreated,
}: Props) {
  const [showNewCat, setShowNewCat] = useState(false)
  const [showNewSec, setShowNewSec] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('📁')
  const [newSecName, setNewSecName] = useState('')
  const [newSecIcon, setNewSecIcon] = useState('📂')
  const [savingCat, setSavingCat] = useState(false)
  const [savingSec, setSavingSec] = useState(false)

  const filteredSections = sections.filter(s => s.category_id === categoryId)

  async function createCategory() {
    if (!newCatName.trim()) return
    setSavingCat(true)
    const res = await fetch('/api/agent/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${newCatIcon} ${newCatName.trim()}` }),
    })
    const data = await res.json()
    if (res.ok && data.category) {
      onCategoryCreated(data.category)
      onCategoryChange(data.category.id, data.category.name)
      setNewCatName('')
      setNewCatIcon('📁')
      setShowNewCat(false)
    }
    setSavingCat(false)
  }

  async function createSection() {
    if (!newSecName.trim() || !categoryId) return
    setSavingSec(true)
    const res = await fetch('/api/agent/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${newSecIcon} ${newSecName.trim()}`, category_id: categoryId }),
    })
    const data = await res.json()
    if (res.ok && data.section) {
      onSectionCreated(data.section)
      onSectionChange(data.section.id, data.section.name)
      setNewSecName('')
      setNewSecIcon('📂')
      setShowNewSec(false)
    }
    setSavingSec(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <select
          className="agent-select"
          value={categoryId}
          onChange={(e) => {
            const cat = categories.find(c => c.id === Number(e.target.value))
            onCategoryChange(Number(e.target.value), cat?.name ?? '')
          }}
        >
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          className="agent-action-btn"
          onClick={() => setShowNewCat(!showNewCat)}
          style={{ marginTop: 6, fontSize: 11 }}
        >
          {showNewCat ? 'Cancelar' : '+ Nueva categoría'}
        </button>

        {showNewCat && (
          <div style={{ background: 'var(--lp)', borderRadius: 8, padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Nueva categoría</div>
            <input
              className="agent-input"
              type="text"
              placeholder="Nombre de la categoría"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Selecciona un ícono:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewCatIcon(icon)}
                  style={{
                    fontSize: 20,
                    padding: '4px 6px',
                    borderRadius: 6,
                    border: newCatIcon === icon ? '2px solid var(--purple)' : '1px solid var(--border)',
                    background: newCatIcon === icon ? 'var(--lp)' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>{newCatIcon}</span>
              <span style={{ fontSize: 13, color: 'var(--dark)' }}>{newCatName || 'Nombre de la categoría'}</span>
            </div>
            <button
              className="agent-nav-btn primary"
              onClick={createCategory}
              disabled={savingCat || !newCatName.trim()}
              style={{ marginTop: 10, fontSize: 12 }}
            >
              {savingCat ? 'Creando...' : 'Crear categoría'}
            </button>
          </div>
        )}
      </div>

      <div>
        <select
          className="agent-select"
          value={sectionId}
          onChange={(e) => {
            const sec = sections.find(s => s.id === Number(e.target.value))
            onSectionChange(Number(e.target.value), sec?.name ?? '')
          }}
        >
          <option value={0}>Seleccionar sección</option>
          {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button
          className="agent-action-btn"
          onClick={() => setShowNewSec(!showNewSec)}
          disabled={!categoryId}
          style={{ marginTop: 6, fontSize: 11 }}
        >
          {showNewSec ? 'Cancelar' : '+ Nueva sección'}
        </button>

        {showNewSec && (
          <div style={{ background: '#e0f2fe', borderRadius: 8, padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Nueva sección en {categoryName}</div>
            <input
              className="agent-input"
              type="text"
              placeholder="Nombre de la sección"
              value={newSecName}
              onChange={(e) => setNewSecName(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Selecciona un ícono:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewSecIcon(icon)}
                  style={{
                    fontSize: 20,
                    padding: '4px 6px',
                    borderRadius: 6,
                    border: newSecIcon === icon ? '2px solid #0ea5e9' : '1px solid var(--border)',
                    background: newSecIcon === icon ? '#e0f2fe' : '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>{newSecIcon}</span>
              <span style={{ fontSize: 13, color: 'var(--dark)' }}>{newSecName || 'Nombre de la sección'}</span>
            </div>
            <button
              style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 99, padding: '6px 14px', fontSize: 12, cursor: 'pointer', marginTop: 10 }}
              onClick={createSection}
              disabled={savingSec || !newSecName.trim()}
            >
              {savingSec ? 'Creando...' : 'Crear sección'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
