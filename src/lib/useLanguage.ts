'use client'

import { useState, useEffect } from 'react'

export function useLanguage() {
  const [lang, setLang] = useState('es')

  useEffect(() => {
    const saved = localStorage.getItem('adipa_lang')
    if (saved) setLang(saved)

    function handleChange(e: Event) {
      const custom = e as CustomEvent
      setLang(custom.detail)
    }

    window.addEventListener('lang-change', handleChange)
    return () => window.removeEventListener('lang-change', handleChange)
  }, [])

  return { lang }
}
