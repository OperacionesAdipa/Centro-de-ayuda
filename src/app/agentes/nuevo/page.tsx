'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AgentNav } from '@/components/AgentNav'
import { RichEditor } from '@/components/RichEditor'

interface Category {
  id: number
  name: string
}

interface Section {
  id: number
  category_id: number
  name: string
}

export default function NuevoArticuloPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [categoryId, setCategoryId] = useState<number>(0)
  const [categoryName, setCategoryName] = useState('')
  const [sectionId, setSectionId] = useState<number>(0)
  const [sectionName, setSectionName] = useState('')
  const [labelNames, setLabelNames] = useState<string[]>([])
  const [promoted, setPromoted] = useState(false)
  const [sourceUrls, setSourceUrls] = useState<string[]>([])
  const [newUrl, setNewUrl] = useState('')

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
    const [catRes, secRes] = await Promise.all([
      fetch('/api/agent/categories'),
      fetch('/api/agent/sections'),
    ])
    const catData = await catRes.json()
    const secData = await secRes.json()
    setCategories(catData.categories ?? [])
    setSections(secData.sections ?? [])
    if (catData.categories?.length > 0) {
      setCategoryId(catData.categories[0].id)
      setCategoryName(catData.categories[0].name)
    }
    setLoading(false)
  }

  function toggleLabel(label: string) {
    setLabelNames(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  function addUrl() {
    if (!newUrl.trim()) return
    setSourceUrls(prev => [...prev, newUrl.trim()])
    setNewUrl('')
  }

  async function save(status: string) {
    if (!title.trim()) return
    setSaving(true)
    const res = await fetch('/api/agent/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        body,
        category_id: categoryId,
        category_name: categoryName,
        section_id: sectionId,
        section_name: sectionName,
        label_names: labelNames,
        promoted,
        draft: status === 'draft',
        status,
        source_urls: sourceUrls,
      }),
    })
    const data = await res.json()
    if (res.ok && data.article) {
      router.push(`/agentes/editar/${data.article.id}`)
    }
    setSaving(false)
  }

  const filteredSections = sections.filter(s => s.category_id === categoryId)

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div className="agent-wrap">
      <AgentNav />

      <div style={{ background: '#fff', borderBottom: '0.5px solid var(--border)', padding: '8px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Nuevo artículo</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="agent-nav-btn" onClick={() => save('draft')} disabled={saving}>
            Guardar borrador
          </button>
          <button className="agent-nav-btn primary" onClick={() => save('published')} disabled={saving}>
            {saving ? 'Guardando...' : 'Publicar'}
          </button>
        </div>
      </div>

      <div className="agent-editor-wrap">
        <div className="agent-editor-main">
          <div className="agent-field">
            <label className="agent-label">Título</label>
            <input
              className="agent-input"
              type="text"
              placeholder="Título del artículo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="agent-field">
            <label className="agent-label">Contenido</label>
            <RichEditor
              content={body}
              onChange={(html) => setBody(html)}
            />
          </div>
        </div>

        <div className="agent-editor-side">
          <div className="agent-side-card">
            <div className="agent-side-title">Categoría y sección</div>
            <select
              className="agent-select"
              value={categoryId}
              onChange={(e) => {
                const cat = categories.find(c => c.id === Number(e.target.value))
                setCategoryId(Number(e.target.value))
                setCategoryName(cat?.name ?? '')
                setSectionId(0)
                setSectionName('')
              }}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              className="agent-select"
              value={sectionId}
              onChange={(e) => {
                const sec = sections.find(s => s.id === Number(e.target.value))
                setSectionId(Number(e.target.value))
                setSectionName(sec?.name ?? '')
              }}
            >
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
                { label: 'faq', name: 'FAQ' },
              ].map(({ label, name }) => (
                <label key={label} className="agent-check-label">
                  <input
                    type="checkbox"
                    checked={labelNames.includes(label)}
                    onChange={() => toggleLabel(label)}
                  />
                  {name}
                </label>
              ))}
            </div>
          </div>

          <div className="agent-side-card">
            <div className="agent-side-title">Opciones</div>
            <label className="agent-check-label">
              <input type="checkbox" checked={promoted} onChange={(e) => setPromoted(e.target.checked)} />
              Artículo destacado
            </label>
          </div>

          <div className="agent-side-card">
            <div className="agent-side-title">URLs de referencia</div>
            <p className="agent-side-desc">Páginas web asociadas a este artículo.</p>
            {sourceUrls.map(url => (
              <div key={url} className="agent-url-item">
                <span className="agent-url-text">{url}</span>
                <button className="agent-url-remove" onClick={() => setSourceUrls(prev => prev.filter(u => u !== url))}>✕</button>
              </div>
            ))}
            <div className="agent-url-add">
              <input
                className="agent-input"
                type="url"
                placeholder="https://adipa.cl/..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addUrl()}
              />
              <button className="agent-nav-btn primary" onClick={addUrl}>Agregar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
