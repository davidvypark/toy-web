# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## TOY Web Viewer

Video viewer web app for TOY (Thinking Of You) - the companion to the iOS app.

Recipients open links like `sendtoycard.com/watch/{shareToken}` to view their video greeting.

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- Supabase (server-side client with service role key)

## Commands

```bash
npm run dev      # Development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:
- `SUPABASE_URL` - From Supabase dashboard
- `SUPABASE_SERVICE_KEY` - Service role key (not anon key)

## Key Files

- `app/watch/[token]/page.tsx` - Video viewer page (server component)
- `components/VideoPlayer.tsx` - Auto-play video with TOY branding
- `components/ShareButtons.tsx` - Social sharing
- `lib/supabase.ts` - Server-side Supabase client

## Architecture

### Data Flow
1. iOS app creates cards and uploads videos to Supabase Storage (`videos` bucket)
2. Card metadata stored in `cards` table with `share_token` for public access
3. Web app fetches published cards by token and generates signed URLs for video playback

### Design System
Custom brand colors defined in `app/globals.css` using CSS variables:
- `toy-primary` (#E8735A) - Coral accent color
- `toy-background` (#FFFBF5) - Warm white background
- Use `bg-toy-*`, `text-toy-*` Tailwind utilities

Fonts: Geist Sans (body), DM Serif Display (headings)

### Path Aliases
`@/*` maps to project root (e.g., `@/lib/supabase`, `@/components/VideoPlayer`)

## Deployment

Deploy to Vercel. Set environment variables in Vercel dashboard.
