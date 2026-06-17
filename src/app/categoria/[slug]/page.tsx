import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCategories,
  getSections,
  getArticles,
  slugify,
  CATEGORY_ICONS,
} from '@/lib/zendesk'
import { CategoryArticles } from '@/components/CategoryArticles'

export const revalidate = 300

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categoryId = parseInt(params.slug.split('-')[0])
  if (isNaN(categoryId)) notFound()

  const [categories, sections] = await Promise.all([
    getCategories(),
    getSections(categoryId),
  ])

  const category = categories.find((c) => c.id === categoryId)
  if (!category) notFound()

  const articlesPerSection = await Promise.all(
    sections.map((s) => getArticles(s.id).then((arts) => ({ section: s, arts })))
  )

  const totalArticles = articlesPerSection.reduce((sum, { arts }) => sum + arts.length, 0)

  return (
    <>
      <div className="cat-page-header">
        <div style={{ marginBottom: 16 }}>
          <Link href="/" className="back-btn-top back-btn-solid">
            ← Volver al inicio
          </Link>
        </div>
        <div className="cat-page-title-row">
          <div className="cat-page-icon">
            {CATEGORY_ICONS[category.name] ?? '📁'}
          </div>
          <div>
            <div className="cat-page-name">{category.name}</div>
            {category.description && (
              <div className="cat-page-desc">{category.description}</div>
            )}
            <div className="cat-page-desc">
              {sections.length} secciones · {totalArticles} artículos
            </div>
          </div>
        </div>
      </div>

      <div className="main">
        <CategoryArticles articlesPerSection={articlesPerSection} />
      </div>
    </>
  )
}
