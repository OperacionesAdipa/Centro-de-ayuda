import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const vimeoId = req.nextUrl.searchParams.get('id') ?? '1202296335'
    const timestamp = parseInt(req.nextUrl.searchParams.get('t') ?? '30')

    const createRes = await fetch(`https://api.vimeo.com/videos/${vimeoId}/pictures`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VIMEO_TOKEN}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ time: Math.floor(timestamp), active: false }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      return NextResponse.json({ step: 'create_picture', ok: false, status: createRes.status, error: err })
    }

    const pictureData = await createRes.json()
    const sizes = pictureData.sizes ?? []
    const largest = sizes.find((s: any) => s.width >= 1280) ?? sizes[sizes.length - 1]
    const imageUrl = largest?.link ?? null

    if (!imageUrl) {
      return NextResponse.json({ step: 'get_url', ok: false, pictureData, sizes })
    }

    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) {
      return NextResponse.json({ step: 'fetch_image', ok: false, status: imgRes.status, imageUrl })
    }

    const buffer = await imgRes.arrayBuffer()
    const fileName = `test-vimeo-api-${vimeoId}-${timestamp}.jpg`

    const { error } = await supabaseAdmin.storage
      .from('article-images')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })

    if (error) {
      return NextResponse.json({ step: 'upload', ok: false, error: error.message, bufferSize: buffer.byteLength })
    }

    const { data } = supabaseAdmin.storage.from('article-images').getPublicUrl(fileName)

    return NextResponse.json({ step: 'complete', ok: true, imageUrl, publicUrl: data.publicUrl, bufferSize: buffer.byteLength })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
