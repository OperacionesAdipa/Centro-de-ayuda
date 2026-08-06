import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_DOMAINS = ['adipa.cl', 'adipa.mx', 'adipa.co', 'adipa.ar']

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/acceso?error=auth_failed', req.url))
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError || !data.user) {
    return NextResponse.redirect(new URL('/acceso?error=auth_failed', req.url))
  }

  const email = data.user.email ?? ''
  const domain = email.split('@')[1] ?? ''

  if (!ALLOWED_DOMAINS.includes(domain)) {
    return NextResponse.redirect(new URL('/acceso?error=domain_not_allowed', req.url))
  }

  // Generar token compatible con el sistema actual
  const token = Buffer.from(JSON.stringify({ email, ts: Date.now() })).toString('base64')

  const redirectUrl = new URL('/agentes', req.url)
  const res = NextResponse.redirect(redirectUrl)

  // Guardar token en cookie accesible desde el cliente
  res.cookies.set('agent_google_token', token, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
    secure: true,
  })

  return res
}
