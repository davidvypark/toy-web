# Phase 1: Fix and Deploy - Research

**Researched:** 2026-02-25
**Domain:** Next.js OG image generation with custom fonts on Vercel serverless
**Confidence:** HIGH

## Summary

The two OG image routes (`/card/[slug]/opengraph-image` and `/watch/[token]/opengraph-image`) fail on Vercel due to three compounding bugs, all already present in the codebase. The root causes are confirmed and the fixes are surgical.

**Bug 1 — Wrong font format:** `public/fonts/` contains WOFF2 files. Satori (the renderer behind `next/og` ImageResponse) does not support WOFF2. Only TTF, OTF, and WOFF are accepted. This causes a silent failure where fonts fall back to the system sans-serif or throw a parse error.

**Bug 2 — Synchronous file read:** `og-utils.ts` uses `readFileSync` from `fs` (not `node:fs/promises`). The official Next.js docs (v16.1.6) show `readFile` from `node:fs/promises` as the correct pattern for OG image font loading. While `readFileSync` can work with `process.cwd()`, the async `readFile` pattern is what Next.js's file tracer (`@vercel/nft`) reliably picks up, and it is the documented approach.

**Bug 3 — Missing `outputFileTracingIncludes`:** Vercel's serverless functions are bundled — the `public/` directory does not exist in the function bundle at runtime. The file tracer must be told explicitly to include font files. Without `outputFileTracingIncludes` in `next.config.ts`, font files are not deployed alongside the OG image function, causing ENOENT at runtime.

**Primary recommendation:** Replace WOFF2 font files with TTF, switch `og-utils.ts` to async `readFile` from `node:fs/promises`, and add `outputFileTracingIncludes` to `next.config.ts` targeting the two OG image routes. No new dependencies needed.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OG-01 | `/card/[slug]` route generates a personalized OG image with host info on Vercel | Bug 1+2+3 fixes enable this route to work on Vercel; design already implemented |
| OG-02 | `/watch/[token]` route generates a personalized OG image with contributor avatars on Vercel | Same bug 1+2+3 fixes; design already implemented |
| OG-03 | OG images use branded fonts (DM Serif Display, Geist Sans) loaded as TTF | Directly addresses bug 1: replace WOFF2 with TTF |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/og` (ImageResponse) | Next.js 16.1.6 (built-in) | Render JSX to PNG via Satori | Officially blessed by Next.js; zero extra deps |
| `node:fs/promises` (readFile) | Node.js built-in | Async font file loading | Documented pattern in Next.js 16 official docs; compatible with file tracer |
| `node:path` (join) | Node.js built-in | Resolve `process.cwd()` paths | Standard cross-platform path resolution |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TTF font files (DM Serif Display, Geist Sans) | Latest from Google Fonts / vercel/geist-font releases | Satori-compatible font data | Required — Satori does not support WOFF2 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local TTF files via `readFile` | Fetch font from Google Fonts API at runtime | Fetching at runtime adds latency and external dependency; local files are faster and reliable |
| Local TTF files via `readFile` | Embed font as base64 string in source code | 300KB+ base64 blob pollutes source; local file is cleaner |
| `outputFileTracingIncludes` | Move fonts into the Next.js `assets/` or `app/` directory (auto-traced) | Documented Next.js example uses `assets/` or `public/` + `outputFileTracingIncludes`; either works, keeping fonts in `public/fonts/` is least-disruptive |

**Installation:**

No new npm packages needed. Font files must be sourced:
- **DM Serif Display Regular TTF**: Download from [Google Fonts](https://fonts.google.com/specimen/DM+Serif+Display) — click "Download family" → extract `DMSerifDisplay-Regular.ttf`
- **Geist Sans Regular TTF**: Download from [vercel/geist-font releases](https://github.com/vercel/geist-font/releases) — TTF files available since v0.2.1, current latest is v1.7.0

## Architecture Patterns

### Recommended Project Structure

```
public/
└── fonts/
    ├── DMSerifDisplay-Regular.ttf    # Replace WOFF2
    └── Geist-Regular.ttf             # Replace WOFF2

lib/
└── og-utils.ts                       # Switch readFileSync → readFile (async)

