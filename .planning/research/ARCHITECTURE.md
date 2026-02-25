# Architecture Research

**Domain:** Dynamic OG image generation — Next.js App Router + Vercel serverless
**Researched:** 2026-02-25
**Confidence:** HIGH (official docs + verified failure modes from git history)

## Standard Architecture

### System Overview

```
Request: GET /card/[slug]/_next/og  OR  /watch/[token]/_next/og
           |
           v
┌──────────────────────────────────────────────────────────────────┐
│                   Next.js App Router (Node.js runtime)            │
│                                                                   │
│  app/card/[slug]/opengraph-image.tsx                              │
│  app/watch/[token]/opengraph-image.tsx                            │
│         |                                                         │
│         v                                                         │
│  lib/og-utils.ts          lib/card-data.ts / lib/watch-data.ts   │
│  getOgFonts()             getCardInfo() / getClipContributors()   │
│  fetchAvatarAsDataUri()                                           │
│  staticOgFallback()                                               │
│         |                         |                               │
│         v                         v                               │
│  public/fonts/*.woff         Supabase                             │
│  (must be TTF/OTF/WOFF)      (service role key)                   │
│         |                                                         │
│         v                                                         │
│  ImageResponse (Satori) → PNG → og:image meta tag                │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Current Status |
|-----------|----------------|----------------|
| `app/card/[slug]/opengraph-image.tsx` | Card invite OG image — host avatar, invitation text, recipient name | EXISTS — needs font fix |
| `app/watch/[token]/opengraph-image.tsx` | Watch OG image — contributor avatars, card title, recipient name | EXISTS — needs font fix |
| `lib/og-utils.ts` | Font loading, avatar fetching, static fallback, shared constants | EXISTS — needs font format fix |
| `lib/card-data.ts` | Card + host data from Supabase | EXISTS — complete |
| `lib/watch-data.ts` | Card + contributor data from Supabase (`getClipContributors`) | EXISTS — complete |
| `public/fonts/` | Bundled font files for Satori rendering | EXISTS — wrong format (woff2) |
| `next.config.ts` | `outputFileTracingIncludes` to bundle fonts into serverless function | MISSING — needs addition |

## Recommended Project Structure

The current structure is correct. Files to modify vs add:

```
/                                      # project root
├── next.config.ts                     # MODIFY: add outputFileTracingIncludes
├── public/
│   └── fonts/
│       ├── DMSerifDisplay-Regular.woff2  # REPLACE with .ttf or .woff
│       └── Geist-Regular.woff2           # REPLACE with .ttf or .woff
├── lib/
│   └── og-utils.ts                    # MODIFY: fix font format + async readFile
└── app/
    ├── card/[slug]/
    │   └── opengraph-image.tsx        # MODIFY: update getOgFonts() call signature
    └── watch/[token]/
        └── opengraph-image.tsx        # MODIFY: update getOgFonts() call signature
```

No new files needed. No new components needed. All data-fetching code is already correct.

### Structure Rationale

- **`public/fonts/`:** Vercel's deployment tracer can find files here when `outputFileTracingIncludes` is configured. The official Next.js docs use `assets/` but both work — `public/` is already in use.
- **`lib/og-utils.ts`:** Centralises all OG concerns. The design is correct; only font loading needs fixing.
- **`app/.../opengraph-image.tsx`:** The file convention is correct. Next.js auto-wires `og:image` meta tags.

## Architectural Patterns

### Pattern 1: `opengraph-image.tsx` File Convention

**What:** Placing `opengraph-image.tsx` in a route segment causes Next.js to auto-generate `og:image` meta tags pointing to `/_next/og`. No manual metadata wiring needed.

**When to use:** Always — this is the correct pattern. Already implemented.

**Trade-offs:** Auto-wired is good. The route is a Node.js Route Handler by default (not Edge), which is what we want for `readFile` access.

```typescript
// Exports control the metadata Next.js generates
export const alt = 'TOY card invitation'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 3600  // Cache for 1 hour — correct for dynamic cards

