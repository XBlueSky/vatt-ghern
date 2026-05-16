# vatt-ghern — design system

Mirrors kaer-morhen's design system (Anthropic-aligned editorial). This
doc covers vatt-ghern's specifics; for the deep design rationale, see
kaer-morhen's DESIGN.md.

## Color (OKLCH, dual-theme)

See `src/static/site.css` for token values. Same hues as kaer-morhen:
warm neutrals (65–80), terracotta accent (38), ink-deep blue (245),
sage green (150). Only lightness swaps between light and dark.

## Theme system

`<html data-theme="light|dark">` set pre-paint by inline script reading
`localStorage["vg-theme"]` or `prefers-color-scheme`. Toggle button in
nav.

## Typography

| Role | Family |
|---|---|
| Body Latin | Spectral |
| Body CJK | LXGW WenKai TC (霞鶩文楷) |
| Display | EB Garamond |
| Scribed | IM Fell English Italic |
| Sans (labels/nav) | Manrope |
| Code | JetBrains Mono |

## Wordmark

`vatt'ghern` (display) + `jaskier's ballads` (scribed italic, ink-deep).
Mirrors kaer-morhen's `vatt'ghern's archive`: the fortress + the poet's
archive there; the witcher + the poet's ballads here.

## Sigil

Phase 1: reuses km wolf medallion as placeholder. Future: dedicated
witcher sigil. Build pipeline: `scripts/build-sigil.mjs` produces
`vg-sigil-{80,160,320,640}.webp` from `vg-sigil.png`.

## Punctuation

- CJK 雙破折號 `——` allowed (zh-Hant first override of brand.md).
- Latin single em-dash `—` **banned in site prose** (use `：`, `，`,
  `；`, or `（…）`). Engineering docs, code comments, and READMEs are
  exempt.

## Read-tracking

Per-post and per-roundup-item read state in `localStorage["vg-read"]`.
Auto-mark on scroll-to-bottom + ≥5s dwell. Manual toggle on each post.
Footer "重置已閱狀態" clears all.

Implementation: `src/static/read-tracker.js`.

## Layout

- `--col-narrow: min(64ch, 100% - 2 * var(--gutter))` for prose.
- `--col-wide: min(78ch, ...)` for listings.
- Main: `min(1080px, ...)` so bespoke posts can stretch.

## Components

- Site header: sigil + double-line wordmark + nav (`今日 · 歷史 · 主題 · 標籤 · feed · theme`).
- Site footer: one-line metadata + "重置已閱狀態" link.
- Roundup card: large `#NN` numeral + title + lede + meta.
- Deep-story card: top hairline + title + lede.
- Post-trail: chrome strip with topic crumb, date, tags, read-toggle.
- Share buttons: copy link + Twitter + Threads, IM Fell italic text links.
