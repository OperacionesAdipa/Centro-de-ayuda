import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const browserlessKey = process.env.BROWSERLESS_API_KEY
    if (!browserlessKey) return NextResponse.json({ error: 'No hay API key' })

    const res = await fetch(`https://chrome.browserless.io/screenshot?token=${browserlessKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://player.vimeo.com/video/1093834589',
        options: {
          type: 'jpeg',
          quality: 85,
          fullPage: false,
        },
        waitFor: 3000,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ ok: false, status: res.status, error: err })
    }

    const buffer = await res.arrayBuffer()
    return NextResponse.json({ 
      ok: true, 
      size: buffer.byteLength,
      message: buffer.byteLength > 5000 ? 'Screenshot capturado correctamente' : 'Screenshot muy pequeño, puede estar vacío'
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
