'use client'

import { useState } from 'react'
import { useCountry } from '@/lib/useCountry'
import { slugify, filterArticlesByCountry } from '@/lib/supabaseQueries'
import Link from 'next/link'

interface VideoItem {
  title: string
  articleSlug: string
  embedUrl: string
}

function extractVideos(articles: any[], country: string): VideoItem[] {
  const items: VideoItem[] = []
  const filtered = filterArticlesByCountry(articles, country)

  for (const art of filtered) {
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

export function VideoTutorialsGrid({ articles }: { articles: any[] }) {
  const { country } = useCountry()
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null)
  const videos = extractVideos(articles, country)

  if (videos.length === 0) {
    return (
      <p style={{ fontSize: 14, color: '#aaa', padding: '20px 0' }}>
        No hay videotutoriales disponibles para tu país aún.
      </p>
    )
  }

  return (
    <>
      <div className="video-carousel" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {videos.map((v, i) => (
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
