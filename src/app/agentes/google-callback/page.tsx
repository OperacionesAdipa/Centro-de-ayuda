'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ALLOWED_DOMAINS = ['adipa.cl', 'adipa.mx', 'adipa.co', 'adipa.ar']

export default function GoogleCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleCallback() {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        router.push('/acceso?error=auth_failed')
        return
      }

      const email = data.session.user.email ?? ''
      const domain = email.split('@')[1] ?? ''

      if (!ALLOWED_DOMAINS.includes(domain)) {
        await supabase.auth.signOut()
        router.push('/acceso?error=domain_not_allowed')
        return
      }

      // Crear sesión en el sistema existente
      const res = await fetch('/api/agent/login-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const loginData = await res.json()

      if (!res.ok || !loginData.token) {
        router.push('/acceso?error=auth_failed')
        return
      }

      localStorage.setItem('agent_token', loginData.token)
      router.push('/agentes')
    }

    handleCallback()
  }, [])

  return (
    <div className="agent-loading">Iniciando sesión...</div>
  )
}
