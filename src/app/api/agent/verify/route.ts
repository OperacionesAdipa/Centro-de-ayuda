import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('agent_sessions')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return NextResponse.json({ valid: false }, { status: 401 })
    }

    return NextResponse.json({ valid: true, email: data.email })
  } catch (e: any) {
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}
