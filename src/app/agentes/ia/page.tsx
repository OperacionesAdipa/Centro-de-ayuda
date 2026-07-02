'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ActualizarArticulos } from '@/components/ia/ActualizarArticulos'
import { GenerarArticulos } from '@/components/ia/GenerarArticulos'
import { VideosVimeo } from '@/components/ia/VideosVimeo'

type Tab = 'actualizar' | 'generar' | 'videos'

export default function IAPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('actualizar')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('agent_token')
    if (!token) { router.push('/acceso'); return }

    fetch('/api/agent/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then((r) => {
      if (!r.ok) router.push('/acceso')
      else setLoading(false)
    })
  }, [])

  function logout() {
    localStorage.removeItem('agent_token')
    router.push('/acceso')
  }

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div className="agent-wrap">
      <div className="agent-header">
        <div className="agent-header-left">
          <img src="https://adipa.cl/content/uploads/2022/10/logo-adipa.svg" alt="ADIPA" style={{ height: 28 }} />
          <span className="agent-header-title">Centro de ayuda con IA</span>
        </div>
        <div className="agent-header-right">
          <Link href="/agentes" className="agent-nav-btn">Volver al portal</Link>
          <button className="agent-nav-btn" onClick={logout}>Cerrar sesión</button>
        </div>
      </div>

      <div className="agent-body">
        <div className="ia-tabs">
          <button
            className={`ia-tab ${tab === 'actualizar' ? 'active' : ''}`}
            onClick={() => setTab('actualizar')}
          >
            🔄 Actualizar artículos con IA
          </button>
          <button
            className={`ia-tab ${tab === 'generar' ? 'active' : ''}`}
            onClick={() => setTab('generar')}
          >
            ✨ Generar artículos con IA
          </button>
          <button
            className={`ia-tab ${tab === 'videos' ? 'active' : ''}`}
            onClick={() => setTab('videos')}
          >
            🎬 Videos Vimeo
          </button>
        </div>

        <div className="ia-tab-content">
          {tab === 'actualizar' && <ActualizarArticulos />}
          {tab === 'generar' && <GenerarArticulos />}
          {tab === 'videos' && <VideosVimeo />}
        </div>
      </div>
    </div>
  )
}
