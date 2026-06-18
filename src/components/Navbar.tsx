'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCountry } from '@/lib/useCountry'

export function Navbar() {
  const { country, setCountry, COUNTRIES } = useCountry()
  const [open, setOpen] = useState(false)

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
