'use client'

import { useCountry } from '@/lib/useCountry'
import { useLanguage } from '@/lib/useLanguage'
import { t } from '@/lib/translations'
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
  const { lang } = useLanguage()
  const count200 = useCountUp(200, 1200)
  const count30 = useCountUp(30, 1000)
  const count98 = useCountUp(98, 1400)
  const T = (key: Parameters<typeof t>[1]) => t(lang as any, key)

  return (
    <section className="hero">
      <div className="hero-tag">✨ {T('helpCenter')}</div>
      <h1>
        {T('heroTitle')}<br />
        <span>{T('heroTitleSpan')}</span>
      </h1>
      <p className="hero-sub">
        {T('heroSub')} {country}.
      </p>
      <SearchBar />
      <div className="hero-stats">
        <div>
          <div className="hero-stat-n">+{count200}</div>
          <div className="hero-stat-l">{T('articles')}</div>
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
          <div className="hero-stat-l">{lang === 'en' ? 'your country' : 'tu país'}</div>
        </div>
      </div>
    </section>
  )
}
