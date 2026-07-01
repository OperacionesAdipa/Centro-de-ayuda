import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL || ''
const ZENDESK_TOKEN = process.env.ZENDESK_API_TOKEN || ''

function zHeaders() {
  const creds = Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_TOKEN}`).toString('base64')
  return { Authorization: `Basic ${creds}` }
}

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'migrate-images-2026') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { data: articles, error } = await supabaseAdmin
      .from('articles')
      .select('id, body')

    if (error) throw error

    let totalImages = 0
    let migratedImages = 0
    let updatedArticles = 0
    const errors: string[] = []

    for (const article of articles ?? []) {
      if (!article.body) continue

      const imageRegex = /https:\/\/adipa\.zendesk\.com\/hc\/article_attachments\/(\d+)/g
      const matches = [...article.body.matchAll(imageRegex)]

      if (matches.length === 0) continue

      let newBody = article.body
      let articleUpdated = false

      for (const match of matches) {
        const imageId = match[1]
        const zendeskUrl = `https://adipa.zendesk.com/hc/article_attachments/${imageId}`
        totalImages++

        try {
          const { data: existing } = await supabaseAdmin.storage
            .from('article-images')
            .list('', { search: imageId })

          if (existing && existing.length > 0) {
            const existingFile = existing.find(f => f.name.startsWith(imageId))
            if (existingFile) {
              const { data: urlData } = supabaseAdmin.storage
                .from('article-images')
                .getPublicUrl(existingFile.name)
              newBody = newBody.replace(new RegExp(zendeskUrl.replace(/\//g, '\\/'), 'g'), urlData.publicUrl)
              migratedImages++
              continue
            }
          }

          const imgRes = await fetch(zendeskUrl, { headers: zHeaders() })
          if (!imgRes.ok) {
            errors.push(`Error descargando ${imageId}: ${imgRes.status}`)
            continue
          }

          const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'
          const ext = contentType.includes('png') ? 'png' : contentType.includes('gif') ? 'gif' : contentType.includes('webp') ? 'webp' : 'jpg'
          const fileName = `${imageId}.${ext}`
          const buffer = await imgRes.arrayBuffer()

          const { error: uploadError } = await supabaseAdmin.storage
            .from('article-images')
            .upload(fileName, buffer, { contentType, upsert: true })

          if (uploadError) {
            errors.push(`Error subiendo ${imageId}: ${uploadError.message}`)
            continue
          }

          const { data: urlData } = supabaseAdmin.storage
            .from('article-images')
            .getPublicUrl(fileName)

          newBody = newBody.replace(new RegExp(zendeskUrl.replace(/\//g, '\\/'), 'g'), urlData.publicUrl)
          migratedImages++
          articleUpdated = true

        } catch (e: any) {
          errors.push(`Error procesando ${imageId}: ${e.message}`)
        }
      }

      if (articleUpdated || newBody !== article.body) {
        await supabaseAdmin
          .from('articles')
          .update({ body: newBody })
          .eq('id', article.id)
        updatedArticles++
      }
    }

    return NextResponse.json({
      success: true,
      results: { totalImages, migratedImages, updatedArticles, errors: errors.slice(0, 20) }
    })

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
