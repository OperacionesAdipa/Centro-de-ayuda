'use client'

import { useState } from 'react'
import { useCountry } from '@/lib/useCountry'
import { slugify, filterArticlesByCountry } from '@/lib/supabaseQueries'
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
  'Preguntas Frecuentes': '❓',
  'Cursos Síncronos - En vivo': '🎥',
  'Certificados de Seminarios': '🏅',
  'Evaluación y certificación': '📝',
  'Calendarización y Programas': '📅',
  'Clases en vivo': '💻',
  'ADIPARTNERS': '🤝',
  'Adipartners': '🤝',
  'Comunidad ADIPA': '👥',
  'Recursos Gratuitos': '🆓',
  'Funcionalidad del Aula': '💻',
  'Recursos desde el Aula': '📚',
  'Accesos al Aula Virtual': '🔑',
  'Programas': '🎓',
  'Certificados': '🏅',
  'Preguntas frecuentes Ventas': '❓',
  'Productos ADIPA': '📦',
  'Precios programas': '💰',
  'Inscripciones y Formas de pago': '💳',
}

interface Props {
  sections: any[]
  articlesPerSection: { section: any; arts: any[] }[]
}

export function SectionCardsGrid({ sections, articlesPerSection }: Props) {
  const { country } = useCountry()
  const [activeSection, setActiveSection] = useState<number | null>(null)

  const uniqueSections = sections.filter(
    (sec, index, self) => self.findIndex((s) => s.id === sec.id) === index
  )

  const visibleSections = uniqueSections.filter((sec) => {
    const arts = articlesPerSection.find((a) => a.section.id === sec.id)?.arts ?? []
    return filterArticlesByCountry(arts, country).length > 0
  })

  return (
    <div className="section-accordion">
      {visibleSections.map((sec, i) => {
        const entry = articlesPerSection.find((a) => a.section.id === sec.id)
        const arts = filterArticlesByCountry(entry?.arts ?? [], country)
        const isActive = activeSection === sec.id
        const icon = SECTION_ICONS[sec.name] ?? '📂'

        return (
          <div key={sec.id} className="section-accordion-item">
            <button
              className={`section-card-large ${isActive ? 'active' : i % 2 === 0 ? 'purple' : 'blue'}`}
              onClick={() => setActiveSection(isActive ? null : sec.id)}
              style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span className="section-card-large-icon">{icon}</span>
              <div style={{ flex: 1 }}>
                <div className="section-card-large-name">
                  {replaceMexicoTerms(sec.name, country)}
                </div>
                <div className="section-card-large-meta">{arts.length} artículos</div>
              </div>
              <span style={{ fontSize: 18, color: 'var(--purple)', marginLeft: 8 }}>
                {isActive ? '▾' : '›'}
              </span>
            </button>

            {isActive && (
              <div className="section-accordion-articles">
                <div className="article-list">
                  {arts.map((art: any) => (
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
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
