'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCountry } from '@/lib/useCountry'
import { slugify, filterArticlesByCountry } from '@/lib/supabaseQueries'
import { replaceMexicoTerms } from '@/lib/countryUtils'

interface Props {
  articles: any[]
}

export function FaqSection({ articles }: Props) {
  const { country } = useCountry()
  const [openId, setOpenId] = useState<number | null>(null)

  const faqArticles = articles
    .filter((art) => filterArticlesByCountry([art], country).length > 0)
    .slice(0, 8)

  if (faqArticles.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {faqArticles.map((art) => {
        const isOpen = openId === art.id
        return (
          <div
            key={art.id}
            style={{
              border: '0.5px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#fff',
              transition: 'box-shadow 0.15s',
              boxShadow: isOpen ? '0 2px 12px rgba(112,78,253,0.08)' : 'none',
            }}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : art.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: isOpen ? 'var(--lp)' : '#fff',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                gap: 12,
                transition: 'background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>❓</span>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--dark)', lineHeight: 1.4 }}>
                  {replaceMexicoTerms(art.title, country)}
                </span>
              </div>
              <span style={{
                fontSize: 20,
                color: 'var(--purple)',
                fontWeight: 300,
                flexShrink: 0,
                transform: isOpen ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s',
              }}>
                ›
              </span>
            </button>

            {isOpen && (
              <div style={{
                padding: '0 20px 20px 48px',
                borderTop: '0.5px solid var(--border)',
                background: '#fafafa',
              }}>
                <div
                  className="article-body"
                  style={{ paddingTop: 16, fontSize: 14, lineHeight: 1.7, color: 'var(--dark)' }}
                  dangerouslySetInnerHTML={{ __html: art.body?.slice(0, 600) ?? '' }}
                />
                <Link
                  href={`/articulo/${art.id}-${slugify(art.title)}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 12,
                    fontSize: 13,
                    color: 'var(--purple)',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Ver artículo completo →
                </Link>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
