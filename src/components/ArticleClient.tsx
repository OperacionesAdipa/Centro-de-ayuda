'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCountry } from '@/lib/useCountry'
import { ZArticle, slugify, extractTagsFromBody, fixMediaUrls } from '@/lib/zendesk'
import { replaceAdipaLinks, replaceMexicoTerms, COUNTRY_WHATSAPP, COUNTRY_EMAIL } from '@/lib/countryUtils'
import { trackArticleView } from './RecentlyViewed'

const CALENDAR_LINK = 'https://calendar.google.com/appointments/schedules/AcZssZ133YMSZW5tSEQrDrPk6VWkycf-fQlmoSJgnEjEVleVcrTTWV0DHFBE9EVv6hI2teNPqTII-G5z'

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
  const [showTutorialForm, setShowTutorialForm] = useState(false)
  const [tutorialName, setTutorialName] = useState('')
  const [tutorialEmail, setTutorialEmail] = useState('')
  const [tutorialDesc, setTutorialDesc] = useState('')
  const [tutorialSent, setTutorialSent] = useState(false)
  const router = useRouter()

  const { cleanBody } = extractTagsFromBody(article.body ?? '')
  const body = replaceMexicoTerms(fixMediaUrls(replaceAdipaLinks(cleanBody, country)), country)
  const title = replaceMexicoTerms(article.title, country)
  const whatsapp = COUNTRY_WHATSAPP[country] ?? COUNTRY_WHATSAPP['Chile']
  const email = COUNTRY_EMAIL[country] ?? COUNTRY_EMAIL['Chile']

  useEffect(() => {
    trackArticleView(String(article.id), article.title, `${article.id}-${slugify(article.title)}`)
  }, [article.id])

  async function sendTutorialRequest() {
    if (!tutorialName || !tutorialEmail || !tutorialDesc) return
    const res = await fetch('/api/tutorial-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tutorialName, email: tutorialEmail, description: tutorialDesc, country, toEmail: email }),
    })
    if (res.ok) {
      setTutorialSent(true)
      setShowTutorialForm(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => router.back()} className="back-btn-top">← Volver atrás</button>
        <Link href="/" className="back-btn-top back-btn-solid">← Volver al inicio</Link>
      </div>

      <div className="article-country-badge">&#128205; {country}</div>

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
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="helpful-btn">
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

      <div className="extra-help-section">
        <div className="extra-help-title">¿Necesitas más ayuda?</div>
        <div className="extra-help-btns">
          <button
            className="extra-help-btn"
            onClick={() => setShowTutorialForm(!showTutorialForm)}
          >
            🎬 Solicitar un tutorial
          </button>
          
            href={CALENDAR_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="extra-help-btn"
          >
            📅 Agendar videollamada
          </a>
        </div>

        {showTutorialForm && !tutorialSent && (
          <div className="tutorial-form">
            <p className="tutorial-form-desc">
              Cuéntanos qué tutorial necesitas y nos pondremos en contacto contigo.
            </p>
            <input
              className="tutorial-input"
              type="text"
              placeholder="Tu nombre"
              value={tutorialName}
              onChange={(e) => setTutorialName(e.target.value)}
            />
            <input
              className="tutorial-input"
              type="email"
              placeholder="Tu correo"
              value={tutorialEmail}
              onChange={(e) => setTutorialEmail(e.target.value)}
            />
            <textarea
              className="tutorial-input"
              placeholder="¿Qué tutorial necesitas? Descríbelo brevemente..."
              value={tutorialDesc}
              onChange={(e) => setTutorialDesc(e.target.value)}
              rows={3}
            />
            <button
              className="back-btn-top back-btn-solid"
              onClick={sendTutorialRequest}
              style={{ marginTop: 8 }}
            >
              Enviar solicitud
            </button>
          </div>
        )}

        {tutorialSent && (
          <div style={{ marginTop: 12, fontSize: 14, color: '#704EFD', fontWeight: 500 }}>
            ¡Solicitud enviada! Te contactaremos pronto. 🎉
          </div>
        )}
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
