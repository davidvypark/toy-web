# Project Research Summary

**Project:** TOY Web — Dynamic OG Images (Milestone v1.1)
**Domain:** Dynamic OG image generation — Next.js 16 App Router + Vercel serverless
**Researched:** 2026-02-25
**Confidence:** HIGH

## Executive Summary

This milestone fixes a broken dynamic OG image implementation for the TOY video greeting card web app. The app already has substantially complete OG image code covering two routes — `/card/[slug]` (invite link) and `/watch/[token]` (video viewer). The images fail silently in production due to two compounding root causes: (1) the font files are in WOFF2 format, which Satori (the rendering engine behind `next/og`) explicitly does not support, and (2) the Vercel serverless build does not include the font files in the function bundle because `outputFileTracingIncludes` is missing from `next.config.ts`. Both failures are well-documented in the official Next.js docs and confirmed in GitHub issues.

The fix is surgical and low-risk: replace the two WOFF2 font files with TTF equivalents, add `outputFileTracingIncludes` to `next.config.ts`, and convert `getOgFonts()` to use async `readFile` from `node:fs/promises`. No new npm packages, no schema changes, and no new components are needed. All data-fetching logic (`getCardInfo`, `getClipContributors`, `fetchAvatarAsDataUri`) is correct and complete. The fix scope is 3 files: `public/fonts/` (replace files), `lib/og-utils.ts` (font format + async), and `next.config.ts` (add tracing config).

The main risk is not technical complexity but verification: social media platforms (iMessage, Slack, Twitter/X, Facebook, WhatsApp) maintain their own aggressive caches independent of Next.js `revalidate`. OG images must be tested against each platform's official debug tool after deployment, not just locally. iMessage in particular caches at the device level with no programmatic invalidation — getting the implementation right before sharing publicly is important.

## Key Findings

### Recommended Stack

No new dependencies are needed. The existing stack (`next/og` ImageResponse, `opengraph-image.tsx` file convention, Supabase service role client) is the correct choice. The only required changes are configuration additions and font format conversion.

**Core technologies:**
- `next/og` ImageResponse: OG image rendering via Satori — already used correctly, no version changes needed
- `opengraph-image.tsx` file convention: auto-injects `og:image` meta tags — already in place for both routes
- `node:fs/promises` readFile: async font loading pattern — replaces current `readFileSync`
- `outputFileTracingIncludes` in `next.config.ts`: tells Vercel NFT to bundle font files — currently missing, must be added
- TTF font format: Satori supports TTF, OTF, WOFF only — replaces current WOFF2 files

**Critical version note:** `outputFileTracingIncludes` is a stable top-level config option since Next.js 14. Do not place it under `experimental: {}`.

### Expected Features

The images are feature-complete for launch. The milestone is about making them work reliably on Vercel, not building new functionality.

**Must have (table stakes — already built):**
- Recipient name in image — personal signal; `cards.recipient_name` available in both routes
- Card title displayed — sets context; `cards.title` available in both routes
- Host avatar on invite image — trust signal for `/card/[slug]`; data pipeline complete
- Contributor avatar stack on watch image — emotional hook for `/watch/[token]`; `getClipContributors()` complete
- Static fallback when Supabase returns null — already implemented via `staticOgFallback()`
- Brand palette and typography — warm palette, DM Serif Display, Geist; already in JSX
- 1200x630 PNG output — required by all major platforms; already configured

