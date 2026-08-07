import { NextRequest, NextResponse } from 'next/server'

async function translateTexts(texts: string[], targetLang: string): Promise<string[]> {
  if (!texts.length) return []

  const res = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts,
        source: 'es',
        target: targetLang,
        format: 'html',
      }),
    }
  )
  const data = await res.json()
  return data?.data?.translations?.map((t: any) => t.translatedText) ?? texts
}

export async function POST(req: NextRequest) {
  try {
    const { texts, lang } = await req.json()

    if (lang === 'es' || !texts?.length) {
      return NextResponse.json({ translations: texts })
    }

    const translations = await translateTexts(texts, lang)
    return NextResponse.json({ translations })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
