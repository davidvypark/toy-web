# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** People receiving a TOY link should have a beautiful, personal experience — from the link preview to the video playback.
**Current focus:** Phase 1 — Fix and Deploy

## Current Position

Phase: 1 of 2 (Fix and Deploy)
Plan: 0 of ? in current phase
Status: Ready to plan
Last activity: 2026-02-25 — Roadmap created for milestone v1.1 Dynamic OG Images

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-phase]: Root causes confirmed — WOFF2 unsupported by Satori; `outputFileTracingIncludes` missing from next.config.ts. Fix is surgical: replace fonts with TTF, add tracing config, switch to async readFile, export `runtime = 'nodejs'`.
- [Pre-phase]: Deployment validation folded into Phase 1 success criteria (not a separate code phase) — cross-platform QA is Phase 2.

### Pending Todos

None yet.

### Blockers/Concerns

- iMessage caches OG images at the device level with no programmatic invalidation. Must get Phase 1 correct before sharing any real card URLs publicly, or platform caches will hold broken images.

## Session Continuity

Last session: 2026-02-25
Stopped at: Roadmap created. Ready to plan Phase 1.
Resume file: None