next.config.ts                        # Add outputFileTracingIncludes
```

### Pattern 1: Async Font Loading for OG Images

**What:** Use `readFile` from `node:fs/promises` to load TTF font data in OG image route functions. The official Next.js 16 docs use exactly this pattern.

**When to use:** Any `opengraph-image.tsx` that needs custom fonts and uses Node.js runtime (default).

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/image-response
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export default async function Image() {
  const interSemiBold = await readFile(
    join(process.cwd(), 'assets/Inter-SemiBold.ttf')
  )

  return new ImageResponse(
    (<div>...</div>),
    {
      ...size,
      fonts: [
        {
          name: 'Inter',
          data: interSemiBold,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  )
}
```

### Pattern 2: outputFileTracingIncludes for Public Assets

**What:** Configure `next.config.ts` to force-include font files in the Vercel function bundle for specific routes. Without this, `public/fonts/` files are not present at runtime in Vercel serverless.

**When to use:** Any route that reads files from `public/` using `fs` APIs at runtime in a serverless deployment.

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/card/[slug]': ['./public/fonts/**/*'],
    '/watch/[token]': ['./public/fonts/**/*'],
  },
  // ... rest of config
};

export default nextConfig;
```

**Note on route key syntax:** The keys use the route path pattern (e.g., `/card/[slug]`), matched with picomatch. The values are glob patterns resolved from the project root.

### Pattern 3: Font Data as Buffer (ArrayBuffer)

**What:** `readFile` from `node:fs/promises` returns a `Buffer`. Pass it directly — Next.js/Satori accepts `Buffer` where `ArrayBuffer` is expected (Buffer is a subclass of Uint8Array and is accepted at runtime even though TypeScript types say ArrayBuffer).

**When to use:** Always — no conversion needed.

**Example:**
```typescript
// The current og-utils.ts does: readFileSync(...).buffer as ArrayBuffer
// The correct pattern (official docs) simply passes the Buffer directly:
const fontData = await readFile(join(process.cwd(), 'public/fonts/MyFont.ttf'))
// fontData is a Buffer — pass it directly to fonts[].data
{ name: 'MyFont', data: fontData, weight: 400, style: 'normal' }
```

### Pattern 4: No explicit `export const runtime = 'nodejs'` needed

**What:** `opengraph-image.tsx` files run on the Node.js runtime by default unless the co-located page explicitly uses edge runtime. The pages in this project have no `export const runtime` — they default to Node.js. No runtime export is needed in the OG files.

**When to use:** Only add `export const runtime = 'nodejs'` if the co-located page uses `export const runtime = 'edge'`.

### Anti-Patterns to Avoid

- **Using `readFileSync` in OG image routes:** The official Next.js docs now show `readFile` (async). Synchronous reads work locally but are harder for the static file tracer to pick up and are the old documented pattern pre-v14. Switch to async.
- **WOFF2 fonts with Satori:** Satori uses `opentype.js` under the hood which does not parse WOFF2. Passing WOFF2 data produces a silent rendering failure (no font applied) or a parse error. Only TTF, OTF, or WOFF work.
- **Relying on `public/` being present at serverless runtime without tracing config:** Vercel bundles only what the file tracer detects. `fs` calls in OG routes are inside a shared utility (`og-utils.ts`), which means the tracer may not detect the specific font file paths. Always use `outputFileTracingIncludes`.
- **Module-level font caching across requests on serverless:** The current `og-utils.ts` caches fonts in a module-level `let fontsCache` variable. On serverless, each invocation may spin up a fresh instance; the cache provides no benefit and slightly obscures the loading. It is harmless but should be removed or kept only as a local optimization with awareness it doesn't persist across cold starts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WOFF2 → TTF conversion in code | Runtime WOFF2 decoder | Download pre-converted TTF files | TTF is canonical source format; no runtime cost |
| Font caching layer | Complex caching system | Next.js route caching (`revalidate`) | Route-level caching already handles this |
| Custom image renderer | Canvas-based PNG generator | `ImageResponse` from `next/og` | ImageResponse is the standard; Satori is maintained by Vercel |

**Key insight:** The bugs are all configuration/format issues, not missing functionality. There is nothing to build — only things to fix and configure.

## Common Pitfalls

### Pitfall 1: WOFF2 Silent Failure
**What goes wrong:** Passing WOFF2 data to Satori produces an image with no custom fonts (falls back to default sans-serif) or throws an unhandled parse error. The error may not surface clearly in logs.
**Why it happens:** Satori's font parser (`opentype.js`) does not support the Brotli-compressed WOFF2 format. The error originates inside the font parsing library.
**How to avoid:** Use TTF or OTF. Verify font format by checking the file extension and confirming with `file` command: `file DMSerifDisplay-Regular.ttf` should output "TrueType Font data".
**Warning signs:** OG image renders with obviously different font (wrong serif/sans), or all text uses the same generic font regardless of `fontFamily` specification.

### Pitfall 2: ENOENT on Vercel for Public Fonts
**What goes wrong:** `readFile(join(process.cwd(), 'public/fonts/MyFont.ttf'))` throws `ENOENT: no such file or directory` on Vercel despite the file existing locally.
**Why it happens:** Vercel serverless functions are bundled. Only files detected by `@vercel/nft` static tracing are included in the bundle. When fonts are loaded via a shared utility function (`og-utils.ts`) indirectly, the tracer may not connect the font file to the OG route.
**How to avoid:** Add `outputFileTracingIncludes` in `next.config.ts` explicitly mapping the two OG routes to `./public/fonts/**/*`.
**Warning signs:** Works with `npm run dev`, works with `npm run build && npm start` locally, fails only on actual Vercel deployment.

### Pitfall 3: outputFileTracingIncludes Route Key Syntax
**What goes wrong:** Using wrong key format (e.g., `/app/card/[slug]` or `card/[slug]`) means the includes are not applied to the correct routes.
**Why it happens:** Keys are route-path patterns (the URL path, not filesystem path), matched with picomatch.
**How to avoid:** Use `/card/[slug]` and `/watch/[token]` — exactly the URL segment paths. Can also use `'/*'` as a wildcard to apply to all routes.
**Warning signs:** Build succeeds, fonts still ENOENT on Vercel.

### Pitfall 4: Buffer vs ArrayBuffer Type Confusion
**What goes wrong:** TypeScript error: "Argument of type 'Buffer' is not assignable to parameter of type 'ArrayBuffer'".
**Why it happens:** The `fonts[]` option types `data` as `ArrayBuffer`. Node.js `readFile` returns a `Buffer`, which is a `Uint8Array` subclass. Satori accepts it at runtime.
**How to avoid:** Either cast `data: fontData as unknown as ArrayBuffer` or use `fontData.buffer` (for non-pooled buffers). The cleanest approach is to pass `Buffer` directly with a cast since it works at runtime.
**Warning signs:** TypeScript compilation error during `npm run build`.

### Pitfall 5: Font Name Must Match fontFamily in JSX
**What goes wrong:** Fonts render as system default even after correct loading.
**Why it happens:** The `name` field in the `fonts[]` array must exactly match the `fontFamily` string used in inline styles. Case-sensitive.
**How to avoid:** The current code uses `name: 'DM Serif Display'` and `fontFamily: 'DM Serif Display'`, and `name: 'Geist'` with `fontFamily: 'Geist'`. Keep these consistent.
**Warning signs:** Font loads without error but text renders in system font.

## Code Examples

Verified patterns from official sources:

### Corrected og-utils.ts (async readFile + TTF)
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/image-response
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
  const fontsDir = join(process.cwd(), 'public', 'fonts')
  const [dmSerif, geist] = await Promise.all([
    readFile(join(fontsDir, 'DMSerifDisplay-Regular.ttf')),
    readFile(join(fontsDir, 'Geist-Regular.ttf')),
  ])

  return [
    { name: 'DM Serif Display', data: dmSerif as unknown as ArrayBuffer, weight: 400, style: 'normal' },
    { name: 'Geist', data: geist as unknown as ArrayBuffer, weight: 400, style: 'normal' },
  ]
}
```

