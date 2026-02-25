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

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`
  const css = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  }).then((r) => r.text())

  const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('woff2'\)/)
  if (!match?.[1]) throw new Error(`Failed to load font: ${family}`)

  return fetch(match[1]).then((r) => r.arrayBuffer())
}

// Module-level promises — cached across requests in the same worker
const dmSerifFont = loadGoogleFont('DM Serif Display', 400)
const geistFont = loadGoogleFont('Geist', 400)

export async function getOgFonts(): Promise<OgFont[]> {
  const [dmSerif, geist] = await Promise.all([dmSerifFont, geistFont])
  return [
    { name: 'DM Serif Display', data: dmSerif, weight: 400, style: 'normal' as const },
    { name: 'Geist', data: geist, weight: 400, style: 'normal' as const },
  ]
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
