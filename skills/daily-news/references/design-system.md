# Design System — Skill-Facing Summary

Quick token / class reference for skill-authored HTML. Full design system
lives in `DESIGN.md` at repo root and `src/static/site.css`. This file is
the lean version to keep in the skill's working context.

## Color tokens (use as `var(--name)`)

| Token | Use |
|---|---|
| `--ink` | Primary text |
| `--ink-soft` | Secondary text |
| `--muted` | Metadata, dates, nav |
| `--muted-2` | Separators, decoration |
| `--bg` | Page surface |
| `--bg-soft` | Sunken panels, code blocks |
| `--line` | Hairlines |
| `--accent` | Terracotta — decoration, fills, accents, drop cap, SVG highlights |
| `--accent-text` | Terracotta for TEXT (higher contrast); use for links, headings |
| `--accent-hover` | Hover state for terracotta links |
| `--ink-deep` | Blue ink — wordmark subtitle, topic crumbs |
| `--sage` | Sage green — "see also", related panels |
| `--sage-deep` | Sage hover / stronger marks |

**Never** use `#hex` or `rgb()` for theme-relevant colors. Use tokens so the
dark-mode override works automatically. `currentColor` in inline SVG is the
preferred pattern for "follow text color".

## Font stacks

| CSS var | Family | Use |
|---|---|---|
| `--serif` | Spectral + LXGW WenKai TC | Body prose, post titles |
| `--display` | EB Garamond | Drop cap, dates, wordmark |
| `--scribed` | IM Fell English Italic | Ledes, subtitles, asides, take-away |
| `--sans` | Manrope | Nav, labels, small caps metadata |
| `--mono` | JetBrains Mono | `<code>` `<pre>` only |

In SVG `<text>`, use the family name explicitly (`font-family="EB Garamond, serif"`)
since SVG doesn't inherit CSS variables for font-family in all renderers.

## Spacing tokens

`--s-1` through `--s-6` (clamp-fluid). Reach for `--s-3` for default
paragraph gap, `--s-4` between sections, `--s-5` between major regions.

## Layout columns

| Var | Value | Use |
|---|---|---|
| `--col-narrow` | min(64ch, full-gutter) | Prose body |
| `--col-wide` | min(78ch, full-gutter) | Listings |

Bespoke posts (`.vg-main:has(.vg-post)`) get up to `min(1080px, full-gutter)`.

## Component classes (already defined in site.css)

| Class | What it is |
|---|---|
| `.vg-post-title` | Big serif H1 |
| `.vg-roundup-hero` | Roundup top region |
| `.vg-roundup-lede` | Roundup intro paragraph |
| `.vg-roundup-stats` | Stats widget container |
| `.vg-roundup-list` | Items wrapper |
| `.vg-roundup-deep` | "Today's deep stories" preview wrapper |
| `.vg-card-roundup` | A roundup item card |
| `.vg-card-roundup-num` | `#NN` numeral |
| `.vg-card-title` | Card title (Spectral 600) |
| `.vg-card-lede` | Card lede (Spectral roman, fs-sm) |
| `.vg-card-progress` | "N / 10 read" line (Manrope, tabular nums) |
| `.vg-card-deep` | Deep-story preview card |
| `.vg-deep-hero` | Deep-story top region — flex column; CSS reverses visual order so h1 renders before opener |
| `.vg-deep-opener` | Hook paragraph (renders as a pull-quote: italic Spectral, ink-deep, left accent rule, fs-md). DOM-first per universal contract; visually after h1. Write 1-2 self-contained sentences. |
| `.vg-dropcap` | Drop cap on first paragraph; recommended-not-required. EB Garamond 4.5rem with calibrated baseline offset. |
| `.vg-deep-closer` | Closer wrapper (IM Fell italic + accent left rule; `<strong>` inside is Manrope small-caps). Closer label is free phrasing. |
| `.vg-tag` | Tag chip (Manrope 500 uppercase tracking, terracotta with `#` prefix). Lucide-only for icon affordances elsewhere. |
| `.vg-read-time` | Reading-time pill in `.vg-post-trail` (lucide `book-open` + `N MIN`). Auto-injected by `post.njk` via `readingMinutes` filter — daily-news skill does NOT emit this directly. |

## Code blocks + inline code

Three tiers — pick by what the block is actually doing, not by reflex:

