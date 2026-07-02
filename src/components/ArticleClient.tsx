'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCountry } from '@/lib/useCountry'
import { slugify, extractTagsFromBody, fixMediaUrls } from '@/lib/supabaseQueries'
import { replaceAdipaLinks, replaceMexicoTerms, COUNTRY_WHATSAPP } from '@/lib/countryUtils'
import { trackArticleView } from './RecentlyViewed'
import { HelpSection } from './HelpSection'

interface Props {
  article: any
  updatedDate: string
  categoryName?: string
  categorySlug?: string
  relatedArticles: any[]
}

export function ArticleClient({ article, updatedDate, categoryName, categorySlug, relatedArticles }: Props) {
  const { country } = useCountry()
  const [helpful, setHelpful] = useState<null | boolean>(null)
  const router = useRouter()

  const { cleanBody } = extractTagsFromBody(article.body ?? '')
  const body = replaceMexicoTerms(fixMediaUrls(replaceAdipaLinks(cleanBody, country)), country)
  const title = replaceMexicoTerms(article.title, country)
  const whatsapp = COUNTRY_WHATSAPP[country] ?? COUNTRY_WHATSAPP['Chile']

  useEffect(() => {
    trackArticleView(String(article.id), article.title, `${article.id}-${slugify(article.title)}`)
  }, [article.id])

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => router.back()} className="back-btn-top">&#8592; Volver atrás</button>
        <Link href="/" className="back-btn-top back-btn-solid">&#8592; Volver al inicio</Link>
      </div>

      <div className="article-country-badge">&#128205; {country}</div>

      <h1>{title}</h1>

      <div className="article-meta">
        <span>&#128336; Actualizado {updatedDate}</span>
        {(article.view_count ?? 0) > 0 && (
          <span>&#128065; {article.view_count.toLocaleString()} vistas</span>
        )}
        {categoryName && <span>&#127991; {replaceMexicoTerms(categoryName, country)}</span>}
      </div>

      <div className="article-body" dangerouslySetInnerHTML={{ __html: body }} />

      <div className="article-divider" />

      <div className="helpful-box">
        <span>&#191;Te fue útil este artículo?</span>
        <div className="helpful-btns">
          {helpful === null ? (
            <>
              <button className="helpful-btn" onClick={() => setHelpful(true)}>
                &#128077; Sí, me ayudó
              </button>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="helpful-btn">
                Necesito más ayuda
              </a>
            </>
          ) : (
            <span style={{ fontSize: 14, color: '#704EFD', fontWeight: 500 }}>
              &#161;Gracias por tu feedback! &#127881;
            </span>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <HelpSection compact />
      </div>

      {relatedArticles.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            <span className="section-title-icon">&#10024;</span>
            Artículos relacionados
          </div>
          <div className="article-list">
            {relatedArticles.map((rel) => (
              <Link key={rel.id} href={`/articulo/${rel.id}-${slugify(rel.title)}`} className="article-list-item">
                <div className="article-list-icon">&#128196;</div>
                <div className="article-list-title">{replaceMexicoTerms(rel.title, country)}</div>
                <span className="article-list-arrow">&#8250;</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {categorySlug && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link href={`/categoria/${categorySlug}`} style={{ fontSize: 13, color: '#704EFD' }}>
            &#8592; Volver a {replaceMexicoTerms(categoryName ?? '', country)}
          </Link>
        </div>
      )}
    </>
  )
}
