import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { zendesk_id } = await req.json()

    const auth = Buffer.from(`${process.env.ZENDESK_EMAIL}/token:${process.env.ZENDESK_TOKEN}`).toString('base64')

    const body = JSON.stringify({
      redirect_rule: {
        redirect_from: `/hc/es-419/articles/${zendesk_id}`,
        redirect_to: `https://centro-de-ayuda-eta.vercel.app/api/redirect/${zendesk_id}`,
        redirect_status: 301,
      }
    })

    console.log('Body enviado:', body)

    const res = await fetch('https://adipa.zendesk.com/api/v2/guide/redirect_rules', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
    })

    const text = await res.text()
    console.log('Status:', res.status)
    console.log('Response:', text)
    console.log('Headers:', JSON.stringify(Object.fromEntries(res.headers.entries())))

    return NextResponse.json({ status: res.status, body: text })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
