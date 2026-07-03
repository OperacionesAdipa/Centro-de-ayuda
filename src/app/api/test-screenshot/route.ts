import { NextRequest, NextResponse } from 'next/server'

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
      body: JSON.stringify({ time: timestamp, active: false }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      return NextResponse.json({ ok: false, status: createRes.status, error: err })
    }

    const pictureData = await createRes.json()
    const sizes = pictureData.sizes ?? []
    const largest = sizes.find((s: any) => s.width >= 1280) ?? sizes[sizes.length - 1]

    return NextResponse.json({
      ok: true,
      timestamp,
      pictureUri: pictureData.uri,
      imageUrl: largest?.link ?? null,
      allSizes: sizes.map((s: any) => ({ width: s.width, link: s.link })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}
