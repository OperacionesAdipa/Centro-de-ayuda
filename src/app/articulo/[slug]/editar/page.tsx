'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EditarDesdeArticuloPage({ params }: { params: { slug: string } }) {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('agent_token')
    const articleId = params.slug.split('-')[0]

    if (!token) {
      localStorage.setItem('redirect_after_login', `/agentes/editar/${articleId}`)
      router.push('/acceso')
      return
    }

    fetch('/api/agent/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then((r) => {
      if (!r.ok) {
        localStorage.setItem('redirect_after_login', `/agentes/editar/${articleId}`)
        router.push('/acceso')
      } else {
        router.push(`/agentes/editar/${articleId}`)
      }
    })
  }, [])

  return (
    <div className="agent-loading">Verificando sesión...</div>
  )
}
