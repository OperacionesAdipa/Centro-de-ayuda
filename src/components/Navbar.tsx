'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCountry } from '@/lib/useCountry'

export function Navbar() {
  const { country, setCountry, COUNTRIES } = useCountry()
  const [open, setOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('adipa_dark_mode')
    if (saved === 'true') {
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
    México: '🇲🇽',
    Colombia: '🇨🇴',
  }

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-logo">
          <img src="https://adipa.cl/content/uploads/2022/10/logo-adipa.svg" alt="ADIPA" style={{ height: 32, width: 'auto' }} />
          <span className="navbar-subtitle">Centro de ayuda</span>
        </Link>
        <div className="navbar-right">
          <button className="dark-mode-btn" onClick={toggleDark} title={darkMode ? 'Modo claro' : 'Modo oscuro'} aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}>
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
            <button
              key={c}
              className={`country-option ${c === country ? 'active' : ''}`}
              onClick={() => { setCountry(c); setOpen(false) }}
            >
              {flags[c]} {c}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
