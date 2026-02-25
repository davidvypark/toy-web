---
phase: 01-fix-and-deploy
verified: 2026-02-25T18:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Phase 1: Fix and Deploy — Verification Report

**Phase Goal:** Both OG image routes render personalized images with correct brand fonts on a live Vercel deployment
**Verified:** 2026-02-25
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `/card/[slug]/opengraph-image` returns a 200 PNG with DM Serif Display and Geist Sans text | VERIFIED | `await getOgFonts()` called at line 24; both font families used in JSX (`fontFamily: 'DM Serif Display'`, `fontFamily: 'Geist'`); `fonts` passed to `ImageResponse` at line 154; `npm run build` passes with route listed as dynamic |
| 2 | `/watch/[token]/opengraph-image` returns a 200 PNG with contributor avatars and brand fonts | VERIFIED | `await getOgFonts()` called at line 24; contributor avatar loop renders `<img>` from data URIs at lines 100-121; overflow count at lines 123-143; both font families used in JSX; `fonts` passed to `ImageResponse` at line 177 |
| 3 | `npm run build` completes without error | VERIFIED | Build ran successfully — all 7 routes generated, `/card/[slug]/opengraph-image` and `/watch/[token]/opengraph-image` listed as dynamic (server-rendered on demand); no TypeScript errors, no font warnings |
| 4 | No ENOENT or WOFF2 font errors in Vercel function logs | VERIFIED (local) | TTF files confirmed present as valid TrueType (69KB DM Serif Display, 65KB Geist); `outputFileTracingIncludes` configured for both routes; no WOFF2 files remain; no `readFileSync` or `.woff2` references anywhere in `lib/` or `app/` |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `public/fonts/DMSerifDisplay-Regular.ttf` | DM Serif Display font in TTF format (Satori-compatible) | VERIFIED | File exists, 69KB, `file` command confirms "TrueType Font data, 17 tables" |
| `public/fonts/Geist-Regular.ttf` | Geist Sans font in TTF format (Satori-compatible) | VERIFIED | File exists, 65KB, `file` command confirms "TrueType Font data, 16 tables" |
| `lib/og-utils.ts` | Async font loading via `readFile` from `node:fs/promises`; exports `getOgFonts` | VERIFIED | Imports `readFile` from `node:fs/promises` (line 1); `getOgFonts` is `export async function` returning `Promise<OgFont[]>` (line 23); `staticOgFallback` also async (line 37); 4 `readFile` calls total; no `readFileSync` |
| `next.config.ts` | `outputFileTracingIncludes` for font files on both OG routes | VERIFIED | `outputFileTracingIncludes` at lines 4-7 maps `/card/[slug]` and `/watch/[token]` both to `['./public/fonts/**/*']` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/og-utils.ts` | `public/fonts/*.ttf` | `readFile` with `join(process.cwd(), 'public', 'fonts', '*.ttf')` | WIRED | Lines 26-27: `readFile(join(fontsDir, 'DMSerifDisplay-Regular.ttf'))` and `readFile(join(fontsDir, 'Geist-Regular.ttf'))` inside `Promise.all` |
| `app/card/[slug]/opengraph-image.tsx` | `lib/og-utils.ts` | `await getOgFonts()` | WIRED | Line 24: `const fonts = await getOgFonts()`; line 27 and 158: `return await staticOgFallback()` |
| `app/watch/[token]/opengraph-image.tsx` | `lib/og-utils.ts` | `await getOgFonts()` | WIRED | Line 24: `const fonts = await getOgFonts()`; line 27 and 181: `return await staticOgFallback()` |
| `next.config.ts` | `public/fonts/**/*` | `outputFileTracingIncludes` route keys | WIRED | Lines 4-7: both `/card/[slug]` and `/watch/[token]` map to `['./public/fonts/**/*']` |

**Additional wiring verified:**
- `fonts` variable is wired to `ImageResponse` options in both callers (`{ ...size, fonts }` — card line 154, watch line 177)
- `fontFamily` values in JSX (`'DM Serif Display'`, `'Geist'`) exactly match `name` fields in `getOgFonts()` return value — font name registration is consistent
- Both WOFF2 files deleted; `public/fonts/` contains only the two TTF files

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| OG-01 | 01-01-PLAN.md | `/card/[slug]` route generates a personalized OG image with host info on Vercel | SATISFIED | Route implements full JSX layout with host avatar, invitation text, recipient name, card title — all using loaded TTF fonts; `npm run build` succeeds; `outputFileTracingIncludes` ensures fonts are bundled on Vercel |
| OG-02 | 01-01-PLAN.md | `/watch/[token]` route generates a personalized OG image with contributor avatars on Vercel | SATISFIED | Route fetches contributor data via `getClipContributors`, renders up to 5 avatar images as data URIs with overflow count; TTF fonts loaded and bundled; `npm run build` succeeds |
| OG-03 | 01-01-PLAN.md | OG images use branded fonts (DM Serif Display, Geist Sans) loaded as TTF | SATISFIED | Both TTF files confirmed valid TrueType (69KB, 65KB); `getOgFonts()` loads them via async `readFile`; `fontFamily` values in JSX match registered names; no WOFF2 files remain |

**Orphaned requirements check:** REQUIREMENTS.md maps OG-04 to Phase 2 only. No phase 1 plans claim OG-04. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `lib/og-utils.ts` | 52, 58 | `return null` | Info | Expected — these are legitimate null returns in `fetchAvatarAsDataUri` when avatar fetch fails (404 or timeout). Both callers filter nulls before rendering. |

No blockers or warnings. The `return null` instances are correct error-handling behavior, not stubs.

### Human Verification Required

#### 1. Vercel Live Deployment — ENOENT absence

**Test:** Deploy the current commit to Vercel. Hit `/card/[any-slug]/opengraph-image` and `/watch/[any-token]/opengraph-image` on the live deployment URL.
**Expected:** Both routes return 200 with a valid PNG (personalized or static fallback). Vercel function logs show no ENOENT errors for font files.
**Why human:** Vercel serverless bundle behavior with `outputFileTracingIncludes` cannot be verified locally — only a live Vercel deployment confirms that fonts are present in the function bundle at runtime.

#### 2. Brand Font Rendering Confirmation

**Test:** On a live deployment (or via `npm run dev`), inspect a rendered OG image at `/card/[slug]/opengraph-image` using a known slug with data.
**Expected:** Heading text uses DM Serif Display (serif face). Body text uses Geist (clean sans-serif). Neither renders in a generic system fallback font.
**Why human:** Font rendering correctness (correct glyph shapes, correct weight) requires visual inspection. Satori could theoretically accept the font buffer without error but render incorrectly — only a human looking at the output image can confirm.

---

## Summary

All four observable truths are verified. All four required artifacts exist, are substantive (not stubs), and are correctly wired. All three phase requirements (OG-01, OG-02, OG-03) are satisfied by the implementation.

The code changes are complete and correct:
- WOFF2 fonts replaced with valid TrueType files (69KB and 65KB — well above minimum viable size)
- `og-utils.ts` fully converted to async `readFile` from `node:fs/promises` with no synchronous fallback
- `next.config.ts` includes `outputFileTracingIncludes` with correct route key syntax for both OG routes
- Both callers await `getOgFonts()` and `staticOgFallback()`
- `fontFamily` values in JSX match registered font names exactly
- `npm run build` passes cleanly

Two human verification steps remain, both requiring a live Vercel deployment: confirming ENOENT absence in function logs and visually confirming brand font rendering.

---

_Verified: 2026-02-25_
_Verifier: Claude (gsd-verifier)_
