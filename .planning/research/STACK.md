# Stack Research

**Domain:** Dynamic OG image generation — Next.js 16 App Router on Vercel serverless
**Researched:** 2026-02-25
**Confidence:** HIGH (primary findings from official Next.js docs + confirmed GitHub issues)

## Context: What Was Failing

The existing implementation uses `readFileSync` + module-level cache on `public/fonts/*.woff2`. Two root causes compound each other:

1. **woff2 is not a supported font format.** Satori (the engine behind `ImageResponse`) supports only `ttf`, `otf`, and `woff`. Loading a woff2 file throws `"Unsupported OpenType signature wOF2"` at runtime. This alone causes silent fallback to the static OG image. Source: [Next.js issue #63935](https://github.com/vercel/next.js/issues/63935), confirmed by Next.js ImageResponse docs.

2. **Vercel file tracing does not automatically include `public/fonts/`** for opengraph-image routes. The `public/` directory is NOT copied into the serverless function bundle on Vercel. Using `readFileSync(join(process.cwd(), 'public/fonts/...'))` throws `ENOENT` in production. Source: [Next.js discussion #64683](https://github.com/vercel/next.js/discussions/64683), [Vercel KB: using files in serverless functions](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions).

---

## Recommended Stack (New Capabilities Only)

No new npm packages are needed. The fix is configuration + font format conversion.

### Core Technologies (Existing — No Changes)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| `next/og` (ImageResponse) | Bundled with Next.js 16.1.6 | OG image rendering via Satori | Keep — correct choice |
| `opengraph-image.tsx` convention | Next.js 16 App Router | Auto-injects `og:image` meta tags | Keep — correct choice |

### Configuration Additions Required

| Addition | Where | Purpose |
|----------|-------|---------|
| `outputFileTracingIncludes` | `next.config.ts` | Tells Vercel to include font files in serverless bundle |
| Font format conversion woff2 → ttf | `assets/` directory | Satori only supports ttf, otf, woff |

---

## Required Changes

### 1. Font Files: Convert woff2 to ttf, Move to `assets/`

The Next.js documentation example places fonts in `assets/` (project root), not `public/`. This is the pattern that works with `outputFileTracingIncludes`.

```
assets/
  DMSerifDisplay-Regular.ttf
  Geist-Regular.ttf
```

**Why `assets/` not `public/fonts/`:**
- `public/` is for static files served to browsers, not for serverless function file access
- Vercel file tracing picks up files in custom directories more reliably when explicitly included
- The official Next.js documentation example uses `assets/Inter-SemiBold.ttf`, not `public/`

**Font sources:**
- DM Serif Display TTF: [Google Fonts](https://fonts.google.com/specimen/DM+Serif+Display) — download "Static" zip, use `DMSerifDisplay-Regular.ttf`
- Geist TTF: [Vercel GitHub releases](https://github.com/vercel/geist-font/releases) — download font package, use `Geist-Regular.ttf`

### 2. `next.config.ts`: Add `outputFileTracingIncludes`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/card/[slug]/opengraph-image': ['./assets/**/*'],
    '/watch/[token]/opengraph-image': ['./assets/**/*'],
  },
  async redirects() {
    return [
      {
        source: '/app',
        destination: 'https://apps.apple.com/us/app/toy-group-video-cards/id6758913044',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
```

**Why this is required:** Vercel's `@vercel/nft` static analysis traces `import`/`require`/`fs` usage at build time to determine which files to bundle. Dynamic `readFile` paths using `process.cwd()` are not statically analyzable, so the font files are excluded from the bundle without this explicit inclusion. Source: [Next.js output docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

**Note on `experimental:`** — In Next.js 14+, `outputFileTracingIncludes` is a stable top-level config option, not under `experimental`. Do not wrap it in `experimental: {}`.

### 3. `lib/og-utils.ts`: Use Async `readFile`, Remove Module-Level Cache

Replace the current synchronous `readFileSync` + module-level `fontsCache` pattern with async `readFile` per request:

```typescript
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

interface OgFont {
  data: ArrayBuffer
  name: string
  weight?: FontWeight
  style?: 'normal' | 'italic'
}

export async function getOgFonts(): Promise<OgFont[]> {
  const assetsDir = join(process.cwd(), 'assets')
  const [dmSerif, geist] = await Promise.all([
    readFile(join(assetsDir, 'DMSerifDisplay-Regular.ttf')),
    readFile(join(assetsDir, 'Geist-Regular.ttf')),
  ])
  return [
    { name: 'DM Serif Display', data: dmSerif.buffer as ArrayBuffer, weight: 400, style: 'normal' },
    { name: 'Geist', data: geist.buffer as ArrayBuffer, weight: 400, style: 'normal' },
  ]
}
```

**Why remove the module-level cache:** Serverless functions are stateless between invocations. Module-level state is unreliable — it may persist within a warm instance but cannot be counted on. More importantly, the `readFileSync` at module initialization can fail before the try/catch in the image handler catches it, preventing the fallback from working. Per-request async reads are the documented pattern.

**Why `node:fs/promises` not `fs`:** Async `readFile` is the pattern shown in Next.js official documentation (PR #75274, merged January 2025). It avoids blocking the event loop and aligns with what the file tracer expects.

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@vercel/og` npm package | Already bundled inside `next/og` — adding it separately causes version conflicts | `import { ImageResponse } from 'next/og'` |
| `sharp` | Not needed for OG image generation; adds ~30MB to bundle | Nothing — ImageResponse uses Resvg internally |
| Edge runtime (`export const runtime = 'edge'`) | Edge has no filesystem access, making local font loading impossible. Font fetching from Google Fonts adds latency and an external dependency | Node.js runtime (default) with `readFile` |
| woff2 font files | Satori throws "Unsupported OpenType signature wOF2" — not supported | ttf or otf |
| Module-level font caching (`let fontsCache`) | Unreliable in serverless; blocks error recovery via try/catch | Per-request async `readFile` in the image function |
| `fetch()` + Google Fonts for font loading | Adds network latency to every OG image render; Google Fonts API can be unavailable; harder to subset correctly | Local ttf files in `assets/` |
| `import.meta.url` font loading pattern | Works in edge runtime only; not needed for Node.js runtime opengraph-image routes | `process.cwd()` + `readFile` |

---

## Stack Patterns by Variant

**If both opengraph-image routes use the same fonts (current case):**
- Shared `getOgFonts()` async function in `lib/og-utils.ts`
- Called with `await` inside each image function
- `outputFileTracingIncludes` covers both routes

**If font weight variants are needed in future (e.g., DM Serif Display Italic):**
- Download additional ttf variant to `assets/`
- Add to `getOgFonts()` return array with matching `weight`/`style`
- No config change needed (glob pattern `./assets/**/*` covers all)

---

## Version Compatibility

| Package | Version | Compatibility Notes |
|---------|---------|---------------------|
| next | 16.1.6 | `outputFileTracingIncludes` stable (not experimental) since Next.js 14 |
| `next/og` ImageResponse | bundled | Supports ttf, otf, woff only — NOT woff2 |
| Satori (internal) | bundled with next | 500KB total bundle limit per route |
| `node:fs/promises` | Node.js built-in | Available in Node.js runtime; NOT available in edge runtime |

---

## Sources

- [Next.js ImageResponse API Reference](https://nextjs.org/docs/app/api-reference/functions/image-response) — Font format support (ttf/otf/woff only), 500KB limit. HIGH confidence.
- [Next.js opengraph-image file convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) — Official `readFile` + `assets/` pattern, Node.js runtime default. HIGH confidence.
- [Next.js output/outputFileTracingIncludes docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) — Configuration pattern, no `output: standalone` required for Vercel. HIGH confidence.
- [GitHub issue #63935: "Unsupported OpenType signature wOF2"](https://github.com/vercel/next.js/issues/63935) — Confirmed woff2 not supported, closed as "not planned". HIGH confidence.
- [GitHub discussion #64683: opengraph-image only working locally](https://github.com/vercel/next.js/discussions/64683) — Confirmed `public/` not included in serverless bundle. MEDIUM confidence (community-sourced).
- [Vercel KB: Using files in Vercel Functions](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions) — `outputFileTracingIncludes` recommended approach. HIGH confidence.
- [Next.js PR #75274: docs: opengraph-image files work with Node.js runtime](https://github.com/vercel/next.js/pull/75274) — Merged January 2025, confirms Node.js runtime + `readFile` as canonical approach. HIGH confidence.

---
*Stack research for: Dynamic OG image generation — Next.js 16 + Vercel*
*Researched: 2026-02-25*
