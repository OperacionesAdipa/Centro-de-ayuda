import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const browserlessKey = process.env.BROWSERLESS_API_KEY
    if (!browserlessKey) return NextResponse.json({ error: 'No hay API key' })

    const vimeoId = req.nextUrl.searchParams.get('id') ?? '1093834589'
    const timestamp = parseInt(req.nextUrl.searchParams.get('t') ?? '10')

    const playerUrl = `https://player.vimeo.com/video/${vimeoId}#t=${timestamp}s`

    const res = await fetch(`https://chrome.browserless.io/screenshot?token=${browserlessKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: playerUrl,
        options: {
          type: 'jpeg',
          quality: 90,
          fullPage: false,
        },
        gotoOptions: {
          waitUntil: 'networkidle2',
          timeout: 30000,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ ok: false, status: res.status, error: err })
    }

    const buffer = await res.arrayBuffer()

    const fileName = `test-${vimeoId}-${timestamp}.jpg`
    const { error } = await supabaseAdmin.storage
      .from('article-images')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })

    if (error) return NextResponse.json({ ok: false, error: error.message, size: buffer.byteLength })

    const { data } = supabaseAdmin.storage.from('article-images').getPublicUrl(fileName)

    return NextResponse.json({ ok: true, size: buffer.byteLength, url: data.publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
