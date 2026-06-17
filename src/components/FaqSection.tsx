'use client'

import { useCountry } from '@/lib/useCountry'
import { ZArticle } from '@/lib/zendesk'

export function FaqSection({ articles }: { articles: ZArticle[] }) {
  const { country } = useCountry()

  const tag = `pais_${country.toLowerCase().replace('é', 'e')}`
  const filtered = articles.filter((a) => {
    const labels = a.label_names ?? []
    if (labels.length === 0) return true
    if (labels.includes('pais_todos')) return true
    return labels.includes(tag)
  })

  const faq = filtered.filter((a) => (a.label_names ?? []).includes('faq')).slice(0, 6)
  const display = faq.length > 0 ? faq : filtered.slice(0, 5)

  return (
    <div className="faq-list">
      {display.map((art) => (
        <details key={art.id} className="faq-item">
          <summary className="faq-question">
            <span>{art.title}</span>
            <span className="faq-chevron">▾</span>
          </summary>
          <div
            className="faq-answer"
            dangerouslySetInnerHTML={{
              __html: (art.body ?? '').replace(/<[^>]*>/g, '').slice(0, 300) + '...',
            }}
          />
        </details>
      ))}
    </div>
  )
}