export default async function CardOgImage({ params }) {
  // ... returns ImageResponse or static fallback
}
```

### Pattern 2: Font Loading via `readFile` + `outputFileTracingIncludes`

**What:** Read font files from disk using async `readFile` from `node:fs/promises`. Configure `outputFileTracingIncludes` in `next.config.ts` to ensure Vercel bundles the font files into the serverless function.

**When to use:** This is the only reliable pattern for local fonts on Vercel serverless. Google Fonts fetch is unreliable (network call on cold start, rate limits). `import.meta.url` is not supported in Next.js App Router. `readFileSync` has the same tracing requirement as `readFile`.

**Trade-offs:** Font files add a small amount to function bundle size (TTF for DM Serif Display is ~40KB, Geist is ~30KB). This is acceptable. The benefit is zero network dependency.

```typescript
// lib/og-utils.ts
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function getOgFonts(): Promise<OgFont[]> {
  const fontsDir = join(process.cwd(), 'public', 'fonts')
  const [dmSerif, geist] = await Promise.all([
    readFile(join(fontsDir, 'DMSerifDisplay-Regular.ttf')),  // TTF, not woff2
    readFile(join(fontsDir, 'Geist-Regular.ttf')),            // TTF, not woff2
  ])
  return [
    { name: 'DM Serif Display', data: dmSerif.buffer as ArrayBuffer, weight: 400, style: 'normal' },
    { name: 'Geist', data: geist.buffer as ArrayBuffer, weight: 400, style: 'normal' },
  ]
}
```

```typescript
// next.config.ts — ensures Vercel's tracer bundles font files
const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/card/[slug]': ['./public/fonts/**/*'],
    '/watch/[token]': ['./public/fonts/**/*'],
  },
  // ...existing redirects
}
```

### Pattern 3: Static Fallback Response

**What:** If data fetch fails or throws, return the static `public/og-image.png` as a `Response` object. Already implemented in `lib/og-utils.ts`.

**When to use:** Always wrap `ImageResponse` generation in try/catch. OG image failures should never surface a 500 — a static fallback is always better than an error.

**Trade-offs:** None. Already correct.

```typescript
export async function staticOgFallback(): Promise<Response> {
  const imageBuffer = await readFile(join(process.cwd(), 'public', 'og-image.png'))
  return new Response(imageBuffer, {
    headers: { 'Content-Type': 'image/png' },
  })
}
// Note: staticOgFallback should also be async (readFile is async)
```

## Data Flow

### Card OG Image Request Flow

```
Social platform crawls /card/[slug]
  -> Next.js adds <meta og:image="/_next/og?..."> to <head>
  -> Platform fetches /_next/og (hits opengraph-image.tsx handler)
  -> params.slug resolved
  -> getOgFonts() reads TTF files from disk (cached in module scope)
  -> getCardInfo(slug) queries Supabase:
       cards table (by share_token, status in [collecting, published])
       profiles table (host display_name, avatar_url)
       storage.avatars.createSignedUrl (if avatar exists)
  -> fetchAvatarAsDataUri(hostAvatarUrl) — optional, 3s timeout
  -> ImageResponse(JSX, { fonts }) -> PNG
```

### Watch OG Image Request Flow

```
Social platform crawls /watch/[token]
  -> Platform fetches /_next/og handler
  -> getOgFonts() reads TTF from disk
  -> getCard(token) queries Supabase (status = published)
  -> getClipContributors(card.id):
       clips table (participant_id, contributor_name, status=uploaded)
       profiles table (display_name, avatar_url for unique participants)
       storage.avatars.createSignedUrl (parallel for all avatars)
  -> fetchAvatarAsDataUri() x up to 5 — parallel, 3s timeout each
  -> ImageResponse(JSX, { fonts }) -> PNG
