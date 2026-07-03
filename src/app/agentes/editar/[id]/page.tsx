'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RichEditor } from '@/components/RichEditor'
import { AgentNav } from '@/components/AgentNav'

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

interface Category { id: number; name: string }
interface Section { id: number; category_id: number; name: string }
interface Version { id: number; title: string; body: string; created_at: string }
interface VimeoVideo { id: number; vimeo_id: string; title: string; vimeo_url: string }

export default function EditarArticuloPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [versions, setVersions] = useState<Version[]>([])
  const [vimeoVideos, setVimeoVideos] = useState<VimeoVideo[]>([])
  const [linkedVideos, setLinkedVideos] = useState<VimeoVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [addingVideo, setAddingVideo] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [showPreview, setShowPreview] = useState(false)

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
    const [artRes, catRes, secRes, verRes, vimeoRes] = await Promise.all([
      fetch(`/api/agent/articles/${params.id}`),
      fetch('/api/agent/categories'),
      fetch('/api/agent/sections'),
      fetch(`/api/agent/articles/${params.id}/versions`),
      fetch('/api/agent/vimeo'),
    ])
    const artData = await artRes.json()
    const catData = await catRes.json()
    const secData = await secRes.json()
    const verData = await verRes.json()
    const vimeoData = await vimeoRes.json()

    setArticle({
      ...artData.article,
      source_urls: artData.article.source_urls ?? [],
      label_names: artData.article.label_names ?? [],
    })
    setCategories(catData.categories ?? [])
    setSections(secData.sections ?? [])
    setVersions(verData.versions ?? [])

    const allVideos = vimeoData.videos ?? []
    setVimeoVideos(allVideos)
    const linked = allVideos.filter((v: any) =>
      v.articles?.some((a: any) => a.id === parseInt(params.id))
    )
    setLinkedVideos(linked)
    setLoading(false)
  }

  async function save(status: string) {
    if (!article) return
    setSaving(true)

    await fetch(`/api/agent/articles/${params.id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: article.title, body: article.body }),
    })

    const res = await fetch(`/api/agent/articles/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...article, status }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      const verRes = await fetch(`/api/agent/articles/${params.id}/versions`)
      const verData = await verRes.json()
      setVersions(verData.versions ?? [])
    }
    setSaving(false)
  }

  async function deleteArticle() {
    if (!confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    const res = await fetch(`/api/agent/articles/${params.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/agentes')
    }
    setDeleting(false)
  }

  async function addVideo() {
    if (!newVideoUrl.trim()) return
    setAddingVideo(true)
    const res = await fetch('/api/agent/vimeo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newVideoUrl.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      await fetch(`/api/agent/vimeo/${data.video.id}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: parseInt(params.id) }),
      })
      setNewVideoUrl('')
      await loadData()
    }
    setAddingVideo(false)
  }

  async function unlinkVideo(videoId: number) {
    await fetch(`/api/agent/vimeo/${videoId}/articles`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: parseInt(params.id) }),
    })
    await loadData()
  }

  async function restoreVersion(version: Version) {
    if (!article) return
    if (!confirm('¿Restaurar esta versión? El contenido actual se guardará como nueva versión.')) return
    await fetch(`/api/agent/articles/${params.id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: article.title, body: article.body }),
    })
    setArticle({ ...article, title: version.title, body: version.body })
    setSelectedVersion(null)
    setShowVersions(false)
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

  if (showPreview) {
    return (
      <div>
        <div style={{ background: '#704EFD', color: '#fff', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <span>&#128065; Vista previa — así lo ve el estudiante</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowPreview(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 99, cursor: 'pointer', fontSize: 13 }}>
              Volver al editor
            </button>
            <button onClick={() => save('published')} style={{ background: '#fff', border: 'none', color: '#704EFD', padding: '6px 14px', borderRadius: 99, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Publicar
            </button>
          </div>
        </div>
        <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 12 }}>{article.title}</h1>
          <div className="article-body" dangerouslySetInnerHTML={{ __html: article.body }} />
        </div>
      </div>
    )
  }

  if (showVersions) {
    return (
      <div className="agent-wrap">
        <AgentNav />
        <div className="agent-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Historial de versiones — {article.title}</h2>
            <button className="agent-nav-btn" onClick={() => { setShowVersions(false); setSelectedVersion(null) }}>Volver al editor</button>
          </div>
          {versions.length === 0 ? (
            <div className="agent-empty">No hay versiones anteriores guardadas.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: selectedVersion ? '300px 1fr' : '1fr', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {versions.map((v) => (
                  <button
                    key={v.id}
                    className="agent-side-card"
                    style={{ textAlign: 'left', cursor: 'pointer', border: selectedVersion?.id === v.id ? '2px solid var(--purple)' : '0.5px solid var(--border)' }}
                    onClick={() => setSelectedVersion(v)}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--dark)' }}>{v.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                      {new Date(v.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </button>
                ))}
              </div>
              {selectedVersion && (
                <div className="agent-side-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedVersion.title}</div>
                    <button className="agent-nav-btn primary" onClick={() => restoreVersion(selectedVersion)}>Restaurar esta versión</button>
                  </div>
                  <div className="article-body" dangerouslySetInnerHTML={{ __html: selectedVersion.body }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="agent-wrap">
      <AgentNav />

      <div style={{ background: '#fff', borderBottom: '0.5px solid var(--border)', padding: '8px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          Editando: <strong style={{ color: 'var(--dark)' }}>{article.title}</strong>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="agent-nav-btn" onClick={() => setShowVersions(true)}>
            &#128337; Versiones {versions.length > 0 && `(${versions.length})`}
          </button>
          <button className="agent-nav-btn" onClick={() => setShowPreview(true)}>
            &#128065; Vista estudiante
          </button>
          <button className="agent-nav-btn" onClick={() => save('draft')} disabled={saving}>
            Guardar borrador
          </button>
          <button className="agent-nav-btn primary" onClick={() => save('published')} disabled={saving}>
            {saving ? 'Guardando...' : 'Publicar'}
          </button>
          <button className="agent-nav-btn" onClick={deleteArticle} disabled={deleting} style={{ color: '#e24b4a', borderColor: '#e24b4a' }}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>

      {saved && <div className="agent-saved-msg">Guardado correctamente</div>}

      <div className="agent-editor-wrap">
        <div className="agent-editor-main">
          <div className="agent-field">
            <label className="agent-label">Título</label>
            <input className="agent-input" type="text" value={article.title} onChange={(e) => setArticle({ ...article, title: e.target.value })} />
          </div>
          <div className="agent-field">
            <label className="agent-label">Contenido</label>
            <RichEditor content={article.body} onChange={(html) => setArticle({ ...article, body: html })} />
          </div>
        </div>

        <div className="agent-editor-side">
          <div className="agent-side-card">
            <div className="agent-side-title">Categoría y sección</div>
            <select className="agent-select" value={article.category_id} onChange={(e) => {
              const cat = categories.find(c => c.id === Number(e.target.value))
              setArticle({ ...article, category_id: Number(e.target.value), category_name: cat?.name ?? '' })
            }}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="agent-select" value={article.section_id} onChange={(e) => {
              const sec = sections.find(s => s.id === Number(e.target.value))
              setArticle({ ...article, section_id: Number(e.target.value), section_name: sec?.name ?? '' })
            }}>
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
                  <input type="checkbox" checked={article.label_names.includes(label)} onChange={() => toggleLabel(label)} />
                  {name}
                </label>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Si no seleccionas ningún país, el artículo se mostrará en todos.</p>
          </div>

          <div className="agent-side-card">
            <div className="agent-side-title">Opciones</div>
            <label className="agent-check-label">
              <input type="checkbox" checked={article.promoted} onChange={(e) => setArticle({ ...article, promoted: e.target.checked })} />
              Artículo destacado
            </label>
          </div>

          <div className="agent-side-card">
            <div className="agent-side-title">URLs de referencia</div>
            <p className="agent-side-desc">Páginas web asociadas a este artículo.</p>
            {article.source_urls.map(url => (
              <div key={url} className="agent-url-item">
                <span className="agent-url-text">{url}</span>
                <button className="agent-url-remove" onClick={() => removeUrl(url)}>✕</button>
              </div>
            ))}
            <div className="agent-url-add">
              <input className="agent-input" type="url" placeholder="https://adipa.cl/..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addUrl()} />
              <button className="agent-nav-btn primary" onClick={addUrl}>Agregar</button>
            </div>
          </div>

          <div className="agent-side-card">
            <div className="agent-side-title">Videos de referencia</div>
            <p className="agent-side-desc">Videos de Vimeo asociados a este artículo.</p>
            {linkedVideos.map(v => (
              <div key={v.id} className="agent-url-item">
                <span className="agent-url-text">{v.title || v.vimeo_url}</span>
                <button className="agent-url-remove" onClick={() => unlinkVideo(v.id)}>✕</button>
              </div>
            ))}
            <div className="agent-url-add">
              <input className="agent-input" type="url" placeholder="https://vimeo.com/..." value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addVideo()} />
              <button className="agent-nav-btn primary" onClick={addVideo} disabled={addingVideo}>
                {addingVideo ? '...' : 'Agregar'}
              </button>
            </div>
          </div>

          <div className="agent-side-card">
            <div className="agent-side-title">Información</div>
            <p className="agent-side-desc">Vistas: {article.view_count}</p>
            <p className="agent-side-desc">Estado: {article.status === 'published' ? 'Publicado' : article.status === 'draft' ? 'Borrador' : 'Pendiente de revisión'}</p>
            <p className="agent-side-desc">Última actualización: {new Date(article.updated_at).toLocaleDateString('es-CL')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
