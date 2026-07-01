import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomBytes } from 'crypto'

const AGENT_EMAIL = 'operaciones@adipa.cl'
const AGENT_PASSWORD = 'Operacionesadipa123'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (email !== AGENT_EMAIL || password !== AGENT_PASSWORD) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    await supabaseAdmin
      .from('agent_sessions')
      .insert({ email, token, expires_at: expiresAt })

    return NextResponse.json({ token })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