```

### Caching

`revalidate = 3600` means the image is cached at the CDN/ISR layer for 1 hour. This is correct — card data changes infrequently, and signed URLs from Supabase are valid for 1 hour. No issue here.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-10k users | Current architecture sufficient. Single serverless function per route. |
| 10k-100k users | Avatar fetching (parallel, 3s timeout) could be the bottleneck. Consider pre-generating OG images when cards go live rather than on-demand. |
| 100k+ users | CDN caching with `revalidate` handles most of this already. |

### Scaling Priorities

1. **First bottleneck:** Avatar fetching — up to 5 parallel HTTP calls to Supabase Storage signed URLs. Already mitigated with 3s timeout and graceful degradation.
2. **Second bottleneck:** Supabase queries — multiple queries per image request. `getClipContributors` does 2-3 queries. Already optimised (separate lightweight function from `getClips`).

## Anti-Patterns

### Anti-Pattern 1: WOFF2 Font Files with Satori

**What people do:** Use `.woff2` font files (the modern web standard) with `ImageResponse`.

**Why it's wrong:** Satori (the engine behind `next/og`) explicitly does not support WOFF2. The error is `"Unsupported OpenType signature wOF2"`. This is the most likely root cause of the current failures. GitHub issue #63935 was closed as "not planned" — WOFF2 support is not coming.

**Do this instead:** Use TTF or OTF font files. TTF is the safest choice — universally supported by Satori, widely available from Google Fonts download.

### Anti-Pattern 2: Fetching Fonts from Google Fonts at Runtime

**What people do:** Fetch from `fonts.googleapis.com` to get font CSS, then parse the URL and fetch the actual font file — every time the OG image generates.

**Why it's wrong:** Adds 2 network round-trips on every cold start. Google Fonts API can be rate-limited from serverless IPs. The CSS parsing regex is fragile (has broken with Google Fonts format changes historically). Vercel's Vercel-OG docs now recommend loading from disk instead.

**Do this instead:** Bundle TTF files in `public/fonts/` and configure `outputFileTracingIncludes`.

### Anti-Pattern 3: Missing `outputFileTracingIncludes` for Font Files

**What people do:** Place font files in `public/fonts/` and use `readFile`/`readFileSync`, but don't tell Next.js to include those files in the serverless function trace.

**Why it's wrong:** Vercel's output file tracer only auto-traces files that are statically imported. Font files loaded dynamically via `readFile(join(process.cwd(), ...))` at runtime are not detected by the tracer. The function deploys without the font files, causing `ENOENT: no such file or directory /var/task/public/fonts/...` in production.

**Do this instead:** Add `outputFileTracingIncludes` in `next.config.ts` to explicitly include the font globs.

### Anti-Pattern 4: Synchronous `readFileSync` vs Async `readFile`

**What people do:** Use synchronous `readFileSync` to avoid making `getOgFonts` async.

**Why it's wrong:** Not strictly wrong — `readFileSync` works on Node.js runtime. But the official Next.js docs example uses async `readFile` from `node:fs/promises`. More importantly, the current code calls `getOgFonts()` synchronously and passes the result to `ImageResponse`. This works with `readFileSync` but blocks the event loop on cold starts. The `opengraph-image.tsx` functions are already async.

**Do this instead:** Use `readFile` from `node:fs/promises` and await it. Change `getOgFonts` to an async function. The call site already uses `await` patterns so this is a small change.

### Anti-Pattern 5: Module-Level Promise Caching for Fonts

**What people do:** Cache the font loading promise at module level (`const dmSerifFont = loadGoogleFont(...)`) so it only loads once per worker lifetime.

**Why it's wrong:** If the initial load fails (network timeout, etc.), the rejected promise is cached forever — subsequent requests reuse the failed promise and always get fonts. This is the pattern from the first OG image commit that was later removed.

**Do this instead:** Cache the resolved data, not the promise. The current `fontsCache` variable approach is correct. With local file loading (not network), failures should be extremely rare anyway.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase (cards table) | Server-side client, service role key, `single()` query | Already correct |
| Supabase (profiles table) | Server-side client, join via `host_id` / `participant_id` | Already correct |
| Supabase Storage (avatars) | `createSignedUrl` with 3600s expiry | Expiry matches `revalidate` — correct |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `opengraph-image.tsx` -> `lib/og-utils.ts` | Direct import | `getOgFonts()` needs to become async |
| `opengraph-image.tsx` -> `lib/card-data.ts` | Direct import | No changes needed |
| `opengraph-image.tsx` -> `lib/watch-data.ts` | Direct import | No changes needed |
| `page.tsx` -> `lib/card-data.ts` | Direct import, shared `getCardInfo()` | Both page and OG image call this — causes 2 Supabase round-trips per page load. Acceptable for now. |

## What to Modify vs Add

### Modify (3 files)

1. **`public/fonts/`** — Replace `DMSerifDisplay-Regular.woff2` and `Geist-Regular.woff2` with `.ttf` equivalents. Download from Google Fonts. This is the root cause fix.

2. **`lib/og-utils.ts`** — Two changes:
   - Change `getOgFonts()` from synchronous to async (`readFile` instead of `readFileSync`)
   - Update font filenames to `.ttf`
   - Change `staticOgFallback()` from sync to async (same reason)

3. **`next.config.ts`** — Add `outputFileTracingIncludes` to ensure font files are bundled into the Vercel serverless function. Without this, the fonts won't be present at `/var/task/public/fonts/` at runtime.

### No New Files Needed

The `opengraph-image.tsx` files themselves need only minor updates to match the async `getOgFonts()` signature. The data-fetching layer is complete and correct.

## Build Order

1. **Download TTF fonts** — DM Serif Display Regular and Geist Regular from Google Fonts. Place in `public/fonts/`. Delete the woff2 files.

2. **Fix `lib/og-utils.ts`** — Make `getOgFonts()` async, update filenames to `.ttf`. Make `staticOgFallback()` async. Test locally that fonts render correctly with `npm run dev`.

3. **Update `opengraph-image.tsx` files** — Add `await` to `getOgFonts()` call. Fix `staticOgFallback()` await.

4. **Add `outputFileTracingIncludes` to `next.config.ts`** — Ensures Vercel bundles the font files.

5. **Deploy and verify** — Hit the OG image URL directly: `https://sendtoycard.com/card/[a-valid-slug]` and inspect the `og:image` response.

