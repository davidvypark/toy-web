# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** People receiving a TOY link should have a beautiful, personal experience — from the link preview to the video playback.
**Current focus:** Phase 1 — Fix and Deploy

## Current Position

Phase: 1 of 2 (Fix and Deploy)
Plan: 1 of 1 in current phase
Status: Phase 1 complete
Last activity: 2026-02-25 — Completed 01-01-PLAN.md (OG font fix)

Progress: [██████████] 100% (Phase 1 complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 3min
- Total execution time: 3min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-fix-and-deploy | 1 | 3min | 3min |

**Recent Trend:**
- Last 5 plans: 3min
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-phase]: Root causes confirmed — WOFF2 unsupported by Satori; `outputFileTracingIncludes` missing from next.config.ts. Fix is surgical: replace fonts with TTF, add tracing config, switch to async readFile, export `runtime = 'nodejs'`.
- [Pre-phase]: Deployment validation folded into Phase 1 success criteria (not a separate code phase) — cross-platform QA is Phase 2.
- [Phase 01-fix-and-deploy]: TTF over WOFF2: Satori only supports TTF/OTF for OG image font rendering on Vercel
- [Phase 01-fix-and-deploy]: outputFileTracingIncludes required in next.config.ts for fonts to be bundled in Vercel serverless functions

### Pending Todos

None yet.

### Blockers/Concerns

- iMessage caches OG images at the device level with no programmatic invalidation. Must get Phase 1 correct before sharing any real card URLs publicly, or platform caches will hold broken images.

## Session Continuity

Last session: 2026-02-25
Stopped at: Completed 01-fix-and-deploy 01-01-PLAN.md
Resume file: None
