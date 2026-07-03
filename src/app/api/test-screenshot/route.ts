import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const browserlessKey = process.env.BROWSERLESS_API_KEY
    if (!browserlessKey) return NextResponse.json({ error: 'No hay API key' })

    const vimeoId = req.nextUrl.searchParams.get('id') ?? '1202296335'
    const timestamp = parseInt(req.nextUrl.searchParams.get('t') ?? '30')

    const res = await fetch(`https://chrome.browserless.io/screenshot?token=${browserlessKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1`,
        options: {
          type: 'jpeg',
          quality: 90,
          fullPage: false,
        },
        waitFor: {
          selector: 'video',
          timeout: 15000,
        },
        evaluate: `
          new Promise((resolve) => {
            const video = document.querySelector('video');
            if (video) {
              video.muted = true;
              video.currentTime = ${timestamp};
              video.addEventListener('seeked', () => {
                video.pause();
                setTimeout(resolve, 500);
              }, { once: true });
              setTimeout(resolve, 5000);
            } else {
              setTimeout(resolve, 3000);
            }
          })
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ ok: false, status: res.status, error: err })
    }

    const buffer = await res.arrayBuffer()
    const fileName = `test-seek-${vimeoId}-${timestamp}.jpg`
    await supabaseAdmin.storage.from('article-images').upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })
    const { data } = supabaseAdmin.storage.from('article-images').getPublicUrl(fileName)

    return NextResponse.json({ ok: true, size: buffer.byteLength, url: data.publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
