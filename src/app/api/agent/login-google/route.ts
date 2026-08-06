import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED_DOMAINS = ['adipa.cl', 'adipa.mx', 'adipa.co', 'adipa.ar']

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const domain = email.split('@')[1] ?? ''
    if (!ALLOWED_DOMAINS.includes(domain)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await supabaseAdmin.from('agent_sessions').insert({
      token,
      email,
      expires_at: expiresAt,
    })

    return NextResponse.json({ token })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
