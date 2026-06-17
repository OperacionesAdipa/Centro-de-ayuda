'use client'

import { useCountry } from '@/lib/useCountry'
import { COUNTRY_EMAIL, COUNTRY_WHATSAPP } from '@/lib/countryUtils'

export function ContactSection() {
  const { country } = useCountry()

  const email = COUNTRY_EMAIL[country] ?? COUNTRY_EMAIL['Chile']
  const whatsapp = COUNTRY_WHATSAPP[country] ?? COUNTRY_WHATSAPP['Chile']

  return (
    <div className="contact-section">
      <div className="contact-section-inner">
        <div className="contact-icon">💬</div>
        <h3 className="contact-title">¿Necesitas más ayuda?</h3>
        <p className="contact-sub">
          No encontraste lo que buscabas, contáctanos directamente.
        </p>
        <div className="contact-btns">
          
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-btn-whatsapp"
          >
            <span>💬</span> WhatsApp
          </a>
          
            href={`mailto:${email}`}
            className="contact-btn-email"
          >
            <span>✉️</span> {email}
          </a>
        </div>
      </div>
    </div>
  )
}
