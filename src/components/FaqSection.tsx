'use client'

import { useState } from 'react'
import { useCountry } from '@/lib/useCountry'
import { ZArticle, extractTagsFromBody } from '@/lib/zendesk'

export function FaqSection({ articles }: { articles: ZArticle[] }) {
  const { country } = useCountry()
  const [showAll, setShowAll] = useState(false)

  const filtered = articles.filter((art) => {
    const { countries, isFaq } = extractTagsFromBody(art.body ?? '')
    if (!isFaq) return false
    if (countries.length === 0) return true
    if (countries.includes('Todos')) return true
    return countries.includes(country)
  })

  const fallback = articles.filter((art) => {
    const { countries } = extractTagsFromBody(art.body ?? '')
    if (countries.length === 0) return true
    if (countries.includes('Todos')) return true
    return countries.includes(country)
  }).slice(0, 10)

  const display = filtered.length > 0 ? filtered : fallback
  const visible = showAll ? display : display.slice(0, 5)

  return (
    <>
      <div className="faq-list">
        {visible.map((art) => {
          const { cleanBody } = extractTagsFromBody(art.body ?? '')
          return (
            <details key={art.id} className="faq-item">
              <summary className="faq-question">
                <span>{art.title}</span>
                <span className="faq-chevron">▾</span>
              </summary>
              <div
                className="faq-answer"
                dangerouslySetInnerHTML={{
                  __html: cleanBody.replace(/<[^>]*>/g, '').slice(0, 300) + '...',
                }}
              />
            </details>
          )
        })}
      </div>
      {display.length > 5 && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button className="faq-show-more" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Ver menos' : `Ver más preguntas frecuentes (${display.length - 5} más)`}
          </button>
        </div>
      )}
    </>
  )
}
