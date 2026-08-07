'use client'

import { useCountry } from '@/lib/useCountry'
import { useLanguage } from '@/lib/useLanguage'
import { t } from '@/lib/translations'
import { COUNTRY_EMAIL, COUNTRY_WHATSAPP, getCountryHours } from '@/lib/countryUtils'

export function ContactSection() {
  const { country } = useCountry()
  const { lang } = useLanguage()
  const email = COUNTRY_EMAIL[country] ?? COUNTRY_EMAIL['Chile']
  const whatsapp = COUNTRY_WHATSAPP[country] ?? COUNTRY_WHATSAPP['Chile']
  const hours = getCountryHours(country)
  const T = (key: Parameters<typeof t>[1]) => t(lang as any, key)

  return (
    <div className="contact-section">
      <div className="contact-section-inner">
        <div className="contact-icon">💬</div>
        <h3 className="contact-title">{T('needMoreHelpTitle')}</h3>
        <p className="contact-sub">{T('needMoreHelpSub')}</p>
        <p className="contact-hours">
          <span>🕐</span> <strong>{T('schedule')}:</strong> {hours}
        </p>
        <div className="contact-btns">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="contact-btn-whatsapp">{T('whatsapp')}</a>
          <a href={`mailto:${email}`} className="contact-btn-email">{email}</a>
        </div>
      </div>
    </div>
  )
}
