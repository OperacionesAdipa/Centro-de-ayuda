'use client'

import { useLanguage } from '@/lib/useLanguage'

interface Props {
  icon: string
  textEs: string
  textEn: string
}

export function SectionTitle({ icon, textEs, textEn }: Props) {
  const { lang } = useLanguage()
  return (
    <div className="section-header">
      <h2 className="section-title">
        <span className="section-title-icon">{icon}</span>
        {lang === 'en' ? textEn : textEs}
      </h2>
    </div>
  )
}
