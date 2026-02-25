# TOY Web Viewer

## What This Is

Web companion to the TOY (Thinking Of You) iOS app. Recipients open links to view group video greeting cards. Contributors open links to record clips for cards. Built with Next.js 16, Tailwind v4, Supabase.

## Core Value

People receiving a TOY link should have a beautiful, personal experience — from the link preview to the video playback.

## Requirements

### Validated

- ✓ Video viewer with sequential clip playback and contributor overlays — v1.0
- ✓ Card invite page with App Clip support and in-app browser detection — v1.0
- ✓ Social sharing buttons (Web Share API, Twitter, Facebook, WhatsApp, clipboard) — v1.0
- ✓ Marketing home page with App Store CTA — v1.0
- ✓ Privacy, Terms, Contact pages — v1.0
- ✓ Custom brand design system (warm palette, DM Serif Display headings, noise texture) — v1.0

### Active

- [ ] Dynamic OG image for `/card/[slug]` — personalized invite preview with host info
- [ ] Dynamic OG image for `/watch/[token]` — card preview with participant avatars

### Out of Scope

- Web-based clip recording — iOS app handles this
- User authentication on web — read-only viewer
- Real-time features — not needed for viewing

## Context

The app has two key link-sharing flows:
1. **Card invite** (`/card/[slug]`) — Host shares link to invite contributors to record clips
2. **Watch** (`/watch/[token]`) — Recipient receives link to watch their completed card

Both flows are shared via iMessage, Slack, social media etc. The link preview (OG image) is the first thing people see — it needs to feel personal and beautiful, not generic.

Previous attempts at dynamic OG images using `next/og` ImageResponse (Satori) failed on Vercel due to font loading issues. Need proper research into reliable patterns.

## Constraints

- **Tech stack**: Next.js 16 App Router, must work on Vercel serverless
- **Fonts**: DM Serif Display for "Thinking of You" branding and card names, Geist Sans for body
- **Data**: All card/clip/profile data from Supabase (server-side, service role key)
- **Image size**: 1200x630 standard OG dimensions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js opengraph-image.tsx convention | Auto-generates og:image meta tags | ⚠️ Revisit — font loading failed on Vercel |
| Satori/ImageResponse for rendering | Standard Next.js OG image approach | ⚠️ Revisit — needs research on reliable font loading |

---
*Last updated: 2025-02-25 after milestone v1.1 started*
