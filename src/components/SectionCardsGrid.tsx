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

  return (
    <div className="section-accordion">
      {uniqueSections.map((sec, i) => {
        const entry = articlesPerSection.find((a) => a.section.id === sec.id)
        const arts = entry?.arts.filter((art) => {
          const { countries } = extractTagsFromBody(art.body ?? '')
          if (countries.length === 0) return true
          if (countries.includes('Todos')) return true
          return countries.includes(country)
        }) ?? []
        const isActive = activeSection === sec.id
        const count = arts.length

        return (
          <div key={sec.id} className="section-accordion-item">
            <button
              className={`section-card-large ${isActive ? 'active' : i % 2 === 0 ? 'purple' : 'blue'}`}
              onClick={() => setActiveSection(isActive ? null : sec.id)}
              style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span className="section-card-large-icon">
                {SECTION_ICONS[sec.name] ?? '📄'}
              </span>
              <div style={{ flex: 1 }}>
                <div className="section-card-large-name">
                  {replaceMexicoTerms(sec.name, country)}
                </div>
                <div className="section-card-large-meta">{count} artículos</div>
              </div>
              <span style={{ fontSize: 18, color: 'var(--purple)', marginLeft: 8 }}>
                {isActive ? '▾' : '›'}
              </span>
            </button>

            {isActive && (
              <div className="section-accordion-articles">
                {arts.length > 0 ? (
                  <div className="article-list">
                    {arts.map((art) => (
                      <Link
                        key={art.id}
                        href={`/articulo/${art.id}-${slugify(art.title)}`}
                        className="article-list-item"
                      >
                        <div className="article-list-icon">📄</div>
                        <div style={{ flex: 1 }}>
                          <div className="article-list-title">
                            {replaceMexicoTerms(art.title, country)}
                          </div>
                          {(art.view_count ?? 0) > 0 && (
                            <div className="article-list-meta">
                              {art.view_count.toLocaleString()} vistas
                            </div>
                          )}
                        </div>
                        <span className="article-list-arrow">›</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#aaa', padding: '10px 16px' }}>
                    No hay artículos disponibles para tu país en esta sección.
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