**Should have (v1.x after validation):**
- Occasion-aware copy — requires adding `cards.occasion` to `getCardInfo()` select; one-line schema change
- Coral accent on recipient name — `toy-primary` (#E8735A) applied to name text for visual hierarchy

**Defer (v2+):**
- Persistent video thumbnail as OG background — not feasible with signed URLs (short TTL vs. days-long platform caching)
- 1200x1200 square variant for iMessage rich previews — requires a second image route per page
- Animated GIF OG images — not reliably supported by iMessage, Twitter, Slack

### Architecture Approach

The architecture is already correct. The `opengraph-image.tsx` file convention for each route auto-wires `og:image` meta tags and runs on the Node.js runtime by default. The shared `lib/og-utils.ts` centralizes font loading, avatar fetching, and static fallback. The data layer (`lib/card-data.ts`, `lib/watch-data.ts`) is complete and does not need modification.

**Major components:**
1. `app/card/[slug]/opengraph-image.tsx` — card invite OG image; needs `await getOgFonts()` and `export const runtime = 'nodejs'`
2. `app/watch/[token]/opengraph-image.tsx` — watch OG image; same two changes as above
3. `lib/og-utils.ts` — font loading and shared utilities; needs async `readFile`, TTF filenames, async `staticOgFallback`
4. `public/fonts/` — bundled TTF font files; replace current WOFF2 files
5. `next.config.ts` — deployment configuration; add `outputFileTracingIncludes` for both routes

**Build order:** fonts first (root cause), then `og-utils.ts` (fix loading), then `opengraph-image.tsx` files (update call sites), then `next.config.ts` (enable tracing), then deploy and verify.

### Critical Pitfalls

1. **WOFF2 format unsupported by Satori** — Use TTF or WOFF (v1) only. WOFF2 throws `"Unsupported OpenType signature wOF2"` and support is permanently closed (GitHub #63935). This is the primary blocker.

2. **Vercel NFT does not auto-trace dynamic `readFile` paths** — Add `outputFileTracingIncludes` in `next.config.ts`. Without this, font files are absent from the Lambda bundle and cause `ENOENT` in production. Works locally, fails on Vercel.

3. **`import.meta.url` is incompatible with Turbopack** — Use `process.cwd()` + `readFile` pattern. `import.meta.url` fails in `next dev` (Turbopack default) while appearing to work in production builds, creating the worst debugging situation.

4. **Runtime mismatch (Edge vs Node.js)** — Explicitly export `export const runtime = 'nodejs'` in both `opengraph-image.tsx` files. Edge runtime has no filesystem access; `readFile` requires Node.js runtime.

5. **Module-level rejection caching** — Do not cache font loading Promises at module level. A single failed load poisons all subsequent requests until the Lambda is recycled. Local file reads with per-request `readFile` eliminate this entirely.

## Implications for Roadmap

The milestone has a clear 3-phase structure based on dependency order: fix the root causes locally, validate on Vercel, then test across platforms.

### Phase 1: Font and Config Fix

**Rationale:** The two root causes (wrong font format, missing file tracing) must be fixed before anything else can be verified. They are independent of each other but both must be resolved for OG images to work on Vercel.
**Delivers:** OG images that render with correct brand fonts locally and in production
**Addresses:** Recipient name, card title, host avatar, contributor avatars — all table stakes features now functional
**Avoids:** WOFF2 format error (Pitfall 1), NFT tracing failure (Pitfall 4), runtime mismatch (Pitfall 5), module-level rejection caching (Pitfall 6)

Tasks:
- Download TTF variants of DM Serif Display and Geist from Google Fonts / Vercel GitHub
- Replace `public/fonts/*.woff2` with `*.ttf`
- Rewrite `lib/og-utils.ts`: async `getOgFonts()` with `readFile`, update filenames, async `staticOgFallback()`
- Add `export const runtime = 'nodejs'` to both `opengraph-image.tsx` files
- Update `await getOgFonts()` call sites in both `opengraph-image.tsx` files
- Add `outputFileTracingIncludes` to `next.config.ts` covering both routes

### Phase 2: Vercel Deployment Validation

**Rationale:** Local builds (`npm run build && npm start`) do not reproduce the Vercel Lambda environment. NFT tracing failures, missing font files, and serverless cold start behavior only manifest in a real Vercel deployment.
**Delivers:** Confirmed working OG images on production deployment
**Uses:** Vercel dashboard function logs, direct OG image URL inspection
**Implements:** Verification of `outputFileTracingIncludes` tracing output in build logs

Tasks:
- Deploy to Vercel and check build logs for font file tracing confirmation
- Hit OG image URLs directly on the Vercel deployment (not localhost)
- Check Vercel function logs for `ENOENT` or `wOF2` errors
- Confirm both `/card/[slug]/opengraph-image` and `/watch/[token]/opengraph-image` return 200 PNG

### Phase 3: Cross-Platform QA

**Rationale:** Social platforms maintain independent caches with no programmatic invalidation. Testing is required after deployment, not before. iMessage is the highest priority given the app's iOS companion context.
**Delivers:** Confirmed previews across all major sharing surfaces
**Avoids:** Platform cache staleness pitfall — use debug tools, not organic sharing, to test

Tasks:
- Facebook Sharing Debugger — scrape and visually verify `/card/[slug]` and `/watch/[token]`
- Twitter Card Validator — confirm `summary_large_image` card type renders
- LinkedIn Post Inspector — verify preview
- iMessage — test on device with a valid card/watch URL
- Slack — paste link in a channel to trigger unfurl

### Phase Ordering Rationale

- Phase 1 before Phase 2: The code fix must precede deployment validation. Deploying broken code wastes a deployment cycle and pollutes platform caches.
- Phase 2 before Phase 3: Platform cache poisoning is permanent for some crawlers (iMessage). Verifying on Vercel first avoids filling real caches with a broken image.
- Phase 3 last: Social QA is only meaningful after production confirmation. Cache-busting mid-QA requires URL changes which changes the share link.

### Research Flags

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1:** Font format and `outputFileTracingIncludes` are fully documented in official Next.js docs and confirmed via GitHub issues. No ambiguity remains.
- **Phase 2:** Vercel deployment validation follows standard debug workflow (function logs, direct URL testing). Well-understood.
- **Phase 3:** Each platform's official debug tool is known. Caching behavior is documented.

No phase requires deeper research. All root causes are definitively identified with official sources.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings from official Next.js docs and Vercel KB. Root causes confirmed in closed GitHub issues. |
| Features | HIGH | Platform specs from official docs (Apple TN3156, Twitter Card docs, Slack unfurling). Feature decisions grounded in concrete data availability analysis. |
| Architecture | HIGH | Official opengraph-image file convention docs + PR #75274 (merged Jan 2025) confirms canonical pattern. Real failure sequence documented from commit history. |
| Pitfalls | HIGH | 4+ failures confirmed from actual commit history (`6ae1cf9`, `a81db16`, `9a50178`, `7566d29`). Root causes verified against official docs and GitHub issues. |

**Overall confidence:** HIGH

### Gaps to Address

- **`outputFileTracingIncludes` path specificity:** ARCHITECTURE.md uses `'/card/[slug]'` as the key and `STACK.md` uses `'/card/[slug]/opengraph-image'`. The more specific route path (including `/opengraph-image`) is correct per the Next.js docs — use that. Low risk; either form likely works, but the specific form is documented.
- **`public/fonts/` vs `assets/` directory:** STACK.md recommends `assets/` (matching official Next.js docs example); ARCHITECTURE.md accepts `public/fonts/`. Either works with `outputFileTracingIncludes`. Recommend `public/fonts/` since it's already in use and the glob pattern handles it. No action needed beyond confirming the config path matches the actual font directory.
- **Occasion-aware copy:** `cards.occasion` is in the schema but not yet queried in `getCardInfo()`. This is a v1.x improvement requiring one line added to the Supabase select. Deferred from this milestone.

## Sources

### Primary (HIGH confidence)
- [Next.js ImageResponse API Reference](https://nextjs.org/docs/app/api-reference/functions/image-response) — font format support (TTF/OTF/WOFF only), 500KB limit
- [Next.js opengraph-image file convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image) — official `readFile` + Node.js runtime pattern
- [Next.js outputFileTracingIncludes docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) — configuration pattern for serverless file bundling
- [GitHub issue #63935: "Unsupported OpenType signature wOF2"](https://github.com/vercel/next.js/issues/63935) — WOFF2 confirmed unsupported, closed "not planned"
- [GitHub issue #62650: import.meta.url Turbopack incompatibility](https://github.com/vercel/next.js/issues/62650) — confirmed
- [Vercel KB: Using files in Vercel Functions](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions) — `outputFileTracingIncludes` recommended approach
- [Next.js PR #75274: opengraph-image with Node.js runtime](https://github.com/vercel/next.js/pull/75274) — merged Jan 2025, confirms canonical pattern
- [Apple Developer TN3156 — Rich Previews for Messages](https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages)
- [Twitter/X Summary Card with Large Image docs](https://developer.x.com/en/docs/x-for-websites/cards/overview/summary-card-with-large-image)
- [Slack — Unfurling Links in Messages](https://api.slack.com/reference/messaging/link-unfurling)

### Secondary (MEDIUM confidence)
- [GitHub discussion #64683: opengraph-image only working locally](https://github.com/vercel/next.js/discussions/64683) — ENOENT in `/var/task/` confirmed (community-sourced)
- [GitHub issue #77498: process.cwd() in opengraph-image](https://github.com/vercel/next.js/issues/77498) — NFT tracing failure (GitHub issue)
- Project commit history: `6ae1cf9`, `a81db16`, `9a50178`, `7566d29` — actual failure sequence from this codebase

---
*Research completed: 2026-02-25*
*Ready for roadmap: yes*
