import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const browserlessKey = process.env.BROWSERLESS_API_KEY
    if (!browserlessKey) return NextResponse.json({ error: 'No hay API key de Browserless' })

    const res = await fetch(`https://chrome.browserless.io/function?token=${browserlessKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `
          module.exports = async ({ page }) => {
            await page.setViewport({ width: 1280, height: 720 });
            await page.goto('https://player.vimeo.com/video/1093834589', {
              waitUntil: 'networkidle2',
              timeout: 30000
            });
            await page.waitForTimeout(3000);
            const title = await page.title();
            const videos = await page.evaluate(() => document.querySelectorAll('video').length);
            const screenshot = await page.screenshot({ type: 'jpeg', quality: 85, encoding: 'base64' });
            return { title, videos, screenshotLength: screenshot.length };
          };
        `,
      }),
    })

    const data = await res.json()
    return NextResponse.json({ ok: res.ok, status: res.status, data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message })
  }
}

