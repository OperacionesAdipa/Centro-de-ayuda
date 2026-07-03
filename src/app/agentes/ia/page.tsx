'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AgentNav } from '@/components/AgentNav'
import { ActualizarArticulos } from '@/components/ia/ActualizarArticulos'
import { GenerarArticulos } from '@/components/ia/GenerarArticulos'
import { ActualizarVideos } from '@/components/ia/ActualizarVideos'
import { GenerarDesdeVideo } from '@/components/ia/GenerarDesdeVideo'

type Tab = 'actualizar' | 'generar' | 'actualizar-video' | 'generar-video'

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

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div className="agent-wrap">
      <AgentNav />
      <div className="agent-body">
        <div className="ia-tabs">
          <button className={`ia-tab ${tab === 'actualizar' ? 'active' : ''}`} onClick={() => setTab('actualizar')}>
            Actualizar artículos con IA
          </button>
          <button className={`ia-tab ${tab === 'generar' ? 'active' : ''}`} onClick={() => setTab('generar')}>
            Generar artículos con IA
          </button>
          <div className="ia-tab-divider" />
          <button className={`ia-tab video-tab ${tab === 'actualizar-video' ? 'active video-active' : ''}`} onClick={() => setTab('actualizar-video')}>
            Actualizar artículos con video
          </button>
          <button className={`ia-tab video-tab ${tab === 'generar-video' ? 'active video-active' : ''}`} onClick={() => setTab('generar-video')}>
            Generar artículos con video
          </button>
        </div>

        <div className="ia-tab-content">
          {tab === 'actualizar' && <ActualizarArticulos />}
          {tab === 'generar' && <GenerarArticulos />}
          {tab === 'actualizar-video' && <ActualizarVideos />}
          {tab === 'generar-video' && <GenerarDesdeVideo />}
        </div>
      </div>
    </div>
  )
}
