'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCountry } from '@/lib/useCountry'
import { ZArticle, slugify } from '@/lib/zendesk'

interface Props {
  article: ZArticle
  updatedDate: string
  categoryName?: string
  categorySlug?: string
  relatedArticles: ZArticle[]
}

export function ArticleClient({ article, updatedDate, categoryName, categorySlug, relatedArticles }: Props) {
  const { country } = useCountry()
  const [helpful, setHelpful] = useState<null | boolean>(null)

  return (
    <>
      <div className="article-country-badge">
        📍 {country}
      </div>

      <h1>{article.title}</h1>

      <div className="article-meta">
        <span>🕐 Actualizado {updatedDate}</span>
        {article.view_count > 0 && (
          <span>👁 {article.view_count.toLocaleString()} vistas</span>
        )}
        {categoryName && <span>🏷 {categoryName}</span>}
      </div>

      <div
        className="article-body"
        dangerouslySetInnerHTML={{ __html: article.body }}
      />

      <div className="article-divider" />

      <div className="helpful-box">
        <span>¿Te fue útil este artículo?</span>
        <div className="helpful-btns">
          {helpful === null ? (
            <>
              <button
                className="helpful-btn"
                onClick={() => setHelpful(true)}
              >
                👍 Sí, me ayudó
              </button>
              <button
                className="helpful-btn"
                onClick={() => setHelpful(false)}
              >
                Necesito más ayuda
              </button>
            </>
          ) : helpful ? (
            <span style={{ fontSize: 14, color: '#704EFD', fontWeight: 500 }}>
              ¡Gracias por tu feedback! 🎉
            </span>
          ) : (
            <span style={{ fontSize: 14, color: '#6b7280' }}>
              Escríbenos a{' '}
              <a href="mailto:info@adipa.cl" style={{ color: '#704EFD' }}>
                info@adipa.cl
              </a>
            </span>
          )}
        </div>
      </div>

      {relatedArticles.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            <span className="section-title-icon">✨</span>
            Artículos relacionados
          </div>
          <div className="article-list">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/articulo/${rel.id}-${slugify(rel.title)}`}
                className="article-list-item"
              >
                <div className="article-list-icon">📄</div>
                <div className="article-list-title">{rel.title}</div>
                <span className="article-list-arrow">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {categorySlug && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link
            href={`/categoria/${categorySlug}`}
            style={{ fontSize: 13, color: '#704EFD' }}
          >
            ← Volver a {categoryName}
          </Link>
        </div>
      )}
    </>
  )
}
