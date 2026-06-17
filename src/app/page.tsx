import Link from 'next/link'
import {
  getCategories,
  getSections,
  getArticles,
  slugify,
  CATEGORY_ICONS,
} from '@/lib/zendesk'
import { SearchBar } from '@/components/SearchBar'
import { FaqSection } from '@/components/FaqSection'
import { CountryHero } from '@/components/CountryHero'

export const revalidate = 300

export default async function HomePage() {
  const [categories, allSections, allArticles] = await Promise.all([
    getCategories(),
    getSections(),
    getArticles(),
  ])

  const promoted = allArticles
    .filter((a) => a.promoted)
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 6)

  const topViewed = allArticles
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 6)

  const featured = promoted.length > 0 ? promoted : topViewed

  const sectionMap = Object.fromEntries(allSections.map((s) => [s.id, s]))

  return (
    <>
      <CountryHero
        totalCategories={categories.length}
        totalArticles={allArticles.length}
      />

      <div className="main">
        {/* Categorías */}
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-title-icon">⊞</span>
            Categorías
          </h2>
        </div>
        <div className="cats-grid">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              href={`/categoria/${cat.id}-${slugify(cat.name)}`}
              className={`cat-card ${i % 2 === 0 ? 'purple' : 'blue'}`}
            >
              <span className="cat-card-icon">
                {CATEGORY_ICONS[cat.name] ?? '📁'}
              </span>
              <div className="cat-card-name">{cat.name}</div>
              <div className="cat-card-meta">
                {allSections.filter((s) => s.category_id === cat.id).length} secciones
              </div>
              <span className="cat-card-arrow">→</span>
            </Link>
          ))}
        </div>

        {/* Artículos destacados */}
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-title-icon">🔥</span>
            Artículos más vistos
          </h2>
        </div>
        <div className="articles-ranked">
          {featured.map((art, i) => {
            const section = sectionMap[art.section_id]
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
                    👁 {art.view_count.toLocaleString()} vistas
                    {section && <> · {section.name}</>}
                  </div>
                </div>
                <span className="art-rank-arrow">›</span>
              </Link>
            )
          })}
        </div>

        {/* FAQ */}
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-title-icon">❓</span>
            Preguntas frecuentes
          </h2>
        </div>
        <FaqSection articles={allArticles} />
      </div>
    </>
  )
}
