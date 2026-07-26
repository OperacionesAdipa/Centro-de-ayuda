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
  const [tab, setTab] = useState<Tab | null>(null)
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

  const cardStyle = (color: string) => ({
    background: '#fff',
    border: `1.5px solid ${color}20`,
    borderTop: `4px solid ${color}`,
    borderRadius: 14,
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  })

  const actionBtnStyle = (color: string, active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    borderRadius: 10,
    border: `0.5px solid ${active ? color : 'var(--border)'}`,
    background: active ? color + '12' : '#f8f8fc',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 0.15s',
    width: '100%',
  })

  return (
    <div className="agent-wrap">
      <AgentNav />
      <div className="agent-body">
        {tab === null ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--dark)', marginBottom: 4 }}>✨ Generar con IA</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Selecciona cómo quieres crear o actualizar artículos.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={cardStyle('#704EFD')}>
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🌐</div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--dark)', marginBottom: 6 }}>Artículos desde URL</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>Genera o actualiza artículos extrayendo contenido de páginas web.</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button style={actionBtnStyle('#704EFD', tab === 'actualizar')} onClick={() => setTab('actualizar')}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#704EFD20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🔄</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>Actualizar artículos</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Actualiza artículos existentes con contenido de una URL</div>
                    </div>
                  </button>
                  <button style={actionBtnStyle('#704EFD', tab === 'generar')} onClick={() => setTab('generar')}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#704EFD20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✨</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>Generar artículos nuevos</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Crea artículos nuevos a partir del contenido de una URL</div>
                    </div>
                  </button>
                </div>
              </div>

              <div style={cardStyle('#0ea5e9')}>
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--dark)', marginBottom: 6 }}>Artículos desde Video</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>Genera o actualiza artículos usando la transcripción de videos de Vimeo.</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button style={actionBtnStyle('#0ea5e9', tab === 'actualizar-video')} onClick={() => setTab('actualizar-video')}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#0ea5e920', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🔄</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>Actualizar artículos</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Actualiza artículos existentes con la transcripción de un video</div>
                    </div>
                  </button>
                  <button style={actionBtnStyle('#0ea5e9', tab === 'generar-video')} onClick={() => setTab('generar-video')}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#0ea5e920', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✨</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>Generar artículos nuevos</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Crea artículos con capturas de pantalla automáticas del video</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button
                onClick={() => setTab(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, border: '0.5px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, color: 'var(--muted)' }}
              >
                ← Volver
              </button>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--dark)' }}>
                {tab === 'actualizar' && '🔄 Actualizar artículos desde URL'}
                {tab === 'generar' && '✨ Generar artículos desde URL'}
                {tab === 'actualizar-video' && '🔄 Actualizar artículos desde Video'}
                {tab === 'generar-video' && '✨ Generar artículos desde Video'}
              </div>
            </div>
            <div style={{ background: '#fff', border: '0.5px solid var(--border)', borderRadius: 14, padding: 24 }}>
              {tab === 'actualizar' && <ActualizarArticulos />}
              {tab === 'generar' && <GenerarArticulos />}
              {tab === 'actualizar-video' && <ActualizarVideos />}
              {tab === 'generar-video' && <GenerarDesdeVideo />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
