'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AgentNav } from '@/components/AgentNav'
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

  if (loading) return <div className="agent-loading">Cargando...</div>

  return (
    <div className="agent-wrap">
      <AgentNav />
      <div className="agent-body">
        <div className="ia-tabs">
          <button className={`ia-tab ${tab === 'actualizar' ? 'active' : ''}`} onClick={() => setTab('actualizar')}>
            Actualizar articulos con IA
          </button>
          <button className={`ia-tab ${tab === 'generar' ? 'active' : ''}`} onClick={() => setTab('generar')}>
            Generar articulos con IA
          </button>
          <button className={`ia-tab ${tab === 'videos' ? 'active' : ''}`} onClick={() => setTab('videos')}>
            Videos Vimeo
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
