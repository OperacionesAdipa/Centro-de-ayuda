import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { zendesk_id } = await req.json()

    const email = process.env.ZENDESK_EMAIL ?? ''
    const token = process.env.ZENDESK_TOKEN ?? ''
    const auth = Buffer.from(`${email}/token:${token}`).toString('base64')

    console.log('Email length:', email.length)
    console.log('Token length:', token.length)
    console.log('Auth:', auth.slice(0, 20) + '...')

    const res = await fetch('https://adipa.zendesk.com/api/v2/guide/redirect_rules', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js/NextJS-App',
      },
      body: JSON.stringify({
        redirect_rule: {
          redirect_from: `/hc/es-419/articles/${zendesk_id}`,
          redirect_to: `https://centro-de-ayuda-eta.vercel.app/api/redirect/${zendesk_id}`,
          redirect_status: 301,
        }
      }),
    })

    const text = await res.text()
    console.log('Status:', res.status)
    console.log('Response:', text.slice(0, 300))

    return NextResponse.json({ status: res.status, body: text })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
