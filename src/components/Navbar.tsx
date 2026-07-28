'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCountry } from '@/lib/useCountry'
import { COUNTRY_DOMAIN } from '@/lib/countryUtils'

export function Navbar() {
  const { country, setCountry, COUNTRIES } = useCountry()
  const [open, setOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const domain = COUNTRY_DOMAIN[country] ?? 'cl'

  useEffect(() => {
    const savedDark = localStorage.getItem('adipa_dark_mode')
    if (savedDark === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  function toggleDark() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('adipa_dark_mode', String(next))
    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const flags: Record<string, string> = {
    Chile: '🇨🇱',
    Mexico: '🇲🇽',
    Colombia: '🇨🇴',
    Argentina: '🇦🇷',
  }

  const siteUrl = 'https://www.adipa.' + domain

  return (
    <div>
      <nav className="navbar">
        <Link href="/" className="navbar-logo">
          <img src="https://adipa.cl/content/uploads/2022/10/logo-adipa.svg" alt="ADIPA" style={{ height: 32, width: 'auto' }} />
          <span className="navbar-subtitle">Centro de ayuda</span>
        </Link>
        <div className="navbar-right">
          <a href={siteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, padding: '5px 12px', borderRadius: 99, border: '0.5px solid var(--border)', color: 'var(--dark)', textDecoration: 'none', background: '#fff' }}>
            Ir al sitio web
          </a>
          <button className="dark-mode-btn" onClick={toggleDark} title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="country-btn" onClick={() => setOpen(!open)}>
            <span>{flags[country] ?? '🌎'}</span>
            <span>{country}</span>
            <span style={{ fontSize: 12 }}>▾</span>
          </button>
        </div>
      </nav>
      {open && (
        <div className="country-dropdown">
          {COUNTRIES.map((c) => (
            <button key={c} className={'country-option ' + (c === country ? 'active' : '')} onClick={() => { setCountry(c); setOpen(false) }}>
              {flags[c]} {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