## Sources

- [Next.js opengraph-image file convention docs (v16.1.6)](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) — `readFile` from `node:fs/promises` with `assets/` folder is the official pattern. HIGH confidence.
- [Next.js outputFileTracingIncludes docs (v16.1.6)](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) — Mechanism for including non-traced files in serverless bundles. HIGH confidence.
- [Satori README — font format support](https://github.com/vercel/satori) — TTF, OTF, WOFF supported. WOFF2 explicitly not supported. HIGH confidence.
- [GitHub issue #63935 — wOF2 unsupported](https://github.com/vercel/next.js/issues/63935) — Confirms WOFF2 causes `"Unsupported OpenType signature wOF2"`. Closed as "not planned." HIGH confidence.
- [GitHub issue #77498 — process.cwd() in opengraph-image](https://github.com/vercel/next.js/issues/77498) — Confirms ENOENT on Vercel without tracing configuration. MEDIUM confidence (GitHub issue).
- [Vercel @vercel/og reference](https://vercel.com/docs/og-image-generation/og-image-api) — Font array spec. HIGH confidence.
- [Vercel custom font recipe](https://vercel.com/docs/recipes/using-custom-font) — Shows Google Fonts fetch pattern (alternative). MEDIUM confidence.

---
*Architecture research for: TOY Web — Dynamic OG Image Integration*
*Researched: 2026-02-25*
