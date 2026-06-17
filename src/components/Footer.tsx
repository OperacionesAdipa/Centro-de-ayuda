'use client'

import { useCountry } from '@/lib/useCountry'

export function Footer() {
  const { country } = useCountry()
  return (
    <footer className="footer">
      <p className="footer-contact-text">¿No encontraste lo que buscabas?</p>
      <p className="footer-contact-sub">Estamos aquí para ayudarte</p>
      <div className="footer-btns">
        <a href="https://adipa.cl/contacto" className="footer-btn pri">💬 Contactar soporte</a>
        <a href="mailto:info@adipa.cl" className="footer-btn sec">✉️ info@adipa.cl</a>
      </div>
      <div className="footer-region">
        📍 Región: {country}
      </div>
    </footer>
  )
}
