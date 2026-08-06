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
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      console.log('Code found:', code ? 'yes' : 'no')
      console.log('Full URL:', window.location.href)
  
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        console.log('Exchange error:', JSON.stringify(error))
        console.log('Session:', data?.session?.user?.email)
  
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
  
        const token = btoa(JSON.stringify({ email, ts: Date.now() }))
        localStorage.setItem('agent_token', token)
        router.push('/agentes')
        return
      }
  
      console.log('No code found, checking session...')
      const { data, error } = await supabase.auth.getSession()
      console.log('Session error:', JSON.stringify(error))
      console.log('Session user:', data?.session?.user?.email)
      router.push('/acceso?error=auth_failed')
    }
  
    handleCallback()
  }, [])

  return (
    <div className="agent-loading">Iniciando sesión...</div>
  )
}
