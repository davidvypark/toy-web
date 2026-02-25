# Pitfalls Research

**Domain:** Dynamic OG image generation — Next.js 16 / Satori / ImageResponse on Vercel
**Researched:** 2026-02-25
**Confidence:** HIGH (4 failures confirmed from real implementation, root causes verified against official docs and GitHub issues)

---

## Critical Pitfalls

### Pitfall 1: woff2 Font Format Not Supported by Satori

**What goes wrong:**
The OG image route silently renders with the system fallback font (or throws `"Unsupported OpenType signature wOF2"`), causing all text to appear in the wrong typeface. Brand fonts (DM Serif Display, Geist) do not render.

**Why it happens:**
Satori, the rendering engine behind `next/og` ImageResponse, only supports **TTF, OTF, and WOFF** font formats. It does not support WOFF2. The current implementation (`lib/og-utils.ts`) bundles `DMSerifDisplay-Regular.woff2` and `Geist-Regular.woff2` in `public/fonts/` — both are the wrong format. The error was filed as a GitHub issue (#63935) and closed "not planned," meaning Satori will not add WOFF2 support.

This is the **single most important blocker** for the current implementation. Even if font loading and file tracing are fixed, the fonts will fail to render because of the format.

**How to avoid:**
Download TTF or WOFF (v1) variants of both fonts. Do not use WOFF2 under any circumstances for Satori/ImageResponse.

- DM Serif Display TTF: available from Google Fonts download (select TTF)
- Geist TTF: available from Vercel's GitHub (`vercel/geist-font`) or Google Fonts

Replace `public/fonts/*.woff2` with `public/fonts/*.ttf` (or `*.woff`) and update `lib/og-utils.ts` to reference the correct filenames.

**Warning signs:**
- Text in OG image renders in a generic sans-serif instead of the brand fonts
- Console error: `"Unsupported OpenType signature wOF2"` in Vercel function logs
- OG image renders without error but looks visually wrong (wrong font)

**Phase to address:** Font loading phase — before any other font loading work is attempted.

---

### Pitfall 2: Google Fonts CSS Regex Pattern Mismatch

**What goes wrong:**
The font binary fetch returns `null` or throws, causing `getOgFonts()` to return `[]`. The OG image renders with no fonts or falls back to the static image.

**Why it happens:**
The original attempt (commit `6ae1cf9`) used this regex to extract the font URL from Google Fonts CSS:

```typescript
const match = css.match(/src:\s*url\(([^)]+)\)\s*format\('woff2'\)/)
```

This pattern searches for `format('woff2')`. However, Google Fonts returns different CSS depending on the `User-Agent` header. When the server sends a Chrome-like User-Agent, Google Fonts serves WOFF2 with `format('woff2')` declarations. But crucially, Satori cannot parse WOFF2 anyway (see Pitfall 1).

If the User-Agent does not match what Google expects, the CSS may use `format('opentype')` or `format('truetype')` instead, making the regex return no match.

The two-level failure: even if the regex matched and returned a WOFF2 URL, Satori would still fail to parse it. The pattern needs to match `opentype` or `truetype` formats to get a TTF/OTF font that Satori can actually use:

```typescript
const match = css.match(/src:\s*url\((.+)\)\s+format\('(opentype|truetype)'\)/)
```

Additionally, fetching fonts at runtime from Google's CDN introduces network latency (50-200ms per font), adds a runtime dependency on an external service, and the fetch can fail in serverless cold starts or network-restricted environments.

**How to avoid:**
Do not fetch fonts from Google Fonts at runtime. Bundle font files locally instead. If Google Fonts runtime fetch is required for some reason, use a regex matching `opentype|truetype`, not `woff2`.

**Warning signs:**
- `getOgFonts()` returns empty array
- OG image renders with wrong/fallback fonts
- Vercel function logs show network fetch errors to `fonts.googleapis.com` or `fonts.gstatic.com`
- Slow OG image response times (>500ms) due to font CDN round-trips

**Phase to address:** Font loading phase — replace runtime Google Fonts fetch with bundled local fonts.

---

### Pitfall 3: import.meta.url for Font Loading is Turbopack-Incompatible

**What goes wrong:**
The development server crashes with a module resolution error when `import.meta.url` is used to construct font file URLs. Works in `next build` (webpack) but fails in `next dev` (Turbopack, the default in Next.js 16).

**Why it happens:**
A common pattern for Edge Runtime font loading is:

```typescript
const font = await fetch(new URL('./fonts/MyFont.ttf', import.meta.url))
```

This uses `import.meta.url` to get the current module's URL, then constructs a relative path to the font. Turbopack does not implement `import.meta.url` for server-side module resolution (tracked in Next.js issue #62650). The webpack bundler (used in production builds) does support it, creating a working production build that crashes in development — the worst failure mode.

This affects `next dev` with the default Turbopack mode. Running `next dev --no-turbopack` would work, but that defeats the purpose of the development server.

**How to avoid:**
Use `process.cwd()` with `path.join` and `fs.readFile` (Node.js runtime) instead of `import.meta.url`. This works in both Turbopack dev mode and production builds:

```typescript
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const font = await readFile(join(process.cwd(), 'public/fonts/MyFont.ttf'))
```

**Warning signs:**
- Error only appears during `next dev`, not after `next build && next start`
- Module resolution error mentioning `import.meta.url` or URL constructor
- OG image works in production deployment but not locally

**Phase to address:** Font loading phase — use `process.cwd()` + `fs.readFile` pattern exclusively.

---

### Pitfall 4: Vercel Node File Tracer Does Not Auto-Trace readFileSync Dynamic Paths

**What goes wrong:**
OG image route works locally but throws `ENOENT: no such file or directory` on Vercel. Fonts are present in the repository but not in the deployed function bundle.

**Why it happens:**
Vercel uses `@vercel/nft` (Node File Tracer) to determine which files a serverless function needs at runtime. NFT performs static analysis of `require()` calls and ES module imports. It does NOT trace files referenced via dynamic `readFileSync` calls with `process.cwd()` or `__dirname` string concatenation at runtime.

The attempt to load from `assets/fonts/` (commit `9a50178`) failed because:
1. `assets/` is not a directory that Vercel's build output includes by default
2. NFT's static analysis cannot follow `join(process.cwd(), 'assets', 'fonts', filename)` because the path is constructed dynamically at runtime

The subsequent move to `public/fonts/` (commit `7566d29`) is a better strategy because the `public/` directory IS deployed by Vercel as static assets. However, files in `public/` are served as HTTP assets, not as file system paths accessible from serverless functions. The serverless function cannot read `public/fonts/` via `readFileSync` in the Vercel Lambda environment — those files are in a different location.

**The fix has two parts:**

1. **Use `outputFileTracingIncludes` in `next.config.ts`** to explicitly tell NFT to include the font files in the serverless function bundle:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/card/[slug]/opengraph-image': ['./public/fonts/**/*'],
      '/watch/[token]/opengraph-image': ['./public/fonts/**/*'],
    },
  },
}
```

2. **Load fonts via `process.cwd()` + `readFile`** (not `readFileSync` with caching, not `import.meta.url`):

```typescript
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const dmSerif = await readFile(join(process.cwd(), 'public/fonts/DMSerifDisplay-Regular.ttf'))
```

Note: After adding `outputFileTracingIncludes`, the font files will be present at `process.cwd()/public/fonts/` in the Lambda environment.

**Warning signs:**
- Works locally (`npm run dev`, `npm run build && npm start`) but fails on Vercel
- Vercel function logs show `ENOENT: no such file or directory, open '/var/task/public/fonts/...'`
- `/var/task/` in the error path confirms it's a Vercel serverless runtime issue

**Phase to address:** Deployment validation phase — must verify in a real Vercel deployment, not just local build.

---

### Pitfall 5: opengraph-image Route Runtime Must Match Page Runtime

**What goes wrong:**
The `opengraph-image.tsx` route silently fails or throws a runtime mismatch error when the page (`page.tsx`) uses one runtime and `opengraph-image.tsx` uses a different one.

**Why it happens:**
Next.js Route Handlers inherit runtime from their segment. If `app/watch/[token]/page.tsx` uses the default Node.js runtime but `opengraph-image.tsx` exports `export const runtime = 'edge'`, there is a mismatch in how Next.js compiles the segment. This is tracked in Next.js issue #77796.

The default runtime for opengraph-image routes is the Edge runtime. However, Edge runtime cannot use `node:fs` or `readFileSync`. This creates a conflict: the reliable font loading pattern requires Node.js runtime, but the default is Edge.

**How to avoid:**
Explicitly export `export const runtime = 'nodejs'` in both the page and `opengraph-image.tsx` files. Do not mix runtimes within the same route segment. The Node.js runtime is required to use `readFile` for local fonts.

Note that the Edge runtime has a 500KB bundle size limit that includes all fonts — this is tight for two custom fonts. Node.js runtime has no such limit.

**Warning signs:**
- OG image fails only in production (edge/node compilation difference)
- Inconsistent behavior between `next dev` and `next build`
- Error mentioning runtime context or unsupported API

**Phase to address:** Font loading phase — set `export const runtime = 'nodejs'` explicitly.

---

### Pitfall 6: Module-Level Font Caching Persists Rejected Promises

**What goes wrong:**
After a cold start failure (e.g., network error fetching fonts), subsequent requests to the same warm function continue to fail even after the underlying cause is resolved.

**Why it happens:**
The original implementation (commit `6ae1cf9`) cached font loading at module level:

```typescript
// Cached as a Promise at module load time — if it rejects, the rejection is cached
const dmSerifFont = loadGoogleFont('DM Serif Display', 400)
const geistFont = loadGoogleFont('Geist', 400)
```

If `loadGoogleFont` fails on the first invocation (network timeout, regex mismatch, etc.), the module-level `Promise` captures the rejection. All subsequent calls to `getOgFonts()` within the same warm Lambda return the cached rejected Promise, meaning every request fails until the function instance is recycled.

This is why the fix in commit `a81db16` switched to a lazy cache with retry logic. However, the correct fix is to not fetch fonts at runtime at all — use bundled local files.

**How to avoid:**
Use synchronous `readFileSync` or async `readFile` at request time with a `try/catch` that returns a static fallback on error. If caching is used, only cache successful results, never pending or rejected Promises.

**Warning signs:**
- OG image fails on all requests after a single initial failure, then recovers on its own after some time (Lambda recycling)
- Error rate spikes after deployment then gradually reduces as new instances come up

**Phase to address:** Font loading phase — eliminate runtime font fetching entirely.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Catching all errors and returning static fallback | Prevents 500 errors | Masks real failures — developers don't know OG images are broken | Never in production without logging |
| Skipping `export const runtime = 'nodejs'` | Less boilerplate | Runtime mismatch causes silent failures in production | Never |
| Using `revalidate = 3600` without CDN Cache-Control headers | Appears to control cache | Social crawlers ignore Next.js revalidation; they cache independently | Acceptable if combined with proper cache headers |
| Caching fonts at module level | Avoids re-reading on each request | Caches rejected Promises permanently (see Pitfall 6) | Acceptable only if fonts are loaded from local files (no network dependency) |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Satori font loading | Passing WOFF2 data — `Unsupported OpenType signature wOF2` | Use TTF or WOFF (v1) format only |
| Satori JSX | Using CSS Grid, `calc()`, CSS variables, `z-index` | Only flexbox and explicit inline styles; every container needs `display: 'flex'` |
| Satori images | Using relative URLs or `<Image>` from `next/image` | Use absolute URLs or base64 data URIs for all images |
| Vercel NFT | Relying on `readFileSync` with dynamic paths to find assets | Use `outputFileTracingIncludes` in `next.config.ts` |
| Vercel deployment | Using `public/` path as file system accessible from Lambda | `public/` is for static HTTP serving; fonts must be traced into the function bundle |
| Social media crawlers | Setting `revalidate` to control crawler cache | Crawlers (Facebook, Twitter, iMessage, Slack) maintain their own cache; use `?v=` query params to force refresh during testing |
| Google Fonts runtime fetch | Expecting `format('woff2')` in CSS response | User-Agent determines format; use `format('opentype|truetype')` regex, or better: don't fetch at runtime at all |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching fonts from Google CDN on every cold start | 100-300ms added to first OG image request | Bundle fonts locally | Every cold start; worse under traffic spikes |
| Fetching multiple contributor avatars serially | OG image takes 3-15 seconds when contributors have avatars | Already using `Promise.all()` — keep this; set short timeouts (current 3s is fine) | Any card with multiple contributors |
| No timeout on avatar fetches | Slow/unresponsive avatar URLs cause OG route to time out | Current 3-second AbortController timeout is correct | Any slow external image host |
| Re-reading font files on every request without caching | Unnecessary I/O on each OG request | Cache loaded font buffers at module level (synchronous cache is safe for local files) | High-traffic scenarios |
| woff2 files silently parsed as garbage | Images render with wrong font, no error thrown | Use TTF/WOFF; verify rendered output visually | Every request |

---

## "Looks Done But Isn't" Checklist

- [ ] **Font format:** Verify font files are TTF or WOFF (not WOFF2) — run `file public/fonts/*.ttf` to confirm
- [ ] **Font rendering:** Visually verify OG image shows DM Serif Display and Geist, not system fallback — inspect with `https://og-playground.vercel.app/` or direct URL
- [ ] **Vercel deployment:** Test OG image URL on actual Vercel deployment, not just `next build && next start` locally
- [ ] **NFT tracing:** Confirm `outputFileTracingIncludes` is set in `next.config.ts` for both OG routes
- [ ] **Runtime declaration:** Both `opengraph-image.tsx` files export `export const runtime = 'nodejs'`
- [ ] **Error fallback logging:** Static fallback is returned on error AND the error is logged (not silently swallowed)
- [ ] **Social media preview:** Test OG image with Facebook Sharing Debugger, Twitter Card Validator, and iMessage link preview — all have independent caches
- [ ] **Satori CSS:** All container elements have explicit `display: 'flex'`; no CSS Grid, `calc()`, or CSS variables used

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong font format (woff2) | LOW | Download TTF variants, replace files, redeploy |
| Google Fonts regex mismatch | LOW | Remove runtime fetch, switch to local bundled fonts |
| import.meta.url Turbopack error | LOW | Replace with `process.cwd()` + `readFile` pattern |
| NFT not tracing fonts | MEDIUM | Add `outputFileTracingIncludes` to `next.config.ts`, redeploy, verify in Vercel logs |
| Runtime mismatch | LOW | Add `export const runtime = 'nodejs'` to both files |
| Social media cache showing old image | LOW | Append `?v=2` or similar to og:image URL to force re-crawl |
| Cached rejected Promises | LOW | Remove module-level Promise caching; switch to local file reads |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| woff2 format unsupported | Phase 1 — Font format fix | Run `file public/fonts/*` to confirm TTF/WOFF; render OG image and inspect font visually |
| Google Fonts regex mismatch | Phase 1 — Remove runtime fetch | No `fonts.googleapis.com` calls in Vercel function logs |
| import.meta.url Turbopack incompatible | Phase 1 — Font loading rewrite | `npm run dev` starts without errors; OG image loads in dev mode |
| NFT not tracing font files | Phase 2 — Vercel deployment validation | Check Vercel build logs for font files in trace; test OG URL on Vercel deployment, not localhost |
| Runtime mismatch (edge vs node) | Phase 1 — Add `runtime = 'nodejs'` export | Both opengraph-image files have explicit `export const runtime = 'nodejs'` |
| Cached rejected Promises | Phase 1 — Font loading rewrite | Remove module-level font Promise; no retry logic needed with local files |
| Social media cache staleness | Phase 3 — QA / testing | Test with Facebook Sharing Debugger after deployment |

---

## Debugging Strategies

### Local Verification

Test OG images locally at these URLs after `npm run dev`:

```
http://localhost:3000/card/[any-slug]/opengraph-image
http://localhost:3000/watch/[any-token]/opengraph-image
```

This bypasses Next.js metadata routing and returns the raw image — faster feedback loop than inspecting `<meta>` tags.

### Vercel Build Log

After deployment, check Vercel build logs for:
- NFT trace output mentioning font files (confirms they were included)
- `outputFileTracingIncludes` acknowledgment

### Vercel Function Logs

Check runtime logs (Vercel dashboard → Functions tab) for:
- `ENOENT` errors (font not found)
- `Unsupported OpenType signature wOF2` (wrong format)
- Network errors to `fonts.googleapis.com` (runtime fetch still present)

### Social Media Debugging Tools

- Facebook: https://developers.facebook.com/tools/debug/ (use "Scrape Again" to clear cache)
- Twitter/X: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/
- iMessage: No tool available; use a fresh device/account or change the URL to bust cache

---

## Sources

- [Next.js opengraph-image docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) — official runtime patterns and font loading examples
- [Vercel custom font guide](https://vercel.com/guides/using-custom-font) — Google Fonts runtime fetch pattern
- [Next.js ImageResponse docs](https://nextjs.org/docs/app/api-reference/functions/image-response) — font format limitations: "Only ttf, otf, and woff font formats are supported"
- [GitHub issue #63935: "Unsupported OpenType signature wOF2"](https://github.com/vercel/next.js/issues/63935) — WOFF2 confirmed unsupported, closed "not planned"
- [GitHub issue #62650: import.meta.url does not work with Turbopack](https://github.com/vercel/next.js/issues/62650) — Turbopack incompatibility confirmed
- [GitHub issue #62783: ImageResponse does not work in Route Handler (edge) with turbopack](https://github.com/vercel/next.js/issues/62783) — Turbopack edge runtime issues
- [GitHub issue #77498: OpenGraph-Image unable to locate static files via process.cwd()](https://github.com/vercel/next.js/issues/77498) — NFT tracing failure documented
- [GitHub discussion #64683: opengraph-image.tsx only working locally](https://github.com/vercel/next.js/discussions/64683) — ENOENT in /var/task/ confirmed
- [GitHub discussion #55228: outputFileTracingIncludes in app directory routes](https://github.com/vercel/next.js/discussions/55228) — workaround for tracing
- [GitHub issue #77796: opengraph-image route cannot use Node.js APIs with edge page](https://github.com/vercel/next.js/issues/77796) — runtime mismatch issue
- [Satori npm — font format support](https://www.npmjs.com/package/satori) — TTF, OTF, WOFF only; WOFF2 not supported
- [Vercel community: Opengraph-image route on Node.js runtime not finding local asset](https://community.vercel.com/t/opengraph-image-route-on-node-js-runtime-is-not-finding-a-local-asset/670)
- Project commit history: `6ae1cf9`, `a81db16`, `9a50178`, `7566d29` — actual failure sequence

---
*Pitfalls research for: Dynamic OG image generation with Satori/ImageResponse on Next.js + Vercel*
*Researched: 2026-02-25*
