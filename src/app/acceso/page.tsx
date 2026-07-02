'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AccesoPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/agent/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (res.ok && data.token) {
      localStorage.setItem('agent_token', data.token)
      const redirect = localStorage.getItem('redirect_after_login')
      localStorage.removeItem('redirect_after_login')
      router.push(redirect ?? '/agentes')
    } else {
      setError('Correo o contraseña incorrectos.')
    }
    setLoading(false)
  }

  return (
    <div className="acceso-wrap">
      <div className="acceso-card">
        <img src="https://adipa.cl/content/uploads/2022/10/logo-adipa.svg" alt="ADIPA" className="acceso-logo" />
        <h1 className="acceso-title">Portal de agentes</h1>
        <p className="acceso-sub">Acceso exclusivo para el equipo ADIPA</p>

        <div className="acceso-form">
          <input
            className="tutorial-input"
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <input
            className="tutorial-input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          {error && <p className="acceso-error">{error}</p>}
          <button
            className="help-card-btn purple"
            onClick={handleLogin}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>
      </div>
    </div>
  )
}
