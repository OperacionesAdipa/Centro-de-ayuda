import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const SUPPORTED_LANGUAGES = ['en']

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&nbsp;/g, ' ')
}

async function translateText(text: string, targetLang: string): Promise<string> {
  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'es',
        target: targetLang,
        format: 'html',
      }),
    }
  )
  const data = await res.json()
  const translated = data?.data?.translations?.[0]?.translatedText ?? text
  return translated
}

export async function POST(req: NextRequest) {
  try {
    const { article_id, lang } = await req.json()

    if (!SUPPORTED_LANGUAGES.includes(lang)) {
      return NextResponse.json({ error: 'Idioma no soportado' }, { status: 400 })
    }

    const { data: article, error } = await supabaseAdmin
      .from('articles')
      .select('id, title, body, translations_cache')
      .eq('id', article_id)
      .single()

    if (error || !article) {
      return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 })
    }

    const cache = article.translations_cache ?? {}
    if (cache[lang]) {
      return NextResponse.json({
        title: cache[lang].title,
        body: cache[lang].body,
        cached: true,
      })
    }

    const [translatedTitle, translatedBody] = await Promise.all([
      translateText(article.title, lang),
      translateText(article.body, lang),
    ])

    // Decodificar entidades solo en el título
    const cleanTitle = decodeHtmlEntities(translatedTitle)

    const newCache = {
      ...cache,
      [lang]: {
        title: cleanTitle,
        body: translatedBody,
        translated_at: new Date().toISOString(),
      }
    }

    await supabaseAdmin
      .from('articles')
      .update({ translations_cache: newCache })
      .eq('id', article_id)

    return NextResponse.json({
      title: cleanTitle,
      body: translatedBody,
      cached: false,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
