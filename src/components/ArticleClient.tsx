'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCountry } from '@/lib/useCountry'
import { useLanguage } from '@/lib/useLanguage'
import { t } from '@/lib/translations'
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
  const { lang } = useLanguage()
  const [helpful, setHelpful] = useState<null | boolean>(null)
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null)
  const [translatedBody, setTranslatedBody] = useState<string | null>(null)
  const [translating, setTranslating] = useState(false)
  const router = useRouter()

  const { cleanBody } = extractTagsFromBody(article.body ?? '')
  const body = replaceMexicoTerms(fixMediaUrls(replaceAdipaLinks(cleanBody, country)), country)
  const title = replaceMexicoTerms(article.title, country)
  const whatsapp = COUNTRY_WHATSAPP[country] ?? COUNTRY_WHATSAPP['Chile']

  useEffect(() => {
    trackArticleView(String(article.id), article.title, `${article.id}-${slugify(article.title)}`)
    fetch(`/api/agent/articles/${article.id}/view`, { method: 'POST' }).catch(() => {})
  }, [article.id])

  useEffect(() => {
    if (lang === 'es') {
      setTranslatedTitle(null)
      setTranslatedBody(null)
      return
    }
    setTranslating(true)
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: article.id, lang }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.title) setTranslatedTitle(data.title)
        if (data.body) setTranslatedBody(data.body)
        setTranslating(false)
      })
      .catch(() => setTranslating(false))
  }, [lang, article.id])

  const displayTitle = translatedTitle ?? title
  const displayBody = translatedBody ?? body
  const T = (key: Parameters<typeof t>[1]) => t(lang as any, key)

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => router.back()} className="back-btn-top">{T('backToTop')}</button>
        <Link href="/" className="back-btn-top back-btn-solid">{T('backToHome')}</Link>
      </div>

      <div className="article-country-badge">📍 {country}</div>

      <h1>{translating ? title : displayTitle}</h1>

      {translating && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: 'var(--purple)' }} />
          {T('translating')}
        </div>
      )}

      <div className="article-meta">
        <span>🕐 {T('updatedAt')} {updatedDate}</span>
        {(article.view_count ?? 0) > 0 && (
          <span>👁 {article.view_count.toLocaleString()} {T('views')}</span>
        )}
        {categoryName && <span>🏷️ {replaceMexicoTerms(categoryName, country)}</span>}
      </div>

      <div className="article-body" dangerouslySetInnerHTML={{ __html: translating ? body : displayBody }} />

      <div className="article-divider" />

      <div className="helpful-box">
        <span>{T('helpfulQuestion')}</span>
        <div className="helpful-btns">
          {helpful === null ? (
            <>
              <button className="helpful-btn" onClick={() => setHelpful(true)}>
                {T('helpfulYes')}
              </button>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="helpful-btn">
                {T('needMoreHelp')}
              </a>
            </>
          ) : (
            <span style={{ fontSize: 14, color: '#704EFD', fontWeight: 500 }}>
              {T('thanksFeedback')}
            </span>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(112,78,253,0.2)', margin: '32px 0' }} />

      <div style={{ marginTop: 24 }}>
        <HelpSection />
      </div>

      {relatedArticles.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>
            <span className="section-title-icon">✨</span>
            {T('relatedArticles')}
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
            {T('backToCategory')} {replaceMexicoTerms(categoryName ?? '', country)}
          </Link>
        </div>
      )}
    </>
  )
}
