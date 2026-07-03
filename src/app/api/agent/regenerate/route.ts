import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const maxDuration = 300

async function takeTargetedScreenshot(url: string, targetText: string): Promise<string | null> {
  try {
    const browserlessKey = process.env.BROWSERLESS_API_KEY
    if (!browserlessKey) return null

    const res = await fetch(`https://chrome.browserless.io/function?token=${browserlessKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `
          module.exports = async ({ page }) => {
            await page.goto('${url}', { waitUntil: 'networkidle2', timeout: 30000 });
            await page.setViewport({ width: 1280, height: 800 });
            const targetText = ${JSON.stringify(targetText)};
            const element = await page.evaluateHandle((text) => {
              const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
              let node;
              while (node = walker.nextNode()) {
                if (node.textContent.toLowerCase().includes(text.toLowerCase())) {
                  return node.parentElement;
                }
              }
              return null;
            }, targetText);
            if (element && element.asElement()) {
              await element.asElement().evaluate((el) => {
                el.style.outline = '3px solid #704EFD';
                el.style.outlineOffset = '4px';
                el.style.backgroundColor = 'rgba(112, 78, 253, 0.08)';
                el.style.borderRadius = '4px';
                el.scrollIntoView({ behavior: 'instant', block: 'center' });
              });
              await page.waitForTimeout(500);
              const box = await element.asElement().boundingBox();
              if (box) {
                const padding = 80;
                const clip = {
                  x: Math.max(0, box.x - padding),
                  y: Math.max(0, box.y - padding),
                  width: Math.min(1280, box.width + padding * 2),
                  height: Math.min(600, box.height + padding * 2),
                };
                return await page.screenshot({ type: 'jpeg', quality: 85, clip });
              }
            }
            return await page.screenshot({ type: 'jpeg', quality: 85, clip: { x: 0, y: 0, width: 1280, height: 600 } });
          };
        `,
      }),
    })

    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const fileName = `screenshot-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    const { error } = await supabaseAdmin.storage.from('article-images').upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true })
    if (error) return null
    const { data } = supabaseAdmin.storage.from('article-images').getPublicUrl(fileName)
    return data.publicUrl
  } catch {
    return null
  }
}

