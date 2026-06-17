import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const url = `https://adipa.zendesk.com/guide-media/${path}`

  const EMAIL = process.env.ZENDESK_EMAIL ?? ''
  const TOKEN = process.env.ZENDESK_API_TOKEN ?? ''

  if (!EMAIL || !TOKEN) {
    return new NextResponse('Missing credentials', { status: 500 })
  }

  const creds = Buffer.from(`${EMAIL}/token:${TOKEN}`).toString('base64')

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${creds}`,
        Accept: 'image/*,video/*,*/*',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      return new NextResponse(`Zendesk error: ${res.status}`, { status: res.status })
    }

    const contentType = res.headers.get('content-type') ?? 'image/jpeg'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (e) {
    return new NextResponse('Error fetching media', { status: 500 })
  }
}
