'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ALLOWED_DOMAINS = ['adipa.cl', 'adipa.mx', 'adipa.co', 'adipa.ar']

export default function AccesoPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
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

  async function handleGoogleLogin() {
    setLoadingGoogle(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/agent/google-callback`,
        queryParams: {
          hd: 'adipa.cl',
        },
      },
    })
    if (error) {
      setError('Error al iniciar sesión con Google.')
      setLoadingGoogle(false)
    }
  }

  return (
    <div className="acceso-wrap">
      <div className="acceso-card">
        <img src="https://adipa.cl/content/uploads/2022/10/logo-adipa.svg" alt="ADIPA" className="acceso-logo" />
        <h1 className="acceso-title">Portal de agentes</h1>
        <p className="acceso-sub">Acceso exclusivo para el equipo ADIPA</p>

        {/* Login con Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '11px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--dark)',
            marginBottom: 16,
            transition: 'all 0.15s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {loadingGoogle ? 'Redirigiendo...' : 'Iniciar sesión con Google'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>o con correo y contraseña</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

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
