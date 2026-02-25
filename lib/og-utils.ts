import { readFileSync } from 'fs'
import { join } from 'path'

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

interface OgFont {
  data: ArrayBuffer
  name: string
  weight?: FontWeight
  style?: 'normal' | 'italic'
}

export const OG_SIZE = { width: 1200, height: 630 }

export const OG_COLORS = {
  background: '#FDF8F3',
  text: '#1C1917',
  textSecondary: '#78716C',
  surface: '#FFFFFF',
  divider: '#E7E5E4',
} as const

let fontsCache: OgFont[] | null = null

export function getOgFonts(): OgFont[] {
  if (fontsCache) return fontsCache

  const fontsDir = join(process.cwd(), 'assets', 'fonts')
  const dmSerif = readFileSync(join(fontsDir, 'DMSerifDisplay-Regular.woff2'))
  const geist = readFileSync(join(fontsDir, 'Geist-Regular.woff2'))

  fontsCache = [
    { name: 'DM Serif Display', data: dmSerif.buffer as ArrayBuffer, weight: 400, style: 'normal' as const },
    { name: 'Geist', data: geist.buffer as ArrayBuffer, weight: 400, style: 'normal' as const },
  ]
  return fontsCache
}

/** Returns the static og-image.png as a Response */
export function staticOgFallback(): Response {
  const imageBuffer = readFileSync(join(process.cwd(), 'public', 'og-image.png'))
  return new Response(imageBuffer, {
    headers: { 'Content-Type': 'image/png' },
  })
}

export async function fetchAvatarAsDataUri(
  url: string
): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const resp = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!resp.ok) return null
    const buffer = await resp.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = resp.headers.get('content-type') || 'image/jpeg'
    return `data:${contentType};base64,${base64}`
  } catch {
    return null
  }
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + '\u2026' : str
}
