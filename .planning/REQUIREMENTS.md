# Requirements: TOY Web

**Defined:** 2026-02-25
**Core Value:** People receiving a TOY link should have a beautiful, personal experience

## v1.1 Requirements

Requirements for milestone v1.1 — Dynamic OG Images. Each maps to roadmap phases.

### OG Image Reliability

- [ ] **OG-01**: `/card/[slug]` route generates a personalized OG image with host info on Vercel
- [ ] **OG-02**: `/watch/[token]` route generates a personalized OG image with contributor avatars on Vercel
- [ ] **OG-03**: OG images use branded fonts (DM Serif Display, Geist Sans) loaded as TTF
- [ ] **OG-04**: OG images render correctly when shared on iMessage, Slack, Twitter, Facebook, and WhatsApp

## Future Requirements

### OG Image Enhancements

- **OG-05**: OG images display occasion-aware copy (e.g., "Join Sarah's birthday card")
- **OG-06**: Coral accent applied to recipient name for visual hierarchy

## Out of Scope

| Feature | Reason |
|---------|--------|
| Video thumbnails as OG backgrounds | Supabase signed URLs expire (1hr TTL) before platforms re-fetch cached images |
| Square 1200x1200 iMessage variant | Extra route complexity; 1200x630 works universally across all platforms |
| Animated GIF OG images | Not reliably supported by iMessage, Twitter, Slack |
| Web-based clip recording | iOS app handles this |
| User authentication on web | Read-only viewer |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| OG-01 | Phase 1 | Pending |
| OG-02 | Phase 1 | Pending |
| OG-03 | Phase 1 | Pending |
| OG-04 | Phase 2 | Pending |

**Coverage:**
- v1.1 requirements: 4 total
- Mapped to phases: 4
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-25*
*Last updated: 2026-02-25 after roadmap creation*
