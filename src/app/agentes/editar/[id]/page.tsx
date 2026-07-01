'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Article {
  id: number
  title: string
  body: string
  category_id: number
  category_name: string
  section_id: number
  section_name: string
  label_names: string[]
  promoted: boolean
  draft: boolean
  status: string
  source_urls: string[]
  view_count: number
  updated_at: string
}

interface Category {
  id: number
  name: string
}

interface Section {
  id: number
  category_id: number
  name: string
}

export default function EditarArticuloPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
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
    const [artRes, catRes, secRes] = await Promise.all([
      fetch(`/api/agent/articles/${params.id}`),
      fetch('/api/agent/categories'),
      fetch('/api/agent/sections'),
    ])
    const artData = await artRes.json()
    const catData = await catRes.json()
    const secData = await secRes.json()
    setArticle({ ...artData.article, source_urls: artData.article.source_urls ?? [], label_names: artData.article.label_names ?? [] })
    setCategories(catData.categories ?? [])
    setSections(secData.sections ?? [])
    setLoading(false)
  }

  async function save(status: string) {
    if (!article) return
    setSaving(true)
    const res = await fetch(`/api/agent/articles/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...article, status }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  function toggleLabel(label: string) {
    if (!article) return
    const labels = article.label_names.includes(label)
      ? article.label_names.filter(l => l !== label)
      : [...article.label_names, label]
    setArticle({ ...article, label_names: labels })
  }

  function addUrl() {
    if (!article || !newUrl.trim()) return
    setArticle({ ...article, source_urls: [...article.source_urls, newUrl.trim()] })
    setNewUrl('')
  }

  function removeUrl(url: string) {
    if (!article) return
    setArticle({ ...article, source_urls: article.source_urls.filter(u => u !== url) })
  }

  const filteredSections = sections.filter(s => s.category_id === article?.category_id)

  if (loading) return <div className="agent-loading">Cargando...</div>
  if (!article) return <div className="agent-loading">Artículo no encontrado</div>

  return (
    <div className="agent-wrap">
      <div className="agent-header">
        <div className="agent-header-left">
          <img src="https://adipa.cl/content/uploads/2022/10/logo-adipa.svg" alt="ADIPA" style={{ height: 28 }} />
          <span className="agent-header-title">Editar artículo</span>
        </div>
        <div className="agent-header-right">
          <Link href="/agentes" className="agent-nav-btn">Volver</Link>
          <button className="agent-nav-btn" onClick={() => save('draft')} disabled={saving}>
            Guardar borrador
          </button>
          <button className="agent-nav-btn primary" onClick={() => save('published')} disabled={saving}>
            {saving ? 'Guardando...' : 'Publicar'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="agent-saved-msg">Guardado correctamente</div>
      )}

      <div className="agent-editor-wrap">
        <div className="agent-editor-main">
          <div className="agent-field">
            <label className="agent-label">Título</label>
            <input
              className="agent-input"
              type="text"
              value={article.title}
              onChange={(e) => setArticle({ ...article, title: e.target.value })}
            />
          </div>

          <div className="agent-field">
            <label className="agent-label">Contenido (HTML)</label>
            <textarea
              className="agent-textarea"
              value={article.body}
              onChange={(e) => setArticle({ ...article, body: e.target.value })}
              rows={20}
            />
          </div>

          <div className="agent-field">
            <label className="agent-label">Vista previa</label>
            <div
              className="agent-preview article-body"
              dangerouslySetInnerHTML={{ __html: article.body }}
            />
          </div>
        </div>

        <div className="agent-editor-side">
          <div className="agent-side-card">
            <div className="agent-side-title">Categoría y sección</div>
            <select
              className="agent-select"
              value={article.category_id}
              onChange={(e) => {
                const cat = categories.find(c => c.id === Number(e.target.value))
                setArticle({ ...article, category_id: Number(e.target.value), category_name: cat?.name ?? '' })
              }}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              className="agent-select"
              value={article.section_id}
              onChange={(e) => {
                const sec = sections.find(s => s.id === Number(e.target.value))
                setArticle({ ...article, section_id: Number(e.target.value), section_name: sec?.name ?? '' })
              }}
            >
              {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="agent-side-card">
            <div className="agent-side-title">Países</div>
            <div className="agent-country-checks">
              {['pais_chile', 'pais_mexico', 'pais_colombia', 'pais_argentina', 'pais_todos', 'faq'].map(label => (
                <label key={label} className="agent-check-label">
                  <input
                    type="checkbox"
                    checked={article.label_names.includes(label)}
                    onChange={() => toggleLabel(label)}
                  />
                  {label.replace('pais_', '').charAt(0).toUpperCase() + label.replace('pais_', '').slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="agent-side-card">
            <div className="agent-side-title">Opciones</div>
            <label className="agent-check-label">
              <input
                type="checkbox"
                checked={article.promoted}
                onChange={(e) => setArticle({ ...article, promoted: e.target.checked })}
              />
              Artículo destacado
            </label>
          </div>

          <div className="agent-side-card">
            <div className="agent-side-title">URLs de referencia</div>
            <p className="agent-side-desc">Páginas web asociadas a este artículo para regeneración automática.</p>
            {article.source_urls.map(url => (
              <div key={url} className="agent-url-item">
                <span className="agent-url-text">{url}</span>
                <button className="agent-url-remove" onClick={() => removeUrl(url)}>✕</button>
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

          <div className="agent-side-card">
            <div className="agent-side-title">Información</div>
            <p className="agent-side-desc">Vistas: {article.view_count}</p>
            <p className="agent-side-desc">Última actualización: {new Date(article.updated_at).toLocaleDateString('es-CL')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
