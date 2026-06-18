'use client'

import { useState } from 'react'
import { useCountry } from '@/lib/useCountry'
import { ZArticle, ZSection, slugify, extractTagsFromBody } from '@/lib/zendesk'
import { replaceMexicoTerms } from '@/lib/countryUtils'
import Link from 'next/link'

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

interface Props {
  sections: ZSection[]
  articlesPerSection: { section: ZSection; arts: ZArticle[] }[]
}

export function SectionCardsGrid({ sections, articlesPerSection }: Props) {
  const { country } = useCountry()
  const [activeSection, setActiveSection] = useState<number | null>(sections[0]?.id ?? null)

  const activeArts = articlesPerSection
    .find((a) => a.section.id === activeSection)
    ?.arts.filter((art) => {
      const { countries } = extractTagsFromBody(art.body ?? '')
      if (countries.length === 0) return true
      if (countries.includes('Todos')) return true
      return countries.includes(country)
    }) ?? []

  return (
    <div>
      <div className="section-cards-grid">
        {sections.map((sec, i) => {
          const count = articlesPerSection.find((a) => a.section.id === sec.id)?.arts.length ?? 0
          const isActive = activeSection === sec.id
          return (
            <button
              key={sec.id}
              className={`section-card ${isActive ? 'active' : i % 2 === 0 ? 'purple' : 'blue'}`}
              onClick={() => setActiveSection(sec.id)}
            >
              <span className="section-card-icon">{SECTION_ICONS[sec.name] ?? '📄'}</span>
              <div className="section-card-name">{replaceMexicoTerms(sec.name, country)}</div>
              <div className="section-card-meta">{count} artículos</div>
            </button>
          )
        })}
      </div>

      {activeSection && (
        <div className="section-articles-panel">
          <div className="section-group-name">
            {replaceMexicoTerms(sections.find((s) => s.id === activeSection)?.name ?? '', country)}
          </div>
          <div className="article-list">
            {activeArts.length > 0 ? activeArts.map((art) => (
              <Link key={art.id} href={`/articulo/${art.id}-${slugify(art.title)}`} className="article-list-item">
                <div className="article-list-icon">📄</div>
                <div style={{ flex: 1 }}>
                  <div className="article-list-title">{replaceMexicoTerms(art.title, country)}</div>
                  {(art.view_count ?? 0) > 0 && (
                    <div className="article-list-meta">{art.view_count.toLocaleString()} vistas</div>
                  )}
                </div>
                <span className="article-list-arrow">›</span>
              </Link>
            )) : (
              <p style={{ fontSize: 13, color: '#aaa', padding: '10px 0' }}>No hay artículos disponibles para tu país en esta sección.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
