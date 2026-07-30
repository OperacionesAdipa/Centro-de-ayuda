import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCategories, getSections, getArticles, slugify } from '@/lib/supabaseQueries'
import { CategoryArticles } from '@/components/CategoryArticles'
import { ArticleSidebar } from '@/components/ArticleSidebar'
import { SectionCardsGrid } from '@/components/SectionCardsGrid'

export const dynamic = 'force-dynamic'

function getIconFromName(fullName: string): { icon: string; name: string } {
  const chars = [...fullName.trim()]
  if (chars.length === 0) return { icon: '📁', name: fullName }
  const first = chars[0]
  const codePoint = first.codePointAt(0) ?? 0
  if (codePoint > 127) {
    const rest = chars.slice(1).join('').trim()
    return { icon: first, name: rest }
  }
  return { icon: '📁', name: fullName.trim() }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categoryId = parseInt(params.slug.split('-')[0])
  if (isNaN(categoryId)) notFound()

  const [categories, sections, allSections] = await Promise.all([
    getCategories(),
    getSections(categoryId),
    getSections(),
  ])

  const category = categories.find((c: any) => c.id === categoryId)
  if (!category) notFound()

  const { icon, name } = getIconFromName(category.name)

  const articlesPerSection = await Promise.all(
    sections.map((s: any) => getArticles(s.id).then((arts) => ({ section: s, arts })))
  )

  const allArticles = await getArticles()
  const totalArticles = articlesPerSection.reduce((sum, { arts }) => sum + arts.length, 0)

  return (
    <div className="article-layout">
      <ArticleSidebar
        categories={categories}
        sections={allSections}
        articles={allArticles}
        currentCategoryId={categoryId}
      />
      <div className="article-main">
        <div className="cat-page-header">
          <div style={{ marginBottom: 16 }}>
            <Link href="/" className="back-btn-top back-btn-solid">
              Volver al inicio
            </Link>
          </div>
          <div className="cat-page-title-row">
            <div className="cat-page-icon">{icon}</div>
            <div>
              <div className="cat-page-name">{name}</div>
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
          {sections.length >= 2 ? (
            <SectionCardsGrid
              sections={sections}
              articlesPerSection={articlesPerSection}
            />
          ) : (
            <CategoryArticles articlesPerSection={articlesPerSection} />
          )}
        </div>
      </div>
    </div>
  )
}
