'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AgentNav } from '@/components/AgentNav'

interface Article {
  id: number
  title: string
  view_count: number
  status: string
  category_name: string
  section_name: string
  updated_at: string
  created_at?: string
}

export default function EstadisticasPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('agent_token')
    if (!token) { router.push('/acceso'); return }
    fetch('/api/agent/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(r => {
      if (!r.ok) router.push('/acceso')
      else loadData()
    })
  }, [])

  async function loadData() {
    const res = await fetch('/api/agent/articles')
    const data = await res.json()
    setArticles(data.articles ?? [])
    setLoading(false)
  }

  if (loading) return <div className="agent-loading">Cargando...</div>

  const published = articles.filter(a => a.status === 'published')
  const drafts = articles.filter(a => a.status === 'draft')
  const pending = articles.filter(a => a.status === 'pending_review')
  const totalViews = articles.reduce((sum, a) => sum + (a.view_count ?? 0), 0)
  const noViews = published.filter(a => (a.view_count ?? 0) === 0)
  const top10 = [...articles]
    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
    .slice(0, 10)
  const maxViews = top10[0]?.view_count ?? 1

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentArticles = articles.filter(a => new Date(a.updated_at) > thirtyDaysAgo)

  const byCategory = articles.reduce((acc, a) => {
    const cat = a.category_name || 'Sin categoría'
    acc[cat] = (acc[cat] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statCard = (icon: string, label: string, value: string | number, color: string) => (
    <div style={{ background: '#fff', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 24px', borderTop: '3px solid ' + color }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</div>
    </div>
  )

  return (
    <div className="agent-wrap">
      <AgentNav />
      <div className="agent-body">
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--dark)', marginBottom: 4 }}>Estadísticas</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Panel de métricas del centro de ayuda.</p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {statCard('👁', 'Total de vistas', totalViews.toLocaleString(), '#704EFD')}
          {statCard('✅', 'Artículos publicados', published.length, '#22c55e')}
          {statCard('📭', 'Artículos sin vistas', noViews.length, '#f97316')}
          {statCard('🕐', 'Actualizados últimos 30 días', recentArticles.length, '#0ea5e9')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Top 10 artículos más vistos */}
          <div style={{ background: '#fff', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dark)', marginBottom: 16 }}>🏆 Top 10 artículos más vistos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {top10.map((art, i) => (
                <div key={art.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: i < 3 ? '#704EFD' : 'var(--muted)', width: 20, textAlign: 'center' }}>{i + 1}</span>
                    <Link href={'/agentes/editar/' + art.id} style={{ fontSize: 13, color: 'var(--dark)', flex: 1, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {art.title}
                    </Link>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)', flexShrink: 0 }}>
                      {(art.view_count ?? 0).toLocaleString()} vistas
                    </span>
                  </div>
                  <div style={{ marginLeft: 30, height: 6, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: i < 3 ? '#704EFD' : '#c4b5fd', borderRadius: 99, width: ((art.view_count ?? 0) / maxViews * 100) + '%', transition: 'width 0.5s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel derecho */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Estado de artículos */}
            <div style={{ background: '#fff', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dark)', marginBottom: 12 }}>📊 Estado de artículos</div>
              {[
                { label: 'Publicados', value: published.length, color: '#22c55e', bg: '#eaf3de' },
                { label: 'Pendientes', value: pending.length, color: '#f59e0b', bg: '#fef9c3' },
                { label: 'Borradores', value: drafts.length, color: '#6b7280', bg: '#f3f4f6' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--dark)' }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: s.color, background: s.bg, padding: '2px 10px', borderRadius: 99 }}>{s.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>Total</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple)' }}>{articles.length}</span>
              </div>
            </div>

            {/* Artículos por categoría */}
            <div style={{ background: '#fff', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dark)', marginBottom: 12 }}>🗂️ Por categoría</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--dark)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)', marginLeft: 8, flexShrink: 0 }}>{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Artículos sin vistas */}
        {noViews.length > 0 && (
          <div style={{ background: '#fff', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--dark)', marginBottom: 12 }}>📭 Artículos publicados sin vistas ({noViews.length})</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {noViews.slice(0, 12).map(art => (
                <Link key={art.id} href={'/agentes/editar/' + art.id} style={{ fontSize: 12, color: 'var(--dark)', textDecoration: 'none', padding: '8px 12px', background: '#fafafa', borderRadius: 8, border: '0.5px solid var(--border)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {art.title}
                </Link>
              ))}
            </div>
            {noViews.length > 12 && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>
                Y {noViews.length - 12} artículos más sin vistas...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
