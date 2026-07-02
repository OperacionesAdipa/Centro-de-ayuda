'use client'

import { useEffect, useState } from 'react'

interface Category {
  id: number
  name: string
}

interface Section {
  id: number
  category_id: number
  name: string
}

export function GenerarArticulos() {
  const [categories, setCategories] = useState<Category[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string>('')

  const [url, setUrl] = useState('')
  const [questions, setQuestions] = useState('')
  const [categoryId, setCategoryId] = useState<number>(0)
  const [categoryName, setCategoryName] = useState('')
  const [sectionId, setSectionId] = useState<number>(0)
  const [sectionName, setSectionName] = useState('')
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['pais_todos'])

  useEffect(() => { loadData() }, [])

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

  function toggleCountry(label: string) {
    setSelectedCountries(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  async function generate() {
    if (!url.trim() || !questions.trim()) return
    setGenerating(true)
    setResult('')

    const questionList = questions.split('\n').map(q => q.trim()).filter(q => q.length > 0)

    const res = await fetch('/api/agent/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url.trim(),
        questions: questionList,
        category_id: categoryId,
        category_name: categoryName,
        section_id: sectionId,
        section_name: sectionName,
        label_names: selectedCountries,
      }),
    })

    const data = await res.json()
    if (res.ok) {
      setResult(`✅ Se crearon ${data.created.length} artículo(s) exitosamente y quedaron pendientes de revisión.`)
      setUrl('')
      setQuestions('')
    } else {
      setResult(`❌ Error: ${data.error}`)
    }
    setGenerating(false)
  }

  const filteredSections = sections.filter(s => s.category_id === categoryId)

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="agent-side-card" style={{ marginBottom: 16 }}>
        <div className="agent-side-title">URL de referencia</div>
        <p className="agent-side-desc">Página web desde donde se extraerá la información para generar los artículos.</p>
        <input
          className="agent-input"
          type="url"
          placeholder="https://adipa.cl/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <div className="agent-side-card" style={{ marginBottom: 16 }}>
        <div className="agent-side-title">Preguntas a responder</div>
        <p className="agent-side-desc">Escribe una pregunta por línea. Se creará un artículo por cada pregunta.</p>
        <textarea
          className="agent-textarea"
          placeholder={`¿Qué es Adipartners?\n¿Cómo me inscribo en Adipartners?\n¿Cómo canjeo mi cupón Adipartners?`}
          value={questions}
          onChange={(e) => setQuestions(e.target.value)}
          rows={6}
        />
        {questions.trim() && (
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
            {questions.split('\n').filter(q => q.trim()).length} artículo(s) se crearán
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
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
            ].map(({ label, name }) => (
              <label key={label} className="agent-check-label">
                <input
                  type="checkbox"
                  checked={selectedCountries.includes(label)}
                  onChange={() => toggleCountry(label)}
                />
                {name}
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        className="agent-nav-btn primary"
        onClick={generate}
        disabled={generating || !url.trim() || !questions.trim()}
        style={{ padding: '10px 24px', fontSize: 14 }}
      >
        {generating ? 'Generando artículos...' : '✨ Generar artículos con IA'}
      </button>

      {result && (
        <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, fontSize: 13, background: result.startsWith('✅') ? '#eaf3de' : '#fcebeb', color: result.startsWith('✅') ? '#3b6d11' : '#a32d2d' }}>
          {result}
        </div>
      )}
    </div>
  )
}