### next.config.ts with outputFileTracingIncludes
```typescript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/card/[slug]': ['./public/fonts/**/*'],
    '/watch/[token]': ['./public/fonts/**/*'],
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

### Callers (opengraph-image.tsx) — change getOgFonts() call to await
```typescript
// Before (synchronous):
const fonts = getOgFonts()

// After (async, both files):
const fonts = await getOgFonts()
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `fs.readFileSync` for font loading | `readFile` from `node:fs/promises` | Next.js 14+ docs update | Official example uses async; aligns with file tracer expectations |
| WOFF2 font files | TTF font files for server-side Satori | Always — Satori never supported WOFF2 | WOFF2 was never correct for `next/og` |
| No `outputFileTracingIncludes` | Route-specific font file tracing config | Required for Vercel serverless | Fonts must be explicitly traced into function bundles |

**Deprecated/outdated:**
- `readFileSync` in OG routes: Works locally, unreliable on Vercel. Official docs moved to async pattern.
- WOFF2 in `next/og`: Never worked. Satori/opentype.js does not support WOFF2.

## Open Questions

1. **Does `outputFileTracingIncludes` need both route keys, or can `'/*'` be used?**
   - What we know: Both `/card/[slug]` and `/watch/[token]` need the fonts. `'/*'` works as a wildcard per official docs.
   - What's unclear: Whether using `'/*'` over-includes fonts for static routes (cost: minimal, fonts are ~300KB total).
   - Recommendation: Use specific keys (`/card/[slug]` and `/watch/[token]`) for precision. Fall back to `'/*'` if the specific-key approach fails.

2. **Font file acquisition — Geist Sans TTF availability**
   - What we know: Geist v0.2.1+ includes non-variable TTF files. Latest release is v1.7.0 (Feb 2025).
   - What's unclear: Whether the zip archive from GitHub releases contains `Geist-Regular.ttf` specifically (non-variable static cut).
   - Recommendation: Download from [vercel/geist-font releases](https://github.com/vercel/geist-font/releases). If TTF unavailable in release, use `npx` to extract from `geist` npm package: `node -e "require('fs').copyFileSync(require.resolve('geist/fonts/geist-sans/Geist-Regular.ttf'), 'Geist-Regular.ttf')"` — or simply download OTF (also supported by Satori).

3. **Module-level font cache in og-utils.ts**
   - What we know: The current `fontsCache` module-level variable works on long-running servers but provides no benefit on serverless (cold start per invocation).
   - What's unclear: Whether removing the cache causes any observable performance regression.
   - Recommendation: Remove the cache when converting to async. Keep the function simple.

## Sources

### Primary (HIGH confidence)
- [Next.js ImageResponse API Reference v16.1.6](https://nextjs.org/docs/app/api-reference/functions/image-response) — font format support (TTF/OTF/WOFF only), `fonts[]` option schema, official `readFile` pattern
- [Next.js opengraph-image file convention v16.1.6](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) — `readFile` from `node:fs/promises` with `join(process.cwd(), ...)` is the official documented pattern
- [Next.js outputFileTracingIncludes documentation v16.1.6](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) — route glob key syntax, values as project-root-relative glob patterns

### Secondary (MEDIUM confidence)
- [Satori WOFF2 issue #3](https://github.com/vercel/satori/issues/3) — confirmed WOFF2 not supported; opentype.js limitation; maintainers recommend TTF/OTF
- [Satori WOFF2 discussion #157](https://github.com/vercel/satori/discussions/157) — community confirmation, no WOFF2 support as of 2024
- [vercel/geist-font issue #66](https://github.com/vercel/geist-font/issues/66) — confirms TTF files added in v0.2.1, available in latest v1.7.0 release

### Tertiary (LOW confidence)
- [opengraph-image only working locally — Discussion #64683](https://github.com/vercel/next.js/discussions/64683) — community reports of ENOENT on Vercel; confirms `public/` not in function bundle

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed by official Next.js 16.1.6 docs
- Architecture: HIGH — patterns directly from official docs with code examples
- Pitfalls: HIGH (bug 1, 2) / MEDIUM (bug 3) — WOFF2 issue and async pattern confirmed by primary sources; `outputFileTracingIncludes` confirmed by official docs but specific route key behavior for OG routes not independently tested

**Research date:** 2026-02-25
**Valid until:** 2026-04-01 (stable API area; Next.js OG image API is mature)
