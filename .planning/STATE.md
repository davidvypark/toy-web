# State

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Milestone v1.1 started — needs research, then requirements and roadmap
Last activity: 2025-02-25 — Milestone v1.1 Dynamic OG Images started

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-25)

**Core value:** People receiving a TOY link should have a beautiful, personal experience
**Current focus:** Dynamic OG images for /card and /watch routes

## Accumulated Context

- Previous OG image attempts failed on Vercel — fonts not loading, Satori fallback rendering
- Tried: Google Fonts runtime fetch (regex failed), import.meta.url (Turbopack incompatible), readFileSync from assets/ (not traced by Vercel NFT)
- Fonts moved to public/fonts/ as latest attempt — needs verification
- Existing code: opengraph-image.tsx files exist for both routes, lib/og-utils.ts, lib/card-data.ts, lib/watch-data.ts
- User wants systematic research before more implementation attempts

## Next Step

Research phase — run `/gsd:new-milestone` to continue from research step, or `/gsd:resume-work`
