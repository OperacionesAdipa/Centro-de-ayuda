'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCountry } from '@/lib/useCountry'
import { ZArticle, slugify, extractTagsFromBody } from '@/lib/zendesk'

interface VideoItem {
  title: string
  articleSlug: string
  embedUrl: string
}

function extractVideos(articles: ZArticle[], country: string): VideoItem[] {
  const items: VideoItem[] = []

  for (const art of articles) {
    const { countries } = extractTagsFromBody(art.body ?? '')
    const isVisible =
      countries.length === 0 ||
      countries.includes('Todos') ||
      countries.includes(country)

    if (!isVisible) continue

    const iframeRegex = /<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi
    let match
    while ((match = iframeRegex.exec(art.body ?? '')) !== null) {
      const src = match[1]
      let embedUrl = ''

      if (src.includes('vimeo.com')) {
        embedUrl = src.startsWith('http') ? src : `https:${src}`
      } else if (src.includes('loom.com')) {
        embedUrl = src.startsWith('http') ? src : `https:${src}`
      } else if (src.includes('youtube.com') || src.includes('youtu.be')) {
        embedUrl = src.startsWith('http') ? src : `https:${src}`
      }

      if (embedUrl) {
        items.push({
          title: art.title,
          articleSlug: `${art.id}-${slugify(art.title)}`,
          embedUrl,
        })
      }
    }
  }

  return items
}

interface Props {
  articles: ZArticle[]
}

export function VideoTutorials({ articles }: Props) {
  const { country } = useCountry()
  const [current, setCurrent] = useState(0)
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null)

  const videos = extractVideos(articles, country)

  if (videos.length === 0) return null

  const perPage = 3
  const total = videos.length
  const maxIndex = Math.max(0, total - perPage)

  function prev() { setCurrent((c) => Math.max(0, c - 1)) }
  function next() { setCurrent((c) => Math.min(maxIndex, c + 1)) }

  const visible = videos.slice(current, current + perPage)

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 className="section-title">
            <span className="section-title-icon">🎬</span>
            Videotutoriales
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/videotutoriales" className="see-all-btn">Ver todo →</Link>
            <button onClick={prev} disabled={current === 0} className="carousel-btn" aria-label="Anterior">‹</button>
            <button onClick={next} disabled={current >= maxIndex} className="carousel-btn" aria-label="Siguiente">›</button>
          </div>
        </div>

        <div className="video-carousel">
          {visible.map((v, i) => (
            <div key={`${v.articleSlug}-${i}`} className="video-card" onClick={() => setActiveVideo(v)}>
              <div className="video-card-thumb">
                <div className="video-thumb-bg">
                  <img src="https://adipa.cl/content/uploads/2022/10/logo-adipa.svg" alt="ADIPA" className="video-thumb-logo" />
                  <div className="video-thumb-text">¡Dale play al tutorial!</div>
                </div>
                <div className="video-play-btn">▶</div>
              </div>
              <div className="video-card-info">
                <div className="video-card-title">{v.title}</div>
                <div className="video-card-sub">Ver videotutorial</div>
              </div>
            </div>
          ))}
        </div>

        {total > perPage && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`carousel-dot ${current === i ? 'active' : ''}`} aria-label={`Ir a página ${i + 1}`} />
            ))}
          </div>
        )}
      </div>

      {activeVideo && (
        <div className="video-modal-overlay" onClick={() => setActiveVideo(null)}>
          <div className="video-modal" onClick={(e) => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setActiveVideo(null)}>✕</button>
            <h3 className="video-modal-title">{activeVideo.title}</h3>
            <div className="video-modal-embed">
              <iframe src={activeVideo.embedUrl} width="100%" height="100%" frameBorder="0" allow="autoplay; fullscreen" allowFullScreen />
            </div>
            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <Link href={`/articulo/${activeVideo.articleSlug}`} className="back-btn-top back-btn-solid" onClick={() => setActiveVideo(null)}>
                Ver artículo completo →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
