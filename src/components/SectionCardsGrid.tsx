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
  'Cursos Síncronos - En vivo': '🎥',
  'Certificados de Seminarios': '🏅',
  'Evaluación y certificación': '📝',
  'Calendarización y Programas': '📅',
  'Clases en vivo': '💻',
}

interface Props {
  sections: ZSection[]
  articlesPerSection: { section: ZSection; arts: ZArticle[] }[]
}

export function SectionCardsGrid({ sections, articlesPerSection }: Props) {
  const { country } = useCountry()
  const [activeSection, setActiveSection] = useState<number | null>(null)

  const uniqueSections = sections.filter(
    (sec, index, self) => self.findIndex((s) => s.id === sec.id) === index
  )

  const activeArts = activeSection
    ? (articlesPerSection
        .find((a) => a.section.id === activeSection)
        ?.arts.filter((art) => {
          const { countries } = extractTagsFromBody(art.body ?? '')
          if (countries.length === 0) return true
          if (countries.includes('Todos')) return true
          return countries.includes(country)
        }) ?? [])
    : []

  return (
    <div>
      <div className="section-cards-grid">
        {uniqueSections.map((sec, i) => {
          const count = articlesPerSection.find((a) => a.section.id === sec.id)?.arts.length ?? 0
          const isActive = activeSection === sec.id
          return (
            <button
              key={sec.id}
              className={`section-card ${isActive ? 'active' : i % 2 === 0 ? 'purple' : 'blue'}`}
              onClick={() => setActiveSection(isActive ? null : sec.id)}
            >
              <span className="section-card-icon">{SECTION_ICONS[sec.name] ?? '📄'}</span>
              <div className="section-card-name">{replaceMexicoTerms(sec.name, country)}</div>
              <div className="section-card-meta">{count} artículos</div>
            </button>
          )
        })}
      </div>

      {activeSection && activeArts.length > 0 && (
        <div className="section-articles-panel">
          <div className="section-group-name">
            {replaceMexicoTerms(uniqueSections.find((s) => s.id === activeSection)?.name ?? '', country)}
          </div>
          <div className="article-list">
            {activeArts.map((art) => (
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
            ))}
          </div>
        </div>
      )}

      {activeSection && activeArts.length === 0 && (
        <div className="section-articles-panel">
          <p style={{ fontSize: 13, color: '#aaa', padding: '10px 0' }}>
            No hay artículos disponibles para tu país en esta sección.
          </p>
        </div>
      )}
    </div>
  )
}
