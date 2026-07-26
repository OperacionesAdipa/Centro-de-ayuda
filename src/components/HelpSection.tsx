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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ padding: '20px 24px', borderRadius: 14, border: '0.5px solid var(--border)', background: 'linear-gradient(135deg, #f5f3ff, #fff)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 28 }}>&#127916;</span>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dark)' }}>&#191;Necesitas un tutorial?</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>Solicítanos un videotutorial personalizado y nuestro equipo lo creará para ti.</div>
        {!showForm && !sent && (
          <button className="help-card-btn purple" onClick={() => setShowForm(true)} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
            Solicitar tutorial
          </button>
        )}
        {sent && (
          <div style={{ fontSize: 13, color: '#3b6d11', background: '#eaf3de', padding: '8px 12px', borderRadius: 8 }}>
            &#161;Solicitud enviada! &#127881;
            <button className="help-again-btn" onClick={resetForm} style={{ marginLeft: 8 }}>Solicitar otro</button>
          </div>
        )}
        {showForm && !sent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <input className="tutorial-input" type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="tutorial-input" type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
            <textarea className="tutorial-input" placeholder="&#191;Qué tutorial necesitas?" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="help-card-btn purple" onClick={sendRequest} disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
              <button className="help-card-btn outline" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '20px 24px', borderRadius: 14, border: '0.5px solid var(--border)', background: 'linear-gradient(135deg, #eff8ff, #fff)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 28 }}>&#128197;</span>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dark)' }}>&#191;Prefieres hablar con alguien?</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>Agenda una videollamada con uno de nuestros especialistas y te ayudamos en tiempo real.</div>
        
          href={CALENDAR_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="help-card-btn blue"
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
        >
          Agendar videollamada
        </a>
      </div>
    </div>
  )
}
