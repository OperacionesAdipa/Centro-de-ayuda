'use client'

import { useCountry } from '@/lib/useCountry'
import { COUNTRY_DOMAIN } from '@/lib/countryUtils'

export function Footer() {
  const { country } = useCountry()
  const domain = COUNTRY_DOMAIN[country] ?? 'cl'
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <a href={`https://www.adipa.${domain}`} target="_blank" rel="noopener noreferrer" className="footer-logo">
        <img
          src="https://adipa.cl/content/uploads/2022/10/logo-adipa.svg"
          alt="ADIPA"
          style={{ height: 28, width: 'auto', filter: 'brightness(0) invert(1)' }}
        />
      </a>
      <p className="footer-copy">© {year} ADIPA. Todos los derechos reservados.</p>
    </footer>
  )
}
