'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCountry } from '@/lib/useCountry'
import { slugify, filterArticlesByCountry, isArticleFaq } from '@/lib/supabaseQueries'
import { replaceMexicoTerms } from '@/lib/countryUtils'

interface Props {
  articles: any[]
}

export function FaqSection({ articles }: Props) {
  const { country } = useCountry()
  const [openId, setOpenId] = useState<number | null>(null)

  const faqArticles = articles
    .filter((art) => isArticleFaq(art))
    .filter((art) => filterArticlesByCountry([art], country).length > 0)
    .slice(0, 8)

  if (faqArticles.length === 0) return null

  return (
    <div className="faq-list">
      {faqArticles.map((art) => (
        <div key={art.id} className={`faq-item ${openId === art.id ? 'open' : ''}`}>
          <button
            className="faq-question"
            onClick={() => setOpenId(openId === art.id ? null : art.id)}
          >
            <span>{replaceMexicoTerms(art.title, country)}</span>
            <span className="faq-icon">{openId === art.id ? '▾' : '›'}</span>
          </button>
          {openId === art.id && (
            <div className="faq-answer">
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: art.body?.slice(0, 500) ?? '' }}
              />
              <Link
                href={`/articulo/${art.id}-${slugify(art.title)}`}
                style={{ fontSize: 13, color: 'var(--purple)', marginTop: 8, display: 'inline-block' }}
              >
                Ver artículo completo →
              </Link>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
