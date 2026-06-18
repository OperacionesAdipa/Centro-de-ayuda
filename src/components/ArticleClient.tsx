'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCountry } from '@/lib/useCountry'
import { ZArticle, slugify, extractTagsFromBody, fixMediaUrls } from '@/lib/zendesk'
import { replaceAdipaLinks, replaceMexicoTerms, COUNTRY_WHATSAPP } from '@/lib/countryUtils'

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
  const router = useRouter()

  const { cleanBody } = extractTagsFromBody(article.body ?? '')
  const body = replaceMexicoTerms(fixMediaUrls(replaceAdipaLinks(cleanBody, country)), country)
  const title = replaceMexicoTerms(article.title, country)
  const whatsapp = COUNTRY_WHATSAPP[country] ?? COUNTRY_WHATSAPP['Chile']

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => router.back()} className="back-btn-top">
          ← Volver atrás
        </button>
        <Link href="/" className="back-btn-top back-btn-solid">
          ← Volver al inicio
        </Link>
      </div>

      <div className="article-country-badge">
        📍 {country}
      </div>

      <h1>{title}</h1>

      <div className="article-meta">
        <span>🕐 Actualizado {updatedDate}</span>
        {(article.view_count ?? 0) > 0 && (
          <span>👁 {article.view_count.toLocaleString()} vistas</span>
        )}
        {categoryName && <span>🏷 {replaceMexicoTerms(categoryName, country)}</span>}
      </div>

      <div className="article-body" dangerouslySetInnerHTML={{ __html: body }} />

      <div className="article-divider" />

      <div className="helpful-box">
        <span>¿Te fue útil este artículo?</span>
        <div className="helpful-btns">
          {helpful === null ? (
            <>
              <button className="helpful-btn" onClick={() => setHelpful(true)}>
                👍 Sí, me ayudó
              </button>
              
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="helpful-btn"
                onClick={() => setHelpful(false)}
              >
                Necesito más ayuda
              </a>
            </>
          ) : (
            <span style={{ fontSize: 14, color: '#704EFD', fontWeight: 500 }}>
              ¡Gracias por tu feedback! 🎉
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
              <Link key={rel.id} href={`/articulo/${rel.id}-${slugify(rel.title)}`} className="article-list-item">
                <div className="article-list-icon">📄</div>
                <div className="article-list-title">{replaceMexicoTerms(rel.title, country)}</div>
                <span className="article-list-arrow">›</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {categorySlug && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link href={`/categoria/${categorySlug}`} style={{ fontSize: 13, color: '#704EFD' }}>
            ← Volver a {replaceMexicoTerms(categoryName ?? '', country)}
          </Link>
        </div>
      )}
    </>
  )
}
