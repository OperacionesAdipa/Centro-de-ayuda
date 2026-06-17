import Link from 'next/link'
import {
  getCategories,
  getSections,
  getArticles,
  slugify,
  CATEGORY_ICONS,
  extractTagsFromBody,
} from '@/lib/zendesk'
import { FaqSection } from '@/components/FaqSection'
import { CountryHero } from '@/components/CountryHero'
import { ContactSection } from '@/components/ContactSection'
import { CatsGrid } from '@/components/CatsGrid'

export const revalidate = 300

export default async function HomePage() {
  const [categories, allSections, allArticles] = await Promise.all([
    getCategories(),
    getSections(),
    getArticles(),
  ])

  const topViewed = [...allArticles]
    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
    .slice(0, 6)

  const featured = allArticles.filter((a) => a.promoted)
  const display = featured.length > 0 ? featured : topViewed

  const sectionMap = Object.fromEntries(allSections.map((s) => [s.id, s]))

  const catArticleMap: Record<number, typeof allArticles> = {}
  for (const cat of categories) {
    const sections = allSections.filter((s) => s.category_id === cat.id)
    const arts = allArticles.filter((a) => sections.some((s) => s.id === a.section_id))
    catArticleMap[cat.id] = arts
  }

  return (
    <>
      <CountryHero totalCategories={categories.length} totalArticles={allArticles.length} />

      <div className="main">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-title-icon">⊞</span>
            Categorías
          </h2>
        </div>

        <CatsGrid
          categories={categories}
          allSections={allSections}
          catArticleMap={catArticleMap}
        />

        <div className="section-header">
          <h2 className="section-title">
            <span className="section-title-icon">🔥</span>
            Artículos más vistos
          </h2>
        </div>
        <div className="articles-ranked">
          {display.map((art, i) => {
            const section = sectionMap[art.section_id]
            const views = art.view_count ?? 0
            return (
              <Link
                key={art.id}
                href={`/articulo/${art.id}-${slugify(art.title)}`}
                className="art-rank-card"
              >
                <span className="art-rank-num">{i + 1}</span>
                <div className="art-rank-info">
                  <div className="art-rank-title">{art.title}</div>
                  <div className="art-rank-meta">
                    {views > 0 && <>👁 {views.toLocaleString()} vistas</>}
                    {section && <> · {section.name}</>}
                  </div>
                </div>
                <span className="art-rank-arrow">›</span>
              </Link>
            )
          })}
        </div>

        <div className="section-divider" />

        <div className="section-header">
          <h2 className="section-title">
            <span className="section-title-icon">❓</span>
            Preguntas frecuentes
          </h2>
        </div>
        <FaqSection articles={allArticles} />

        <div className="section-divider" />

        <ContactSection />
      </div>
    </>
  )
}
