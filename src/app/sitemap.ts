import { MetadataRoute } from 'next'
import { getArticles, getCategories, slugify } from '@/lib/supabaseQueries'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://centro-de-ayuda-eta.vercel.app'

  const [articles, categories] = await Promise.all([
    getArticles(),
    getCategories(),
  ])

  const articleUrls = articles
    .filter((a: any) => a.status === 'published')
    .map((a: any) => ({
      url: `${baseUrl}/articulo/${a.id}-${slugify(a.title)}`,
      lastModified: new Date(a.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  const categoryUrls = categories.map((c: any) => ({
    url: `${baseUrl}/categoria/${c.id}-${slugify(c.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/videotutoriales`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...categoryUrls,
    ...articleUrls,
  ]
}
