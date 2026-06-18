'use client'

import { useState, useEffect, useCallback } from 'react'
import { AVAILABLE_COUNTRIES } from './countryUtils'

const STORAGE_KEY = 'adipa_country'

const COUNTRY_MAP: Record<string, string> = {
  CL: 'Chile',
  MX: 'México',
  CO: 'Colombia',
  AR: 'Argentina',
}

type CountryListener = (country: string) => void
const listeners: Set<CountryListener> = new Set()

function notifyListeners(country: string) {
  listeners.forEach((fn) => fn(country))
}

export function useCountry() {
  const [country, setCountryState] = useState<string>('Chile')
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && AVAILABLE_COUNTRIES.includes(saved)) {
      setCountryState(saved)
      setDetected(true)
      return
    }

    fetch('/api/geo')
      .then((r) => r.json())
      .then((data) => {
        const mapped = COUNTRY_MAP[data.country] ?? 'Chile'
        const final = AVAILABLE_COUNTRIES.includes(mapped) ? mapped : 'Chile'
        setCountryState(final)
        setDetected(true)
      })
      .catch(() => {
        setCountryState('Chile')
        setDetected(true)
      })
  }, [])

  useEffect(() => {
    const listener: CountryListener = (c) => setCountryState(c)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  const setCountry = useCallback((c: string) => {
    setCountryState(c)
    localStorage.setItem(STORAGE_KEY, c)
    notifyListeners(c)
  }, [])

  return { country, setCountry, detected, COUNTRIES: AVAILABLE_COUNTRIES }
}
