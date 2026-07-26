'use client'

import { useState } from 'react'
import { useCountry } from '@/lib/useCountry'
import { COUNTRY_EMAIL } from '@/lib/countryUtils'

const CALENDAR_LINK = 'https://calendar.google.com/appointments/schedules/AcZssZ133YMSZW5tSEQrDrPk6VWkycf-fQlmoSJgnEjEVleVcrTTWV0DHFBE9EVv6hI2teNPqTII-G5z'

interface Props {
  compact?: boolean
}

export function HelpSection({ compact = false }: Props) {
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

  const cardStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '14px 20px',
    borderRadius: 12,
    border: '0.5px solid var(--border)',
    background: '#fff',
    flexWrap: 'wrap' as const,
  }

  const leftStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  }

  const iconStyle = {
    fontSize: 24,
    flexShrink: 0,
  }

  const titleStyle = {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--dark)',
    marginBottom: 2,
  }

  const descStyle = {
    fontSize: 12,
    color: 'var(--muted)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={cardStyle}>
        <div style={leftStyle}>
          <span style={iconStyle}>🎬</span>
          <div>
            <div style={titleStyle}>¿Necesitas un tutorial?</div>
            <div style={descStyle}>Solicítanos un videotutorial personalizado.</div>
          </div>
        </div>
        <button className="help-card-btn purple" onClick={() => setShowForm(!showForm)}>
          Solicitar
        </button>
      </div>

      {showForm && !sent && (
        <div style={{ padding: '16px 20px', borderRadius: 12, border: '0.5px solid var(--border)', background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input className="tutorial-input" type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="tutorial-input" type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
          <textarea className="tutorial-input" placeholder="¿Qué tutorial necesitas? Descríbelo brevemente..." value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="help-card-btn purple" onClick={sendRequest} disabled={sending}>
              {sending ? 'Enviando...' : 'Enviar solicitud'}
            </button>
            <button className="help-card-btn outline" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {sent && (
        <div style={{ padding: '12px 20px', borderRadius: 12, background: '#eaf3de', color: '#3b6d11', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>¡Solicitud enviada! 🎉 Te contactaremos pronto.</span>
          <button className="help-again-btn" onClick={resetForm}>Solicitar otro</button>
        </div>
      )}

      <div style={cardStyle}>
        <div style={leftStyle}>
          <span style={iconStyle}>📅</span>
          <div>
            <div style={titleStyle}>¿Prefieres hablar con alguien?</div>
            <div style={descStyle}>Agenda una videollamada con un especialista.</div>
          </div>
        </div>
        <a href={CALENDAR_LINK} target="_blank" rel="noopener noreferrer" className="help-card-btn blue">
          Agendar
        </a>
      </div>
    </div>
  )
}