- **Inline code**: wrap with bare `<code>`. CSS adds JetBrains Mono,
  a slight slab background, and a thin border. Use sparingly in flowing
  prose for identifiers (`fsync()`), SQL (`SELECT *`), or short literals.

- **Pseudocode / config / shell / output**: wrap with
  `<pre data-kind="KIND"><code>…</code></pre>` where KIND ∈
  {`pseudocode`, `config`, `shell`, `output`}. CSS gives the block a
  left accent rule, a small KIND chip in the top-right corner (Manrope
  small-caps, e.g. `PSEUDOCODE`), and a relaxed 1.8 line-height. The
  chip explicitly tells the reader "the lack of colour is intentional
  — this is structured text, not code that failed to highlight."
  Comments inside the block can be wrapped in `<em>// like this</em>`
  to get Spectral italic in `--muted`, reading as author marginalia
  rather than disabled code. Use this tier for algorithms sketched out,
  config-file fragments, shell snippets without a specific shell, and
  imagined program output.

- **Highlighted real code**: wrap with `<pre><code class="language-XXX">`
  where `XXX` ∈ {`js`, `ts`, `rust`, `go`, `c`, `cpp`, `python`, `sql`,
  `bash`, `yaml`, `json`, `html`, `css`, `zig`, ...}. Eleventy's
  build-time Prism transform tokenises the body and assigns
  OKLCH-token-mapped colours: keywords use `--accent`, comments italic
  in `--muted`, strings in `--sage-deep`, numbers/literals in
  `--ink-deep`. Don't combine with `data-kind` — pick one.

**HTML entities** inside any code block must be encoded by the author
(`&lt;` `&gt;` `&amp;`). The Prism transform decodes them before
tokenising and re-encodes correctly in the output. The pseudocode tier
does no decoding pass, so authored entities render literally as
intended.

## Read-tracking attribute conventions

| Attribute | Meaning |
|---|---|
| `data-vg-readkey="{{page.url}}"` | Marks a link as a "post entry"; read-tracker toggles `.vg-read` on it |
| `data-vg-readkey-item="{{page.url}}#item-NN"` | Marks a roundup item card for per-item tracking |
| `data-vg-progress-of="{{page.url}}#item-"` + `data-vg-progress-total="10"` | Progress counter for the parent roundup |
| `data-vg-toggle="{{page.url}}"` | Manual "mark read" button binding |

Roundup items MUST have `id="item-NN"` (zero-padded) and the matching
`data-vg-readkey-item` attribute; the test suite checks this.

## SVG patterns

### Use `currentColor` for theme-following strokes

```svg
<rect fill="none" stroke="currentColor" stroke-width="1.5" />
```

### Use tokens for fills

```svg
<circle fill="var(--accent)" />
<text fill="var(--muted)">label</text>
```

### Standard viewBox sizes

- Timeline / sequence: `viewBox="0 0 480 80"` to `0 0 480 120`
- Architecture: `viewBox="0 0 480 200"` to `0 0 720 240`
- Donut: `viewBox="0 0 240 120"` (donut + legend)

Always set `style="width: 100%; height: auto;"` or `style="max-width: NNNpx;"`
on the `<svg>` element so it responds to layout.

## Anti-patterns (don't ship)

- `<style>` blocks at post body level (use existing classes; only
  `style="width: ...; height: ..."` allowed as attribute on SVG element).
  Exception: an inline `<style>` block *inside* an `<svg>` element is
  allowed when every rule is prefixed with the widget's `vg-w-*` class
  (see `widget-isolation.md` Rule 1). The ban is on rules that leak into
  the document scope.
- Newsletter signup forms, subscribe CTAs, social follower widgets
- Third-party tracking scripts (Cloudflare Web Analytics is injected
  automatically via the host platform; no per-post code needed)
- Hard-coded color hex/rgb (breaks dark mode)
- Animated GIFs (large, accessibility-hostile)
- `<iframe>` to third-party content (privacy, performance)

## Where the full design system lives

- Human-readable long form: `DESIGN.md` (repo root)
- CSS implementation: `src/static/site.css`
- Spec rationale: `docs/superpowers/specs/2026-05-16-vatt-ghern-design.md` §8

If a class or token is needed that doesn't exist here, prefer adding it to
`site.css` over inlining a `<style>` block.
