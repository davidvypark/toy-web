---
phase: 01-fix-and-deploy
plan: 01
subsystem: infra
tags: [next.js, satori, og-images, fonts, ttf, vercel, node-fs]

# Dependency graph
requires: []
provides:
  - TTF fonts (DMSerifDisplay-Regular.ttf, Geist-Regular.ttf) in public/fonts/
  - Async font loading via node:fs/promises readFile in lib/og-utils.ts
  - outputFileTracingIncludes in next.config.ts for both OG routes
  - Both OG image routes updated to await async getOgFonts()
affects: [vercel-deployment, og-images, card-route, watch-route]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Satori font loading: use TTF not WOFF2; load via async readFile from node:fs/promises"
    - "Vercel font bundling: outputFileTracingIncludes required for fonts used in Edge/Node OG routes"

key-files:
  created:
    - public/fonts/DMSerifDisplay-Regular.ttf
    - public/fonts/Geist-Regular.ttf
  modified:
    - lib/og-utils.ts
    - next.config.ts
    - app/card/[slug]/opengraph-image.tsx
    - app/watch/[token]/opengraph-image.tsx

key-decisions:
  - "TTF over WOFF2: Satori (used by next/og) only supports TTF/OTF — WOFF2 causes silent font fallback or errors"
  - "Async readFile over readFileSync: serverless functions benefit from non-blocking I/O; no module-level cache needed"
  - "Fonts sourced from Google Fonts CDN (fonts.gstatic.com) since geist npm package not in project dependencies"

patterns-established:
  - "OG font loading pattern: async getOgFonts() with Promise.all for parallel reads, Buffer as unknown as ArrayBuffer cast"
  - "Vercel tracing pattern: outputFileTracingIncludes maps route keys to font glob patterns"

requirements-completed: [OG-01, OG-02, OG-03]

# Metrics
duration: 3min
completed: 2026-02-25
---

# Phase 1 Plan 01: Fix OG Image Font Loading Summary

**TTF font replacement + async readFile + outputFileTracingIncludes fixes broken Satori font rendering on Vercel for both OG image routes**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-25T10:53:11Z
- **Completed:** 2026-02-25T10:55:56Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Downloaded valid TrueType fonts (DM Serif Display 69KB, Geist 65KB) from Google Fonts CDN to replace broken WOFF2 files
- Rewrote lib/og-utils.ts: async getOgFonts() using node:fs/promises readFile with .ttf extensions; removed module-level cache; async staticOgFallback()
- Added outputFileTracingIncludes to next.config.ts for /card/[slug] and /watch/[token] routes ensuring fonts are bundled on Vercel
- Updated both OG image routes to await async getOgFonts() and staticOgFallback()
- npm run build passes clean — no TypeScript errors, no font-related warnings

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace WOFF2 fonts with TTF and fix og-utils.ts + next.config.ts** - `b96be08` (feat)
2. **Task 2: Update OG image route callers to await async getOgFonts and build-verify** - `df8a9cb` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `public/fonts/DMSerifDisplay-Regular.ttf` - DM Serif Display Regular in TTF format (Satori-compatible, 69KB)
- `public/fonts/Geist-Regular.ttf` - Geist Sans Regular in TTF format (Satori-compatible, 65KB)
- `lib/og-utils.ts` - Async getOgFonts() using node:fs/promises; async staticOgFallback(); TTF extensions; no module cache
- `next.config.ts` - outputFileTracingIncludes for /card/[slug] and /watch/[token] routes
- `app/card/[slug]/opengraph-image.tsx` - await getOgFonts() and await staticOgFallback()
- `app/watch/[token]/opengraph-image.tsx` - await getOgFonts() and await staticOgFallback()

## Decisions Made
- Sourced TTF fonts from Google Fonts CDN (fonts.gstatic.com) since geist npm package not in project dependencies; DM Serif Display fetched via CSS API URL discovery
- Removed fontsCache module-level variable — no benefit in serverless context (cold starts get fresh function instance anyway)
- Used `Buffer as unknown as ArrayBuffer` cast instead of `.buffer` accessor to avoid detached ArrayBuffer edge case

## Deviations from Plan

None - plan executed exactly as written. Font download used the Google Fonts CDN fallback path (GitHub raw URL returned HTML redirect), which was anticipated in the plan's fallback instructions.

## Issues Encountered
- DM Serif Display GitHub raw URL (`github.com/googlefonts/dm-serif-display`) returned HTML instead of binary — used Google Fonts CDN URL discovered via CSS API (`fonts.gstatic.com`) as planned fallback

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- OG image routes ready for Vercel deployment — fonts are TTF, async, and properly bundled
- Both `/card/[slug]/opengraph-image` and `/watch/[token]/opengraph-image` compile and build correctly
- Phase 2 (cross-platform QA) can proceed after this is deployed and verified on Vercel

---
*Phase: 01-fix-and-deploy*
*Completed: 2026-02-25*