async function getVimeoTranscript(vimeoId: string): Promise<{ entries: { time: number; text: string }[]; raw: string }> {
  try {
    const res = await fetch(`https://api.vimeo.com/videos/${vimeoId}/texttracks`, {
      headers: {
        Authorization: `Bearer ${process.env.VIMEO_TOKEN}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    })
    if (!res.ok) return { entries: [], raw: '' }
    const data = await res.json()
    const track = data.data?.[0]
    if (!track?.link) return { entries: [], raw: '' }
    const trackRes = await fetch(track.link)
    if (!trackRes.ok) return { entries: [], raw: '' }
    const vtt = await trackRes.text()

    const lines = vtt.split('\n')
    const entries: { time: number; text: string }[] = []
    let i = 0
    while (i < lines.length) {
      const line = lines[i].trim()
      if (line.includes('-->')) {
        const startTime = line.split('-->')[0].trim()
        const parts = startTime.split(':')
        let time = 0
        if (parts.length === 3) {
          time = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2])
        } else {
          time = parseInt(parts[0]) * 60 + parseFloat(parts[1])
        }
        const textLines: string[] = []
        i++
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i].trim())
          i++
        }
        const text = textLines.join(' ').replace(/<[^>]*>/g, '')
        if (text) entries.push({ time, text })
      }
      i++
    }
    return { entries, raw: entries.map(e => `[${Math.floor(e.time)}s] ${e.text}`).join('\n') }
  } catch {
    return { entries: [], raw: '' }
  }
}

async function getVimeoThumbnailAtTime(vimeoId: string, timestamp: number): Promise<string | null> {
  try {
    const res = await fetch(`https://api.vimeo.com/videos/${vimeoId}/pictures`, {
      headers: {
        Authorization: `Bearer ${process.env.VIMEO_TOKEN}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    const picture = data.data?.[0]
    if (!picture) return null
    const sizes = picture.sizes ?? []
    const large = sizes.find((s: any) => s.width >= 1280) ?? sizes[sizes.length - 1]
    return large?.link ?? null
  } catch {
    return null
  }
}

async function getNavigationPath(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url)
    const origin = urlObj.origin
    const homeRes = await fetch(origin, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ADIPA-Bot/1.0)' } })
    if (!homeRes.ok) return null
    const homeHtml = await homeRes.text()
    const navHtml = homeHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').slice(0, 5000)
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{ role: 'user', content: `Analiza la navegación de este sitio y determina cómo llegar a: ${url}\n\nHTML: ${navHtml}\n\nResponde ÚNICAMENTE con los pasos, ejemplo: "Haz clic en 'Recursos', luego 'Glosario'". Si no puedes determinarlo, responde: "none"` }],
      }),
    })
    const claudeData = await claudeRes.json()
    const navPath = claudeData.content?.[0]?.text?.trim()
    return navPath === 'none' ? null : navPath
  } catch {
    return null
  }
}

function cleanHtml(text: string): string {
  return text.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
}

function getAdipaUrlForCountry(url: string, countryLabel: string): string {
  const countryDomains: Record<string, string> = { pais_chile: 'adipa.cl', pais_mexico: 'adipa.mx', pais_colombia: 'adipa.co', pais_argentina: 'adipa.ar' }
  const domain = countryDomains[countryLabel]
  if (!domain) return url
  return url.replace('adipa.cl', domain).replace('adipa.mx', domain).replace('adipa.co', domain).replace('adipa.ar', domain)
}

export async function POST(req: NextRequest) {
  try {
    const { url_id } = await req.json()
    if (!url_id) return NextResponse.json({ error: 'Falta url_id' }, { status: 400 })

    const { data: urlData, error: urlError } = await supabaseAdmin.from('source_urls').select('*').eq('id', url_id).single()
    if (urlError || !urlData) return NextResponse.json({ error: 'URL no encontrada' }, { status: 404 })

    const pageRes = await fetch(urlData.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ADIPA-Bot/1.0)' } })
    if (!pageRes.ok) return NextResponse.json({ error: `No se pudo leer la URL: ${pageRes.status}` }, { status: 400 })

    const html = await pageRes.text()
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    const links: { text: string; href: string }[] = []
    let linkMatch
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const href = linkMatch[1]
      const text = linkMatch[2].replace(/<[^>]+>/g, '').trim()
      if (text && href && !href.startsWith('#') && !href.startsWith('javascript') && !href.includes('zendesk.com')) {
        const fullHref = href.startsWith('http') ? href : `${new URL(urlData.url).origin}${href}`
        links.push({ text, href: fullHref })
      }
    }

    const cleanText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000)

    const filteredLinks = links.filter(l => !l.href.includes('zendesk.com')).slice(0, 30)
    const linksText = filteredLinks.map(l => `- "${l.text}" → ${l.href}`).join('\n')
    const navigationPath = await getNavigationPath(urlData.url)

    const { data: articleUrlData } = await supabaseAdmin.from('article_source_urls').select('article_id').eq('source_url_id', url_id)
    const articleIds = (articleUrlData ?? []).map((r: any) => r.article_id)
    if (articleIds.length === 0) return NextResponse.json({ error: 'No hay artículos asociados a esta URL' }, { status: 400 })

    const { data: articles } = await supabaseAdmin.from('articles').select('*').in('id', articleIds)
    const allArticleTitles = (articles ?? []).map((a: any) => a.title)
    const results = []

    for (const article of articles ?? []) {
      const otherArticleTitles = allArticleTitles.filter((t: string) => t !== article.title)
      const countryLabel = (article.label_names ?? []).find((l: string) => l.startsWith('pais_')) ?? 'pais_chile'
      const localizedUrl = getAdipaUrlForCountry(urlData.url, countryLabel)

      const { data: linkedVideos } = await supabaseAdmin
        .from('article_vimeo_videos')
        .select('vimeo_video_id, vimeo_videos(id, vimeo_id, title, transcript)')
        .eq('article_id', article.id)

      const hasVideo = linkedVideos && linkedVideos.length > 0
      let transcriptText = ''
      let vimeoId = ''
      let videoTitle = ''

      if (hasVideo) {
        const videoData = (linkedVideos[0] as any).vimeo_videos
        vimeoId = videoData?.vimeo_id ?? ''
        videoTitle = videoData?.title ?? ''

        if (videoData?.transcript) {
          const lines = videoData.transcript.split('\n')
          const entries: { time: number; text: string }[] = []
          let i = 0
          while (i < lines.length) {
            const line = lines[i].trim()
            if (line.includes('-->')) {
              const startTime = line.split('-->')[0].trim()
              const parts = startTime.split(':')
              let time = 0
              if (parts.length === 3) time = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2])
              else time = parseInt(parts[0]) * 60 + parseFloat(parts[1])
              const textLines: string[] = []
              i++
              while (i < lines.length && lines[i].trim() !== '') { textLines.push(lines[i].trim()); i++ }
              const text = textLines.join(' ').replace(/<[^>]*>/g, '')
              if (text) entries.push({ time, text })
            }
            i++
          }
          transcriptText = entries.map(e => `[${Math.floor(e.time)}s] ${e.text}`).join('\n')
        } else {
          const transcript = await getVimeoTranscript(vimeoId)
          transcriptText = transcript.raw
        }
      }

      const analysisRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: `Analiza si el artículo "${article.title}" requiere imágenes para ser explicado correctamente.

Contenido de referencia:
${cleanText.slice(0, 2000)}

${transcriptText ? `Transcripción del video:\n${transcriptText.slice(0, 1000)}` : ''}

Responde en JSON:
{
  "needsImages": true o false,
  "needsScreenshot": true o false,
  "targetText": "texto clave en la página para screenshot, o null",
  "videoTimestamps": [{"time": segundos, "description": "qué se muestra"}] o []
}

needsImages: true si el artículo explica un proceso visual con pasos.
needsScreenshot: true solo si NO hay video y se necesita imagen de la URL.
videoTimestamps: solo si hay video, lista de momentos clave para screenshots.

Responde ÚNICAMENTE con JSON.`,
          }],
        }),
      })

      const analysisData = await analysisRes.json()
      let needsImages = false
      let needsScreenshot = false
      let targetText = null
      let videoTimestamps: { time: number; description: string }[] = []

      try {
        const analysis = JSON.parse(analysisData.content?.[0]?.text ?? '{}')
        needsImages = analysis.needsImages ?? false
        needsScreenshot = analysis.needsScreenshot ?? false
        targetText = analysis.targetText ?? null
        videoTimestamps = analysis.videoTimestamps ?? []
      } catch {}

      const screenshots: { description: string; url: string }[] = []

      if (hasVideo && vimeoId && videoTimestamps.length > 0) {
        for (const ts of videoTimestamps.slice(0, 5)) {
          const thumbnail = await getVimeoThumbnailAtTime(vimeoId, ts.time)
          if (thumbnail) {
            screenshots.push({ description: ts.description, url: thumbnail })
          }
        }
      } else if (!hasVideo && needsScreenshot && targetText) {
        const screenshot = await takeTargetedScreenshot(urlData.url, targetText)
        if (screenshot) {
          screenshots.push({ description: targetText, url: screenshot })
        }
      }

      const screenshotsText = screenshots.length > 0
        ? `IMÁGENES DISPONIBLES (úsalas en los pasos correspondientes):
${screenshots.map((s, i) => `- Paso relacionado con "${s.description}": <img src="${s.url}" alt="${s.description}" style="max-width:100%; border-radius:8px; margin:12px 0; border: 1px solid #e5e7eb;">`).join('\n')}`
        : ''

      const needsImagesPending = needsImages && !hasVideo && screenshots.length === 0

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: `Eres un redactor experto de artículos de centro de ayuda para ADIPA, una plataforma de educación online en Latinoamérica.

Tu tarea es actualizar el siguiente artículo respondiendo ÚNICAMENTE la pregunta del título.

ARTÍCULO A ACTUALIZAR:
Título: ${article.title}
Contenido actual:
${article.body?.replace(/<[^>]*>/g, ' ').slice(0, 1500)}

OTROS ARTÍCULOS RELACIONADOS (NO incluyas información de estos temas):
${otherArticleTitles.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}

CONTENIDO DE LA PÁGINA DE REFERENCIA:
${cleanText}

URL DE REFERENCIA PARA ESTE PAÍS: ${localizedUrl}

${navigationPath ? `CÓMO LLEGAR A ESTA PÁGINA:\n${navigationPath}\nIncluye estos pasos si es relevante.` : ''}

${transcriptText ? `TRANSCRIPCIÓN DEL VIDEO TUTORIAL "${videoTitle}":\n${transcriptText.slice(0, 4000)}` : ''}

LINKS DISPONIBLES:
${linksText}

${screenshotsText}

INSTRUCCIONES:
- Responde únicamente la pregunta: "${article.title}"
- NO incluyas información de los otros artículos listados
- Escribe en español latinoamericano, tono amigable y claro
- Usa <ol> para pasos numerados, <p> para párrafos, <strong> para énfasis
- ${screenshots.length > 0 ? 'Incluye cada imagen inmediatamente después del paso que ilustra' : needsImagesPending ? 'Indica con [IMAGEN PENDIENTE: descripción] donde debería ir una imagen' : 'No incluyas imágenes'}
- Cuando hagas referencia al sitio usa: ${localizedUrl}
- Incluye hipervínculos con <a href="URL">texto</a> cuando corresponda
- NUNCA incluyas links de zendesk.com
- NUNCA incluyas ejemplos con fechas, nombres de eventos específicos o información que pueda expirar
- NO incluyas el título en el HTML
- Responde ÚNICAMENTE con HTML puro, sin markdown, sin \`\`\``,
          }],
        }),
      })

      const claudeData = await claudeRes.json()
      const rawBody = claudeData.content?.[0]?.text ?? article.body
      const newBody = cleanHtml(rawBody)

      await supabaseAdmin
        .from('articles')
        .update({
          body: newBody,
          status: 'pending_review',
          needs_images: needsImagesPending,
          updated_at: new Date().toISOString(),
        })
        .eq('id', article.id)

      results.push({ id: article.id, title: article.title, hasVideo, screenshotsCount: screenshots.length, needsImages: needsImagesPending })
    }

    await supabaseAdmin.from('source_urls').update({ last_fetched_at: new Date().toISOString() }).eq('id', url_id)

    return NextResponse.json({ ok: true, updated: results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
