import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { zendesk_id } = await req.json()

    const res = await fetch(`https://adipa.zendesk.com/api/v2/guide/redirect_rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.ZENDESK_EMAIL}/token:${process.env.ZENDESK_TOKEN}`).toString('base64'),
      },
      body: JSON.stringify({
        redirect_rule: {
          redirect_from: `/hc/es-419/articles/${zendesk_id}`,
          redirect_to: `https://centro-de-ayuda-eta.vercel.app/api/redirect/${zendesk_id}`,
          redirect_status: 301,
        }
      }),
    })

    const data = await res.json()
    return NextResponse.json({ ok: res.ok, data, status: res.status })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
