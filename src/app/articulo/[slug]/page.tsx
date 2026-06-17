import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getArticle, getArticles, getSections, getCategories, slugify, CATEGORY_ICONS } from '@/lib/zendesk'
import { ArticleClient } from '@/components/ArticleClient'

export const revalidate = 300

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const articleId = parseInt(params.slug.split('-')[0])
  if (isNaN(articleId)) notFound()

  const article = await getArticle(articleId).catch(() => null)
  if (!article) notFound()

  const [sections, categories] = await Promise.all([
    getSections(),
    getCategories(),
  ])

  const section = sections.find((s) => s.id === article.section_id)
  const category = section
    ? categories.find((c) => c.id === section.category_id)
    : null

  const relatedArticles = section
    ? (await getArticles(section.id))
        .filter((a) => a.id !== article.id)
        .slice(0, 3)
    : []

  const updatedDate = new Date(article.updated_at).toLocaleDateString('es-CL', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <>
      <div style={{ background: '#fff', borderBottom: '0.5px solid rgba(112,78,253,0.1)', padding: '12px 24px' }}>
        <div className="breadcrumb">
          <Link href="/">Inicio</Link>
          <span>›</span>
          {category && (
            <>
              <Link href={`/categoria/${category.id}-${slugify(category.name)}`}>
                {category.name}
              </Link>
              <span>›</span>
            </>
          )}
          <span style={{ color: '#6b7280' }}>
            {article.title.length > 40 ? article.title.slice(0, 40) + '…' : article.title}
          </span>
        </div>
      </div>

      <div className="article-page">
        <ArticleClient
          article={article}
          updatedDate={updatedDate}
          categoryName={category?.name}
          categorySlug={category ? `${category.id}-${slugify(category.name)}` : undefined}
          relatedArticles={relatedArticles}
        />
      </div>
    </>
  )
}
