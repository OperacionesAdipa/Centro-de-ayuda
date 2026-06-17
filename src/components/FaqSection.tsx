'use client'

import { useCountry } from '@/lib/useCountry'
import { filterByCountry, ZArticle } from '@/lib/zendesk'

export function FaqSection({ articles }: { articles: ZArticle[] }) {
  const { country } = useCountry()

  const faqArticles = filterByCountry(
    articles.filter(
      (a) =>
        a.label_names?.includes('faq') ||
        a.section_id?.toString().includes('faq')
    ),
    country
  ).slice(0, 6)

  if (faqArticles.length === 0) {
    const fallback = articles.slice(0, 5)
    return (
      <div className="faq-list">
        {fallback.map((art) => (
          <details key={art.id} className="faq-item">
            <summary className="faq-question">
              <span>{art.title}</span>
              <span className="faq-chevron">▾</span>
            </summary>
            <div
              className="faq-answer"
              dangerouslySetInnerHTML={{
                __html: art.body?.replace(/<[^>]*>/g, '').slice(0, 200) + '...',
              }}
            />
          </details>
        ))}
      </div>
    )
  }

  return (
    <div className="faq-list">
      {faqArticles.map((art) => (
        <details key={art.id} className="faq-item">
          <summary className="faq-question">
            <span>{art.title}</span>
            <span className="faq-chevron">▾</span>
          </summary>
          <div
            className="faq-answer"
            dangerouslySetInnerHTML={{
              __html: art.body?.replace(/<[^>]*>/g, '').slice(0, 300) + '...',
            }}
          />
        </details>
      ))}
    </div>
  )
}
