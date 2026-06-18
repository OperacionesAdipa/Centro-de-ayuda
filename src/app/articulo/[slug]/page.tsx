import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getArticle, getArticles, getSections, getCategories, slugify } from '@/lib/zendesk'
import { ArticleClient } from '@/components/ArticleClient'
import { ArticleSidebar } from '@/components/ArticleSidebar'

export const revalidate = 300

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const articleId = parseInt(params.slug.split('-')[0])
  if (isNaN(articleId)) notFound()

  const article = await getArticle(articleId).catch(() => null)
  if (!article) notFound()

  const [allSections, categories] = await Promise.all([
    getSections(),
    getCategories(),
  ])

  const section = allSections.find((s) => s.id === article.section_id)
  const category = section ? categories.find((c) => c.id === section.category_id) : null
  const allArticles = await getArticles()

  const relatedArticles = section
    ? allArticles.filter((a) => a.section_id === section.id && a.id !== article.id).slice(0, 3)
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
