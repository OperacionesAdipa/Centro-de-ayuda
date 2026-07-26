import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getArticle, getArticles, getSections, getCategories, slugify } from '@/lib/supabaseQueries'
import { ArticleClient } from '@/components/ArticleClient'
import { ArticleSidebar } from '@/components/ArticleSidebar'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const articleId = parseInt(params.slug.split('-')[0])
  if (isNaN(articleId)) return {}

  const article = await getArticle(articleId).catch(() => null)
  if (!article) return {}

  const plainText = article.body
    ?.replace(/<[^>]*>/g, '')
    ?.replace(/\s+/g, ' ')
    ?.trim()
    ?.slice(0, 160) ?? ''

  return {
    title: `${article.title} — Centro de Ayuda ADIPA`,
    description: plainText,
    openGraph: {
      title: `${article.title} — Centro de Ayuda ADIPA`,
      description: plainText,
      type: 'article',
      siteName: 'Centro de Ayuda ADIPA',
    },
    twitter: {
      card: 'summary',
      title: `${article.title} — Centro de Ayuda ADIPA`,
      description: plainText,
    },
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const articleId = parseInt(params.slug.split('-')[0])
  if (isNaN(articleId)) notFound()

  const article = await getArticle(articleId).catch(() => null)
  if (!article) notFound()

  const [allSections, categories] = await Promise.all([
    getSections(),
    getCategories(),
  ])

  const section = allSections.find((s: any) => s.id === article.section_id)
  const category = section ? categories.find((c: any) => c.id === section.category_id) : null
  const allArticles = await getArticles()

  const relatedArticles = section
    ? allArticles.filter((a: any) => a.section_id === section.id && a.id !== article.id).slice(0, 3)
    : []

  const updatedDate = new Date(article.updated_at).toLocaleDateString('es-CL', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="article-layout">
      <ArticleSidebar
        categories={categories}
        sections={allSections}
        articles={allArticles}
        currentCategoryId={category?.id}
        currentSectionId={section?.id}
        currentArticleId={article.id}
      />
      <div className="article-main">
        <div className="article-page">
          <ArticleClient
            article={article}
            updatedDate={updatedDate}
            categoryName={category?.name}
            categorySlug={category ? `${category.id}-${slugify(category.name)}` : undefined}
            relatedArticles={relatedArticles}
          />
        </div>
      </div>
    </div>
  )
}
