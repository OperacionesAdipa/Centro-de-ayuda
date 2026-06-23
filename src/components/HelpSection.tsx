'use client'

import { useState } from 'react'
import { useCountry } from '@/lib/useCountry'
import { COUNTRY_EMAIL } from '@/lib/countryUtils'

const CALENDAR_LINK = 'https://calendar.google.com/appointments/schedules/AcZssZ133YMSZW5tSEQrDrPk6VWkycf-fQlmoSJgnEjEVleVcrTTWV0DHFBE9EVv6hI2teNPqTII-G5z'

export function HelpSection() {
  const { country } = useCountry()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [desc, setDesc] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const toEmail = COUNTRY_EMAIL[country] ?? COUNTRY_EMAIL['Chile']

  async function sendRequest() {
    if (!name || !email || !desc) return
    setSending(true)
    const res = await fetch('/api/tutorial-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, description: desc, country, toEmail }),
    })
    setSending(false)
    if (res.ok) {
      setSent(true)
    }
  }

  function resetForm() {
    setSent(false)
    setName('')
    setEmail('')
    setDesc('')
    setShowForm(false)
  }

  return (
    <div className="help-section">
      <div className="help-card tutorial-card">
        <div className="help-card-icon">🎬</div>
        <div className="help-card-content">
          <h3 className="help-card-title">¿Necesitas un tutorial?</h3>
          <p className="help-card-desc">
            Si no encuentras lo que buscas, solicítanos un videotutorial personalizado y nuestro equipo lo creará para ti.
          </p>
          {!showForm && !sent && (
            <button className="help-card-btn purple" onClick={() => setShowForm(true)}>
              Solicitar tutorial
            </button>
          )}
          {sent && (
            <div className="help-sent-msg">
              <span>¡Solicitud enviada! 🎉 Te contactaremos pronto.</span>
              <button className="help-again-btn" onClick={resetForm}>Solicitar otro</button>
            </div>
          )}
        </div>

        {showForm && !sent && (
          <div className="help-form">
            <input className="tutorial-input" type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="tutorial-input" type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
            <textarea className="tutorial-input" placeholder="¿Qué tutorial necesitas? Descríbelo brevemente..." value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="help-card-btn purple" onClick={sendRequest} disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar solicitud'}
              </button>
              <button className="help-card-btn outline" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="help-card video-card">
        <div className="help-card-icon">📅</div>
        <div className="help-card-content">
          <h3 className="help-card-title">¿Prefieres hablar con alguien?</h3>
          <p className="help-card-desc">
            Agenda una videollamada con uno de nuestros especialistas y te ayudamos en tiempo real.
          </p>
          <a href={CALENDAR_LINK} target="_blank" rel="noopener noreferrer" className="help-card-btn blue">
            Agendar videollamada
          </a>
        </div>
      </div>
    </div>
  )
}
