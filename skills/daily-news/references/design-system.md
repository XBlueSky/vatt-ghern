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

### Mobile legibility floor (added 2026-05-21 after PR #30)

**Rule**: every SVG `<text>` inside a `vg-w-*` figure MUST render at
**≥ 11 px** effective on a 375 px viewport. If the SVG would shrink
text below this floor, the figure MUST opt into horizontal scroll via
the `data-svg-scroll="<min-px>"` attribute on the `<figure>`.

**Why this matters**: the global `figure svg { width: 100% !important }`
rule in `site.css` forces the SVG to fit the figure container. On a
375 px mobile viewport the figure container is ~343 px wide. A
viewBox-880 SVG then scales to 0.39× — turning an authored 11 px label
into 4.3 device px, which is fully unreadable. PR #30 had 7 figures
where the smallest text rendered between 3.5 and 5.4 device px on
mobile; visually they looked fine in screenshots, but no human could
actually read them.

**Sizing math**: effective px on mobile ≈
`font_size_in_svg_units × (data-svg-scroll / viewBox_width)`. To pick
a value, solve for `min_text_px ≥ 11`:
`data-svg-scroll ≥ 11 × viewBox_width / smallest_font_size_in_svg`.

**Allowed values** (site.css enumerates these): `560`, `640`, `720`,
`800`, `880`. Pick the smallest one that gets every text ≥ 11 effective
px. Examples from PR #30:

| viewBox | smallest font | min scroll | resulting effective px |
|---|---|---|---|
| `880 × ...` | 11 | `880` | 11.0 |
| `880 × ...` | 13 | `720` | 10.6 (acceptable) |
| `720 × ...` | 10 | `720` | 10.0 |
| `760 × ...` | 12 | `640` | 10.1 |
| `360 × ...` | 11 | (none needed) | 11.4 at 343 px viewport |

**Markup**:

```html
<figure class="vg-w-foo" data-svg-scroll="720">
  <svg viewBox="0 0 720 360"> ... </svg>
</figure>
```

On desktop (figure width ≥ 880 px) the rule is a no-op — `min-width`
is met by the natural figure width and there's no overflow. On mobile
the SVG holds at its `min-width` and the figure scrolls horizontally;
a native scrollbar appears at the bottom of the figure as a clear
affordance.

**When NOT to use**: small `viewBox` widgets (≤ 480 wide) usually
already render legibly on mobile because the natural scale is close to
1×. Run the audit before adding the attribute. Adding it
unnecessarily creates an unwanted scrollbar.

### Interactive-affordance hint

Mark interactive figures with an inline `<p class="vg-w-affordance">`
as the FIRST child of the `<figure>`. Pattern (revised 2026-05-21
after the corner-pill version collided with table captions and
panel headers):

```html
<figure class="vg-w-table-foo">
  <p class="vg-w-affordance">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
         stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <!-- lucide arrow-up-down paths -->
      <path d="m21 16-4 4-4-4"/><path d="M17 20V4"/>
      <path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>
    </svg>
    <span>click column header to sort · 5 columns × 7 rows</span>
  </p>
  <!-- ... figure body ... -->
</figure>
```

Inline-flow benefits over the earlier `data-interactive` pseudo-element
badge:

- Real DOM element flows naturally; never collides with internal text.
- The descriptive `<span>` carries widget-specific data ("4 layers",
  "7 events over 6 hours") instead of a 4-letter genre tag.
- No `position: absolute` / `z-index` / sticky-header overlap concerns.
- Mobile reflow naturally.

| Lucide icon | Use for | Typical phrasing |
|---|---|---|
| `move-horizontal` | drag sliders, range scrubbers | "drag handle along the timeline · 7 events over 6 hours" |
| `mouse-pointer-click` | clickable layers, radios-as-cards | "click any layer to read its responsibility · 4 layers" |
| `panels-top-left` | tab switchers | "switch tabs to compare 4 approaches · 4 tabs" |
| `arrow-up-down` | sortable table headers | "click column header to sort · 5 columns × 7 rows" |

Embed the lucide SVG paths inline (do NOT use the `{% lucide %}`
shortcode in this position — it emits attributes the global
`figure svg { width: 100% !important }` rule will fight). The
`.vg-w-affordance svg` rule in `site.css` includes the required
`width/height/min-width !important` overrides to keep the 14×14 icon
from being stretched to figure width by the global rule and by any
`data-svg-scroll` rule.

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
