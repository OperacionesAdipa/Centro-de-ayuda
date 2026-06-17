'use client'

import { useCountry } from '@/lib/useCountry'
import { SearchBar } from './SearchBar'

interface Props {
  totalCategories: number
  totalArticles: number
}

export function CountryHero({ totalCategories, totalArticles }: Props) {
  const { country } = useCountry()

  return (
    <section className="hero">
      <div className="hero-tag">✨ Centro de ayuda {country}</div>
      <h1>
        Hola, ¿en qué te<br />
        podemos <span>ayudar?</span>
      </h1>
      <p className="hero-sub">
        Encuentra guías, tutoriales y respuestas rápidas para {country}.
      </p>
      <SearchBar />
      <div className="hero-stats">
        <div>
          <div className="hero-stat-n">{totalArticles}</div>
          <div className="hero-stat-l">artículos</div>
        </div>
        <div>
          <div className="hero-stat-n">{totalCategories}</div>
          <div className="hero-stat-l">categorías</div>
        </div>
        <div>
          <div className="hero-stat-n">{country}</div>
          <div className="hero-stat-l">tu región</div>
        </div>
      </div>
    </section>
  )
}
