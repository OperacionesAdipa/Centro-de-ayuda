import { NextRequest, NextResponse } from 'next/server'
import { searchArticles } from '@/lib/zendesk'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json({ results: [] })
  const results = await searchArticles(q)
  return NextResponse.json({ results: results.slice(0, 8) })
}
