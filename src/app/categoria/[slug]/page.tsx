import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCategories,
  getSections,
  getArticles,
  slugify,
  CATEGORY_ICONS,
} from '@/lib/zendesk'

export const revalidate = 300

export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map((c) => ({ slug: `${c.id}-${slugify(c.name)}` }))
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string }
}) {
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

  const totalArticles = articlesPerSection.reduce(
    (sum, { arts }) => sum + arts.length,
    0
  )

  return (
    <>
      <div className="cat-page-header">
        <div className="breadcrumb">
          <Link href="/">Inicio</Link>
          <span>›</span>
          <span>{category.name}</span>
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
        <div className="url-chip">
          🔗 ayuda.adipa.cl/categoria/{params.slug}
        </div>
      </div>

      <div className="main">
        {articlesPerSection.map(({ section, arts }) => (
          <div key={section.id} className="section-group">
            <div className="section-group-name">{section.name}</div>
            {section.description && (
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                {section.description}
              </p>
            )}
            <div className="article-list">
              {arts.map((art) => (
                <Link
                  key={art.id}
                  href={`/articulo/${art.id}-${slugify(art.title)}`}
                  className="article-list-item"
                >
                  <div className="article-list-icon">📄</div>
                  <div style={{ flex: 1 }}>
                    <div className="article-list-title">{art.title}</div>
                    {art.view_count > 0 && (
                      <div className="article-list-meta">
                        👁 {art.view_count.toLocaleString()} vistas
                      </div>
                    )}
                  </div>
                  <span className="article-list-arrow">›</span>
                </Link>
              ))}
              {arts.length === 0 && (
                <p style={{ fontSize: 13, color: '#aaa', padding: '10px 0' }}>
                  No hay artículos en esta sección aún.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
