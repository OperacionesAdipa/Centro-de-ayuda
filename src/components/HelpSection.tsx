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

  if (compact) {
    return (
      <div className="help-section-compact">
        <div className="help-compact-card tutorial">
          <div className="help-compact-left">
            <span className="help-compact-icon">&#127916;</span>
            <div>
              <div className="help-compact-title">&#191;Necesitas un tutorial?</div>
              <div className="help-compact-desc">Solicítanos un videotutorial personalizado.</div>
            </div>
          </div>
          <button className="help-card-btn purple" onClick={() => setShowForm(!showForm)}>
            Solicitar
          </button>
        </div>

        {showForm && !sent && (
          <div className="help-form" style={{ marginTop: 10 }}>
            <input className="tutorial-input" type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="tutorial-input" type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
            <textarea className="tutorial-input" placeholder="&#191;Qué tutorial necesitas? Descríbelo brevemente..." value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="help-card-btn purple" onClick={sendRequest} disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar solicitud'}
              </button>
              <button className="help-card-btn outline" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {sent && (
          <div className="help-sent-msg" style={{ marginTop: 10 }}>
            <span>&#161;Solicitud enviada! &#127881; Te contactaremos pronto.</span>
            <button className="help-again-btn" onClick={resetForm}>Solicitar otro</button>
          </div>
        )}

        <div className="help-compact-card video">
          <div className="help-compact-left">
            <span className="help-compact-icon">&#128197;</span>
            <div>
              <div className="help-compact-title">&#191;Prefieres hablar con alguien?</div>
              <div className="help-compact-desc">Agenda una videollamada con un especialista.</div>
            </div>
          </div>
          <a href={CALENDAR_LINK} target="_blank" rel="noopener noreferrer" className="help-card-btn blue">
            Agendar
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="help-section">
      <div className="help-card tutorial-card">
        <div className="help-card-icon">&#127916;</div>
        <div className="help-card-content">
          <h3 className="help-card-title">&#191;Necesitas un tutorial?</h3>
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
              <span>&#161;Solicitud enviada! &#127881; Te contactaremos pronto.</span>
              <button className="help-again-btn" onClick={resetForm}>Solicitar otro</button>
            </div>
          )}
        </div>
        {showForm && !sent && (
          <div className="help-form">
            <input className="tutorial-input" type="text" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="tutorial-input" type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} />
            <textarea className="tutorial-input" placeholder="&#191;Qué tutorial necesitas? Descríbelo brevemente..." value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="help-card-btn purple" onClick={sendRequest} disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar solicitud'}
              </button>
              <button className="help-card-btn outline" onClick={() => setShowForm(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <div className="help-card video-card">
        <div className="help-card-icon">&#128197;</div>
        <div className="help-card-content">
          <h3 className="help-card-title">&#191;Prefieres hablar con alguien?</h3>
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
