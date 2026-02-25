# Feature Research

**Domain:** Dynamic OG image generation for social sharing — greeting card / video sharing context
**Researched:** 2026-02-25
**Confidence:** HIGH (platform specs from official docs + multiple verified sources; content recommendations from domain analysis)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = link previews feel generic, broken, or spammy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Recipient name in image | The link is about a specific person — a generic image removes the personal signal entirely | LOW | Already in Supabase: `cards.recipient_name`. Present in both card and watch flows. |
| Card title displayed | Users sharing the link expect the card's theme/occasion to be visible so recipients know what to expect | LOW | Already in Supabase: `cards.title`. Present in both flows. |
| 1200x630 dimensions | Every major platform (Facebook, Twitter/X, Slack, Discord, iMessage, WhatsApp) uses this as the baseline | LOW | Already implemented in `OG_SIZE` constant. |
| Static fallback for missing data | If Supabase returns null, platforms should not show a broken image or blank preview | LOW | Already implemented via `staticOgFallback()`. |
| Fast generation under 3 seconds | iMessage, Slack, WhatsApp all have tight fetch timeouts; slow images show blank previews | MEDIUM | Network IO (Supabase + avatar fetch) is the bottleneck, not render time. |
| PNG format output | Platforms with text/logos render PNG sharper than JPEG; SVG and GIF unsupported for OG | LOW | Already implemented (`contentType = 'image/png'`). |
| Brand identity (name, colors) | Unbranded images look like spam; "Thinking of You" wordmark signals legitimacy | LOW | Already implemented: wordmark bottom-right, warm palette. |
| Absolute image URL in meta tags | Twitter/X and WhatsApp require absolute URLs; relative URLs are silently ignored | LOW | Next.js `opengraph-image.tsx` convention produces absolute URLs automatically. |
| OG meta tags in initial HTML | WhatsApp and Slack don't execute JS; tags must be server-rendered in `<head>` | LOW | Next.js App Router server components handle this. Already done. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable — directly serves the core value of "a beautiful, personal experience from the link preview."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Host avatar on card invite image | Seeing a familiar face (the person who sent the invite) dramatically increases trust and response rate for `/card/[slug]` links | MEDIUM | Host avatar is already fetched from Supabase `avatars` bucket. Data dependency satisfied. Implemented in current `CardOgImage`. |
| Contributor avatar stack on watch image | Shows the recipient "N people made this for you" before they even open the link — emotional hook that drives opens | MEDIUM | `getClipContributors()` already exists. Up to 5 avatars + overflow count. Implemented in current `WatchOgImage`. |
| Overlapping avatar stack treatment | Industry-standard visual pattern (GitHub, Slack, Facepile) that communicates "group effort" at a glance | LOW | Negative margin overlap already implemented in `WatchOgImage`. |
| Warm brand palette (#FDF8F3 background, coral accent) | Warm, human feel vs. stark white/black previews; signals the product is emotionally considered | LOW | `OG_COLORS` already defined. |
| DM Serif Display for headings | Conveys warmth and occasion vs. generic sans-serif; consistent with in-app experience | LOW | Font bundled locally in `public/fonts/`. Already used. |
| Letter-initial avatar fallback | When host has no avatar, a tasteful monogram circle prevents empty space and still personalizes | LOW | Already implemented in `CardOgImage` with initial from `hostName`. |
| Occasion-aware copy ("birthday card", "graduation card") | If `cards.occasion` is populated, headline copy can be more specific than the generic card title | MEDIUM | `cards.occasion` field exists in `Card` interface but is not yet used in OG images. Low-hanging fruit. |
| "+N people" overflow on avatar stack | Communicates scale ("12 people made this!") even when not all avatars can be shown | LOW | Already implemented in `WatchOgImage` via `remainingCount`. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Video thumbnail as OG image background | "Show a frame from the actual video" seems maximally personal | Video thumbnails from Supabase are signed URLs with short expiry (1 hour). OG images are aggressively cached by platforms for days to weeks. The signed URL will be expired before most platforms re-fetch it — results in broken images on second share. WhatsApp caches for several days; iMessage caches on device until OS update. | Use static colored background with avatars and text. If a persistent public thumbnail URL becomes available later, reconsider. |
| Animated GIF OG image | "Movement grabs attention" | iMessage explicitly does not display animated GIFs in OG position. Twitter/X, WhatsApp, and Slack do not reliably animate OG GIFs. | Static PNG with strong visual hierarchy. |
| Real-time contributor count | "Show how many people have joined since the link was shared" | OG images are cached by platforms for hours to days. A "real-time" count will be stale the moment it's cached. Cache-busting via query params is fragile and breaks platform caching entirely. | Show the count as of image generation time. The `revalidate = 3600` is an appropriate balance. |
| Full contributor name list as text | "List everyone who contributed" | At 5+ contributors, names overflow the image. Small text fails at thumbnail size. Text truncation looks broken. | Avatar stack with overflow count is the right signal. Names appear in the video player itself. |
| Custom colors per card/occasion | "Birthday cards in blue, sympathy cards in grey" | Requires occasion-to-color mapping logic, increases visual inconsistency across shares, and adds maintenance burden. No data shows this improves engagement. | Single warm brand palette applied consistently. Brand recognition is more valuable than per-occasion theming. |
| Twitter Card "player" type for video | "Embed the video directly in the tweet" | Twitter player cards require HTTPS video streams and significant whitelist approval. The video URLs are signed and expire. Not feasible for this architecture. | `summary_large_image` with a compelling OG image + clear title. Already implemented in watch page metadata. |

---

## Feature Dependencies

```
[Recipient name displayed]
    └──requires──> [cards.recipient_name in Supabase query]  (satisfied)

[Card title displayed]
    └──requires──> [cards.title in Supabase query]  (satisfied)

[Host avatar on invite image]
    └──requires──> [profiles.avatar_url query]  (satisfied)
                       └──requires──> [Supabase signed URL generation]  (satisfied)
                                          └──requires──> [fetchAvatarAsDataUri conversion]  (satisfied)

[Contributor avatar stack on watch image]
    └──requires──> [getClipContributors() query]  (satisfied)
                       └──requires──> [fetchAvatarAsDataUri for each avatar]  (satisfied)

[Letter-initial fallback]
    └──requires──> [hostName not null]  (handled gracefully — null shows nothing)

[Occasion-aware copy]
    └──requires──> [cards.occasion field included in getCardInfo() select]  (NOT YET — only title, recipient_name, host_id selected)
```

### Dependency Notes

- **Occasion-aware copy requires schema change in getCardInfo():** The `cards.occasion` field exists in the Card type but `getCardInfo()` does not SELECT it. Adding it to the query is a one-line change, low risk.
- **Avatar data URI conversion is the main performance dependency:** Each avatar fetch adds 100-3000ms latency. Up to 5 avatars on watch image = up to 5 parallel fetches. The `Promise.all` pattern already used is correct. The 3s timeout per avatar is the right default.
- **Font loading is a hard dependency for ImageResponse:** Fonts must be available as `ArrayBuffer` before `ImageResponse` is called. Current implementation reads from `public/fonts/` via `readFileSync` which works on Vercel (files in `public/` are included in deployment). This was the previous failure point — the current bundled-font approach resolves it.

---

## MVP Definition

### Launch With (v1 — this milestone)

The images are already substantially implemented. The milestone is about ensuring they work reliably on Vercel and cover both routes.

- [x] `/card/[slug]` OG image: host avatar (or initial), invite copy, recipient name, card title, branding
- [x] `/watch/[token]` OG image: card title, recipient name, contributor avatar stack, people count, branding
- [x] Static PNG fallback when Supabase returns no data
- [x] Font loading from `public/fonts/` (bundled, not fetched at runtime)
- [ ] Verify both images render correctly on Vercel (the previous failure point)
- [ ] Validate rendering in iMessage, Slack, and Twitter via debugger tools

### Add After Validation (v1.x)

- [ ] Occasion-aware copy — add `cards.occasion` to `getCardInfo()` select; if present, use "Join [Name]'s [occasion] card for [recipient]" instead of generic text. Low effort, higher personalization.
- [ ] Coral accent color applied to recipient name or CTA text — currently all text is neutral. The `toy-primary` (#E8735A) coral would make the recipient's name pop visually.

### Future Consideration (v2+)

- [ ] Persistent public thumbnail as background — only feasible if clip thumbnails are stored as public (non-signed) URLs. Requires architectural change in how thumbnails are stored.
- [ ] Multiple aspect ratios — 1:1 for iMessage rich previews, 1.91:1 for all others. iMessage specifically recommends 1200x1200. Would require two separate image routes per page.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Recipient name in image | HIGH | LOW | P1 |
| Card title displayed | HIGH | LOW | P1 |
| Host avatar on invite | HIGH | LOW (already built) | P1 |
| Contributor avatar stack on watch | HIGH | LOW (already built) | P1 |
| Fast generation under 3s | HIGH | MEDIUM (IO-bound) | P1 |
| Static fallback | HIGH | LOW (already built) | P1 |
| Brand palette + typography | MEDIUM | LOW (already built) | P1 |
| Letter-initial fallback | MEDIUM | LOW (already built) | P1 |
| Occasion-aware copy | MEDIUM | LOW (one query field) | P2 |
| Coral accent on recipient name | LOW | LOW | P2 |
| 1:1 square variant for iMessage | LOW | MEDIUM (second route) | P3 |
| Persistent thumbnail background | HIGH | HIGH (requires arch change) | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Platform-Specific Considerations

### iMessage
- **Dimensions:** 1200x630 acceptable; 1200x1200 square is preferred by Apple for fullscreen rich previews. Current 1200x630 will work but may letterbox.
- **Caching:** Device-level cache; persists until OS update or manual clear. No cache-busting mechanism available. Implication: get it right the first time.
- **Timeout:** Tight — if the image takes more than ~2-3 seconds to load, iMessage shows no preview. Avatar fetch latency is the primary risk.
- **Tags used:** Only `og:title` and `og:image`. Description is ignored. Title is clipped at ~44 characters.

### Slack
- **Dimensions:** 1200x630 standard. Slack crops images to fit its unfurl card format — keep important content centered and not at extreme edges.
- **HTML size limit:** 32kB fetch limit. Next.js server-rendered `<head>` with OG tags is within this. No risk for this stack.
- **Caching:** Workspace-level; can be manually invalidated by pasting the link and triggering re-unfurl. Less aggressive than iMessage.
- **Tags used:** `og:title`, `og:description`, `og:image`. Description appears below title in the unfurl.

### Twitter / X
- **Dimensions:** 1200x675 ideal; 1200x630 acceptable (aspect ratio 1.91:1 in both cases, rendering difference is negligible).
- **Card type:** `twitter:card: summary_large_image` already set in watch page metadata. Card page should also have this.
- **Caching:** Platform-level; use Twitter Card Validator to force re-fetch during development.
- **Tags used:** `twitter:title`, `twitter:description`, `twitter:image`. Falls back to OG tags if Twitter-specific tags absent. Both are set.

### Facebook / Meta
- **Dimensions:** 1200x630 required.
- **Caching:** Use Facebook Sharing Debugger to scrape and clear cache.
- **Tags used:** Full OG tag set. `og:type: video.other` on watch page is appropriate.
- **Crawling:** Facebook crawler does not execute JavaScript. Server-rendered tags required. Next.js handles this.

### WhatsApp
- **Dimensions:** 1200x630 works. Images below 100px wide will not display.
- **File size:** Must be under 300KB. A 1200x630 PNG with flat colors and text is typically 40-80KB — well within limit.
- **Caching:** Aggressive, days to weeks. No official cache-clearing mechanism. Changing the URL (adding a query param) forces a fresh fetch but creates a different share URL.
- **Crawling:** Shares infrastructure with Facebook. No JavaScript execution. Server-rendered tags required.
- **Tags used:** `og:title`, `og:description`, `og:image`, `og:url`.

---

## Supabase Data Availability Summary

| Data Point | Route | Source | Status |
|------------|-------|--------|--------|
| Recipient name | Both | `cards.recipient_name` | Available |
| Card title | Both | `cards.title` | Available |
| Host name | `/card/[slug]` | `profiles.display_name` | Available |
| Host avatar | `/card/[slug]` | `profiles.avatar_url` (signed) | Available |
| Occasion | Both | `cards.occasion` | Available in schema, NOT in `getCardInfo()` select |
| Contributor names | `/watch/[token]` | `clips.contributor_name` + `profiles.display_name` | Available via `getClipContributors()` |
| Contributor avatars | `/watch/[token]` | `profiles.avatar_url` (signed) | Available via `getClipContributors()` |
| Total contributor count | `/watch/[token]` | Derived from `clips` query | Available |
| Video thumbnail | `/watch/[token]` | `clips.thumbnail_url` (signed, short TTL) | Available but NOT suitable for OG due to URL expiry |

---

## Sources

- [Apple Developer TN3156 — Rich Previews for Messages](https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages)
- [Apple Developer Archive — Best Practices for Link Previews in Messages](https://developer.apple.com/library/archive/technotes/tn2444/_index.html)
- [Twitter/X Summary Card with Large Image documentation](https://developer.x.com/en/docs/x-for-websites/cards/overview/summary-card-with-large-image)
- [Slack — Unfurling Links in Messages](https://api.slack.com/reference/messaging/link-unfurling)
- [Vercel — Introducing OG Image Generation](https://vercel.com/blog/introducing-vercel-og-image-generation-fast-dynamic-social-card-images)
- [Next.js — ImageResponse API Reference](https://nextjs.org/docs/app/api-reference/functions/image-response)
- [OG Image Size Guide 2026 — myogimage.com](https://myogimage.com/blog/og-image-size-meta-tags-complete-guide)
- [Open Graph Image Size 2026 — share-preview.com](https://share-preview.com/blog/open-graph-image-size.html)
- [WhatsApp Link Preview Requirements 2026](https://www.ogrilla.com/blog/whatsapp-link-preview-guide)
- [Slack Link Unfurling Debug Guide](https://blog.daveallie.com/slack-link-unfurling/)
- [Next.js OG Image Performance Discussion](https://github.com/vercel/next.js/discussions/72006)

---
*Feature research for: Dynamic OG images — TOY greeting card / video sharing web app*
*Researched: 2026-02-25*
