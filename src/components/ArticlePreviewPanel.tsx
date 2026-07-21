'use client'

import { useEffect, useState } from 'react'

interface Props {
  articleId: number | null
  onClose: () => void
}

export function ArticlePreviewPanel({ articleId, onClose }: Props) {
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!articleId) { setArticle(null); return }
    setLoading(true)
    fetch(`/api/agent/articles/${articleId}`)
      .then(r => r.json())
      .then(data => {
        setArticle(data.article)
        setLoading(false)
      })
  }, [articleId])

  if (!articleId) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: 480,
      height: '100vh',
      background: '#fff',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>Vista previa del artículo</div>
        <button onClick={onClose} className="agent-url-remove" style={{ fontSize: 18 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {loading && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Cargando...</div>}
        {article && !loading && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: 'var(--dark)' }}>{article.title}</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span className="agent-tag">{article.category_name}</span>
              <span className="agent-tag">{article.section_name}</span>
              <span className={`agent-status ${article.status}`}>
                {article.status === 'published' ? 'Publicado' : article.status === 'draft' ? 'Borrador' : 'Pendiente'}
              </span>
            </div>
            <div className="article-body" dangerouslySetInnerHTML={{ __html: article.body ?? '' }} />
          </>
        )}
      </div>
    </div>
  )
}
