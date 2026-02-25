import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

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

export async function getOgFonts(): Promise<OgFont[]> {
  const fontsDir = join(process.cwd(), 'public', 'fonts')
  const [dmSerif, geist] = await Promise.all([
    readFile(join(fontsDir, 'DMSerifDisplay-Regular.ttf')),
    readFile(join(fontsDir, 'Geist-Regular.ttf')),
  ])

  return [
    { name: 'DM Serif Display', data: dmSerif as unknown as ArrayBuffer, weight: 400, style: 'normal' as const },
    { name: 'Geist', data: geist as unknown as ArrayBuffer, weight: 400, style: 'normal' as const },
  ]
}

/** Returns the static og-image.png as a Response */
export async function staticOgFallback(): Promise<Response> {
  const imageBuffer = await readFile(join(process.cwd(), 'public', 'og-image.png'))
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
