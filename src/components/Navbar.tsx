'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCountry } from '@/lib/useCountry'

type FontSize = 'small' | 'normal' | 'large'

const FONT_SIZES: Record<FontSize, string> = {
  small: '12px',
  normal: '16px',
  large: '22px',
}

export function Navbar() {
  const { country, setCountry, COUNTRIES } = useCountry()
  const [open, setOpen] = useState(false)
  const [fontOpen, setFontOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [fontSize, setFontSizeState] = useState<FontSize>('normal')

  useEffect(() => {
    const savedDark = localStorage.getItem('adipa_dark_mode')
    if (savedDark === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
    const savedFont = localStorage.getItem('adipa_font_size') as FontSize
    if (savedFont && FONT_SIZES[savedFont]) {
      setFontSizeState(savedFont)
      applyFontScale(savedFont)
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

  function applyFontScale(size: FontSize) {
    const scales: Record<FontSize, number> = {
      small: 0.85,
      normal: 1,
      large: 1.25,
    }
    document.documentElement.style.fontSize = FONT_SIZES[size]
    document.documentElement.setAttribute('data-font-size', size)

    const styleId = 'adipa-font-scale'
    let style = document.getElementById(styleId)
    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      document.head.appendChild(style)
    }

    const scale = scales[size]
    style.innerHTML = `
      body, body * {
        font-size: calc(var(--base-font-size, 1em) * ${scale}) !important;
      }
      .hero h1 { font-size: ${32 * scale}px !important; }
      .cat-page-name { font-size: ${22 * scale}px !important; }
      .article-page h1 { font-size: ${26 * scale}px !important; }
      .section-group-name { font-size: ${16 * scale}px !important; }
      .art-rank-title { font-size: ${14 * scale}px !important; }
      .article-list-title { font-size: ${13 * scale}px !important; }
      .cat-card-large-name { font-size: ${15 * scale}px !important; }
      .section-card-large-name { font-size: ${14 * scale}px !important; }
      .faq-question { font-size: ${14 * scale}px !important; }
      .faq-answer { font-size: ${13 * scale}px !important; }
      .article-body { font-size: ${15 * scale}px !important; }
      .article-body p, .article-body li { font-size: ${15 * scale}px !important; }
      .sidebar-cat-name { font-size: ${14 * scale}px !important; }
      .sidebar-section-btn { font-size: ${13 * scale}px !important; }
      .sidebar-article-link { font-size: ${12 * scale}px !important; }
      .help-card-title { font-size: ${16 * scale}px !important; }
      .help-card-desc { font-size: ${13 * scale}px !important; }
      .navbar-subtitle { font-size: ${13 * scale}px !important; }
    `
  }

  function applyFontSize(size: FontSize) {
    setFontSizeState(size)
    localStorage.setItem('adipa_font_size', size)
    applyFontScale(size)
    setFontOpen(false)
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
          <button className="font-size-btn" onClick={() => { setFontOpen(!fontOpen); setOpen(false) }} title="Tamaño de texto" aria-label="Ajustar tamaño de texto">
            Aa
          </button>
          <button className="country-btn" onClick={() => { setOpen(!open); setFontOpen(false) }}>
            <span>{flags[country] ?? '🌎'}</span>
            <span>{country}</span>
            <span style={{ fontSize: 12 }}>▾</span>
          </button>
        </div>
      </nav>

      {fontOpen && (
        <div className="font-size-dropdown">
          <div className="font-size-label">Tamaño de texto</div>
          <div className="font-size-options">
            <button className={`font-size-option small ${fontSize === 'small' ? 'active' : ''}`} onClick={() => applyFontSize('small')}>A-</button>
            <button className={`font-size-option normal ${fontSize === 'normal' ? 'active' : ''}`} onClick={() => applyFontSize('normal')}>A</button>
            <button className={`font-size-option large ${fontSize === 'large' ? 'active' : ''}`} onClick={() => applyFontSize('large')}>A+</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', textAlign: 'center' }}>
            {fontSize === 'small' ? 'Texto pequeño' : fontSize === 'large' ? 'Texto grande' : 'Tamaño normal'}
          </div>
        </div>
      )}

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
