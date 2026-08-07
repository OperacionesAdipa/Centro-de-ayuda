import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { zendesk_id } = await req.json()

    const auth = Buffer.from(`${process.env.ZENDESK_EMAIL}/token:${process.env.ZENDESK_TOKEN}`).toString('base64')
    console.log('Auth header:', `Basic ${auth}`)
    console.log('Email:', process.env.ZENDESK_EMAIL)
    console.log('Token exists:', !!process.env.ZENDESK_TOKEN)

    // Primero probamos un GET para verificar autenticación
    const testRes = await fetch('https://adipa.zendesk.com/api/v2/help_center/articles.json?per_page=1', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('Test GET status:', testRes.status)
    const testText = await testRes.text()
    console.log('Test GET response:', testText.slice(0, 200))

    return NextResponse.json({ test_status: testRes.status, zendesk_id })
  } catch (e: any) {
    console.log('Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
