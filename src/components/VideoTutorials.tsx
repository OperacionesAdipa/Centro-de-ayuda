'use client'

import { useState } from 'react'
import { useCountry } from '@/lib/useCountry'
import { ZArticle, slugify, extractTagsFromBody } from '@/lib/zendesk'
import Link from 'next/link'

interface VideoItem {
  title: string
  articleSlug: string
  embedUrl: string
  thumbnail: string
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
          thumbnail: '',
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={prev}
              disabled={current === 0}
              className="carousel-btn"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              onClick={next}
              disabled={current >= maxIndex}
              className="carousel-btn"
              aria-label="Siguiente"
            >
              ›
            </button>
          </div>
        </div>

        <div className="video-carousel">
