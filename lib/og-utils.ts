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

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`
    const css = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }).then((r) => r.text())

    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('woff2'\)/)
    if (!match?.[1]) return null

    return await fetch(match[1]).then((r) => r.arrayBuffer())
  } catch {
    return null
  }
}

// Lazy-loaded, retries on failure (not cached as rejected promise)
let fontsCache: OgFont[] | null = null

export async function getOgFonts(): Promise<OgFont[]> {
  if (fontsCache) return fontsCache

  try {
    const [dmSerif, geist] = await Promise.all([
      loadGoogleFont('DM Serif Display', 400),
      loadGoogleFont('Geist', 400),
    ])

    const fonts: OgFont[] = []
    if (dmSerif) fonts.push({ name: 'DM Serif Display', data: dmSerif, weight: 400, style: 'normal' as const })
    if (geist) fonts.push({ name: 'Geist', data: geist, weight: 400, style: 'normal' as const })

    if (fonts.length > 0) fontsCache = fonts
    return fonts
  } catch {
    return []
  }
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
