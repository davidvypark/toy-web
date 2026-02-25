# Roadmap: TOY Web

## Milestones

- 📋 **v1.1 Dynamic OG Images** - Phases 1-2 (in progress)

## Phases

### v1.1 Dynamic OG Images (In Progress)

**Milestone Goal:** Both card invite and watch links generate personalized OG images that render with brand fonts on Vercel and display correctly across all major sharing surfaces.

- [ ] **Phase 1: Fix and Deploy** - Fix font format, file tracing, and runtime config; confirm OG images work on Vercel
- [ ] **Phase 2: Cross-Platform QA** - Verify OG previews render correctly on iMessage, Slack, Twitter, Facebook, and WhatsApp

## Phase Details

### Phase 1: Fix and Deploy
**Goal**: Both OG image routes render personalized images with correct brand fonts on a live Vercel deployment
**Depends on**: Nothing (first phase)
**Requirements**: OG-01, OG-02, OG-03
**Success Criteria** (what must be TRUE):
  1. Hitting `/card/[slug]/opengraph-image` on the Vercel deployment returns a 200 PNG with DM Serif Display and Geist Sans text
  2. Hitting `/watch/[token]/opengraph-image` on the Vercel deployment returns a 200 PNG with contributor avatars and brand fonts
  3. Vercel function logs show no ENOENT or wOF2 font errors for either route
  4. Local `npm run build` completes without error and both OG routes render correctly at `localhost`
**Plans:** 1 plan
Plans:
- [ ] 01-01-PLAN.md — Fix font format (TTF), async loading, outputFileTracingIncludes, and update callers

### Phase 2: Cross-Platform QA
**Goal**: OG image previews display correctly on every sharing surface the app targets
**Depends on**: Phase 1
**Requirements**: OG-04
**Success Criteria** (what must be TRUE):
  1. Facebook Sharing Debugger shows correct OG image for both `/card/[slug]` and `/watch/[token]` URLs
  2. Twitter Card Validator shows a `summary_large_image` card with the correct image for both routes
  3. iMessage displays a rich link preview with the OG image when a card or watch URL is shared on device
  4. Slack unfurls the link with the correct image when a card or watch URL is pasted in a channel
  5. WhatsApp shows the OG image preview when a card or watch URL is shared
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Fix and Deploy | v1.1 | 0/1 | Not started | - |
| 2. Cross-Platform QA | v1.1 | 0/? | Not started | - |
