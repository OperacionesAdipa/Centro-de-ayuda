'use client'

import { useState, useEffect } from 'react'

const COUNTRIES = ['Chile', 'México', 'Colombia', 'Argentina']
const STORAGE_KEY = 'adipa_country'

const COUNTRY_MAP: Record<string, string> = {
  CL: 'Chile',
  MX: 'México',
  CO: 'Colombia',
  AR: 'Argentina',
}

export function useCountry() {
  const [country, setCountryState] = useState<string>('Chile')
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && COUNTRIES.includes(saved)) {
      setCountryState(saved)
      setDetected(true)
      return
    }

    fetch('/api/geo')
      .then((r) => r.json())
      .then((data) => {
        const mapped = COUNTRY_MAP[data.country] ?? 'Chile'
        setCountryState(mapped)
        setDetected(true)
      })
      .catch(() => {
        setCountryState('Chile')
        setDetected(true)
      })
  }, [])

  function setCountry(c: string) {
    setCountryState(c)
    localStorage.setItem(STORAGE_KEY, c)
  }

  return { country, setCountry, detected, COUNTRIES }
}
