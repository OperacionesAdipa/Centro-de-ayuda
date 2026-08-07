import Link from 'next/link'
import { getCategories, getSections, getArticles, slugify } from '@/lib/supabaseQueries'
import { FaqSection } from '@/components/FaqSection'
import { CountryHero } from '@/components/CountryHero'
import { ContactSection } from '@/components/ContactSection'
import { CatsGrid } from '@/components/CatsGrid'
import { VideoTutorials } from '@/components/VideoTutorials'
import { RecentlyViewed } from '@/components/RecentlyViewed'
import { HelpSection } from '@/components/HelpSection'
import { HomeClient } from '@/components/HomeClient'
import { SectionTitle } from '@/components/SectionTitle'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [categories, allSections, allArticles] = await Promise.all([
    getCategories(),
    getSections(),
    getArticles(),
  ])

  const topViewed = [...allArticles]
    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
    .slice(0, 3)
  const featured = allArticles.filter((a) => a.promoted).slice(0, 3)
  const display = featured.length > 0 ? featured : topViewed
  const faqArticles = allArticles.filter((a: any) =>
    (a.label_names ?? []).includes('faq')
  )
  const sectionMap = Object.fromEntries(allSections.map((s: any) => [s.id, s]))
  const catArticleMap: Record<number, any[]> = {}
  for (const cat of categories) {
    const sections = allSections.filter((s: any) => s.category_id === cat.id)
    const arts = allArticles.filter((a: any) => sections.some((s: any) => s.id === a.section_id))
    catArticleMap[cat.id] = arts
  }

  return (
    <>
      <CountryHero totalCategories={categories.length} totalArticles={allArticles.length} />
      <div className="main">
        <RecentlyViewed />
        <SectionTitle icon="⊞" textEs="Categorías" textEn="Categories" />
        <CatsGrid categories={categories} allSections={allSections} catArticleMap={catArticleMap} />
        <div className="section-divider" />
        <VideoTutorials articles={allArticles} />
        <div className="section-divider" />
        <HomeClient display={display} sectionMap={sectionMap} />
        <div className="section-divider" />
        <SectionTitle icon="❓" textEs="Preguntas frecuentes" textEn="Frequently asked questions" />
        <FaqSection articles={faqArticles} />
        <div className="section-divider" />
        <HelpSection />
        <ContactSection />
      </div>
    </>
  )
}
