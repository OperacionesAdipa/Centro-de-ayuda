import { getArticles, getCategories, getSections } from '@/lib/zendesk'
import { ArticleSidebar } from '@/components/ArticleSidebar'
import { VideoTutorialsGrid } from '@/components/VideoTutorialsGrid'

export const revalidate = 300

export default async function VideoTutorialesPage() {
  const [allArticles, allSections, categories] = await Promise.all([
    getArticles(),
    getSections(),
    getCategories(),
  ])

  return (
    <div className="article-layout">
      <ArticleSidebar
        categories={categories}
        sections={allSections}
        articles={allArticles}
      />
      <div className="article-main">
        <div className="cat-page-header">
          <div className="cat-page-title-row">
            <div className="cat-page-icon">🎬</div>
            <div>
              <div className="cat-page-name">Videotutoriales</div>
              <div className="cat-page-desc">Todos los tutoriales en video de ADIPA</div>
            </div>
          </div>
        </div>
        <div className="main">
          <VideoTutorialsGrid articles={allArticles} />
        </div>
      </div>
    </div>
  )
}
