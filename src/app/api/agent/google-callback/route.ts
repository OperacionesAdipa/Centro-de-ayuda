import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_DOMAINS = ['adipa.cl', 'adipa.mx', 'adipa.co', 'adipa.ar']

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/acceso?error=no_code', req.url))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) return NextResponse.redirect(new URL('/acceso?error=auth_failed', req.url))

  const email = data.user.email ?? ''
  const domain = email.split('@')[1] ?? ''

  if (!ALLOWED_DOMAINS.includes(domain)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/acceso?error=domain_not_allowed', req.url))
  }

  // Generar token de agente
  const token = Buffer.from(JSON.stringify({ email, ts: Date.now() })).toString('base64')

  const res = NextResponse.redirect(new URL('/agentes', req.url))
  res.cookies.set('agent_token', token, { httpOnly: false, maxAge: 60 * 60 * 24 * 7 })

  return res
}
