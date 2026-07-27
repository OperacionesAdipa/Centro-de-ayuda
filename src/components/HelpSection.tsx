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
    if (res.ok) setSent(true)
  }

  function resetForm() {
    setSent(false)
    setName('')
    setEmail('')
    setDesc('')
    setShowForm(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={{ padding: '14px 18px', borderRadius: 12, border: '0.5px solid var(--border)', background: 'linear-gradient(135deg, #f5f3ff, #fff)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 22 }}>&#127916;</span>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>¿Necesitas un tutorial?</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>Solicítanos un videotutorial personalizado y nuestro equipo lo creará para ti.</div>
        {!showForm && !sent && (
          <button className="help-card-btn purple" onClick={() => setShowForm(true)} style={{ alignSelf: 'flex-start', marginTop: 2 }}>
            Solicitar tutorial
          </button>
        )}
        {sent && (
          <div style={{ fontSize: 12, color: '#3b6d11', background: '#eaf3de', padding: '6px 10px', borderRadius: 8 }}>
            ¡Solicitud enviada!
            <button className="help-again-btn" onClick={resetForm} style={{ marginLeft: 8 }}>Solicitar otro</button>
          </div>
        )}
        {showForm && !sent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
            <input className="tutorial-input" type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="tutorial-input" type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
            <textarea className="tutorial-input" placeholder="¿Qué tutorial necesitas?" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="help-card-btn purple" onClick={sendRequest} disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
              <button className="help-card-btn outline" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 18px', borderRadius: 12, border: '0.5px solid var(--border)', background: 'linear-gradient(135deg, #eff8ff, #fff)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 22 }}>&#128197;</span>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>¿Prefieres hablar con alguien?</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>Agenda una videollamada con uno de nuestros especialistas y te ayudamos en tiempo real.</div>
        <a href={CALENDAR_LINK} target="_blank" rel="noopener noreferrer" className="help-card-btn blue" style={{ alignSelf: 'flex-start', marginTop: 2 }}>
          Agendar videollamada
        </a>
      </div>
    </div>
  )
}
