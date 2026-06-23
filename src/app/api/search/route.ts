import { NextRequest, NextResponse } from 'next/server'
import { searchArticles, extractTagsFromBody } from '@/lib/zendesk'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const filter = req.nextUrl.searchParams.get('filter') ?? 'todos'

  if (q.length < 2) return NextResponse.json({ results: [] })

  const articles = await searchArticles(q)

  const results = articles
    .slice(0, 12)
    .map((art) => {
      const { isFaq } = extractTagsFromBody(art.body ?? '')
      const hasVideo = /<iframe[^>]+src=["'][^"']*(vimeo|youtube|loom)[^"']*["']/i.test(art.body ?? '')
      const type = isFaq ? 'faq' : hasVideo ? 'video' : 'articulo'
      return { ...art, type }
    })
    .filter((art) => {
      if (filter === 'todos') return true
      if (filter === 'videos') return art.type === 'video'
      if (filter === 'faq') return art.type === 'faq'
      if (filter === 'articulos') return art.type === 'articulo'
      return true
    })

  return NextResponse.json({ results })
}
