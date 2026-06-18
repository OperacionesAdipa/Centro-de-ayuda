import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCategories,
  getSections,
  getArticles,
  slugify,
  CATEGORY_ICONS,
  ZArticle,
  ZSection,
} from '@/lib/zendesk'
import { CategoryArticles } from '@/components/CategoryArticles'
import { ArticleSidebar } from '@/components/ArticleSidebar'

export const revalidate = 300

const SECTION_ICONS: Record<string, string> = {
  'Cursos Síncronos': '🎥',
  'Cursos Asíncronos': '📚',
  'Diplomados y Postítulos': '🎓',
  'Especializaciones': '⭐',
  'Seminarios': '📡',
  'Sesiones Magistrales': '🏛️',
  'Acreditaciones Internacionales': '🏅',
  'Inscripciones': '📋',
  'Formas de pago': '💳',
  'Beneficios': '🎁',
  'Comunidad': '👥',
  'Mi perfil': '👤',
  'Accesos': '🔑',
  'Preguntas frecuentes': '❓',
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categoryId = parseInt(params.slug.split('-')[0])
  if (isNaN(categoryId)) notFound()

  const [categories, sections, allSections] = await Promise.all([
    getCategories(),
    getSections(categoryId),
    getSections(),
  ])

  const category = categories.find((c) => c.id === categoryId)
  if (!category) notFound()

  const articlesPerSection = await Promise.all(
    sections.map((s) => getArticles(s.id).then((arts) => ({ section: s, arts })))
  )

  const allArticles = await getArticles()
  const totalArticles = articlesPerSection.reduce((sum, { arts }) => sum + arts.length, 0)

  const UPDATED_ICONS: Record<string, string> = {
    'Admisión y Matrícula': '📋',
    'Comunidad y Beneficios': '🎁',
    'Sitio Web': '🌐',
    'Aula Virtual': '💻',
    'Programas y Cursos': '🎓',
    'Preguntas frecuentes': '❓',
  }

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
              ← Volver al inicio
            </Link>
          </div>
          <div className="cat-page-title-row">
            <div className="cat-page-icon">
              {UPDATED_ICONS[category.name] ?? CATEGORY_ICONS[category.name] ?? '📁'}
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
          {sections.length > 4 ? (
            <CategoryWithSectionGrid
              sections={sections}
              articlesPerSection={articlesPerSection}
              sectionIcons={SECTION_ICONS}
            />
          ) : (
            <CategoryArticles articlesPerSection={articlesPerSection} />
          )}
        </div>
      </div>
    </div>
  )
}

function CategoryWithSectionGrid({
  sections,
  articlesPerSection,
  sectionIcons,
}: {
  sections: ZSection[]
  articlesPerSection: { section: ZSection; arts: ZArticle[] }[]
  sectionIcons: Record<string, string>
}) {
  return (
    <div>
      <div className="section-cards-grid">
        {sections.map((sec, i) => {
          const entry = articlesPerSection.find((a) => a.section.id === sec.id)
          const count = entry?.arts.length ?? 0
          return (
            
              key={sec.id}
              href={`#section-${sec.id}`}
              className={`section-card ${i % 2 === 0 ? 'purple' : 'blue'}`}
            >
              <span className="section-card-icon">
                {sectionIcons[sec.name] ?? '📄'}
              </span>
              <div className="section-card-name">{sec.name}</div>
              <div className="section-card-meta">{count} artículos</div>
            </a>
          )
        })}
      </div>
      <CategoryArticles articlesPerSection={articlesPerSection} />
    </div>
  )
}
