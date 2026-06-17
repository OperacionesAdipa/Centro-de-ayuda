import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const url = `https://adipa.zendesk.com/guide-media/${path}`

  const EMAIL = process.env.ZENDESK_EMAIL || ''
  const TOKEN = process.env.ZENDESK_API_TOKEN || ''
  const creds = Buffer.from(`${EMAIL}/token:${TOKEN}`).toString('base64')

  const res = await fetch(url, {
    headers: {
      Authorization: `Basic ${creds}`,
    },
  })

  if (!res.ok) {
    return new NextResponse('Not found', { status: 404 })
  }

  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const buffer = await res.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
