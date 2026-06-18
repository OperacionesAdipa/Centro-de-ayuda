'use client'

import { useCountry } from '@/lib/useCountry'
import { SearchBar } from './SearchBar'
import { useEffect, useState } from 'react'

interface Props {
  totalCategories: number
  totalArticles: number
}

function useCountUp(target: number, duration: number = 1500) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])

  return count
}

export function CountryHero({ totalCategories, totalArticles }: Props) {
  const { country } = useCountry()
  const count200 = useCountUp(200, 1200)
  const count30 = useCountUp(30, 1000)
  const count98 = useCountUp(98, 1400)

  return (
    <section className="hero">
      <div className="hero-tag">✨ Centro de ayuda</div>
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
          <div className="hero-stat-n">+{count200}</div>
          <div className="hero-stat-l">artículos</div>
        </div>
        <div>
          <div className="hero-stat-n">+{count30}</div>
          <div className="hero-stat-l">videotutoriales</div>
        </div>
        <div>
          <div className="hero-stat-n">{count98}%</div>
          <div className="hero-stat-l">satisfacción</div>
        </div>
        <div>
          <div className="hero-stat-n">{country}</div>
          <div className="hero-stat-l">tu país</div>
        </div>
      </div>
    </section>
  )
}
