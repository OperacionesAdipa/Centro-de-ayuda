import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const country =
    req.headers.get('x-vercel-ip-country') ||
    req.geo?.country ||
    'CL'

  return NextResponse.json({ country })
}
