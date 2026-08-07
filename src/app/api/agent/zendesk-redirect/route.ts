import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { zendesk_id } = await req.json()

    const auth = Buffer.from(`${process.env.ZENDESK_EMAIL}/token:${process.env.ZENDESK_TOKEN}`).toString('base64')

    // Primero probamos GET para ver si tenemos acceso al endpoint
    const getRes = await fetch('https://adipa.zendesk.com/api/v2/guide/redirect_rules', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    })

    const getText = await getRes.text()
    console.log('GET status:', getRes.status)
    console.log('GET response:', getText.slice(0, 300))

    return NextResponse.json({ get_status: getRes.status, get_body: getText.slice(0, 300), zendesk_id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
