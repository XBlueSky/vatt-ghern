# Roundup Re-architecture — design spec

**Date**: 2026-05-17
**Status**: design freeze (post-brainstorm, pre-implementation-plan)
**Supersedes**: portions of `2026-05-16-vatt-ghern-design.md` §6.1 (roundup
archetype) and the `daily-roundup` parts of
`2026-05-16-archetypes-and-domains.md`

---

## 1. What this is

A focused re-architecture of the `daily-roundup` archetype based on real-use
feedback after the first routine run. Five interlocking changes:

1. **Density**: every item card shortens from ~150 px to ~110 px tall
2. **Lede typography**: drop italic; use Spectral 400 normal instead of IM
   Fell English Italic
3. **Read state**: read items collapse to a single line (~28 px) AND fade
   to opacity 0.55, with a green `✓` marker and an expand toggle
4. **Read trigger**: any click on a source link auto-marks the item read;
   manual toggle still available to mark read-without-reading or undo
5. **Domain grouping**: items group by domain (not by score); each domain
   shows one hairline section label at the top of its group

Other archetypes (`daily-deep-story` × 6 variants) are unaffected.

## 2. Why

Real-use feedback from 2026-05-16 routine run:

- **"Lede 斜體有點難識讀"** — IM Fell English Italic in scribed-italic style
  at body size is hard to read for the CJK reader; the italic was added for
  editorial mood but lede is content, not marginalia
- **"今日 10 則編排不太好，會因為編號導致內文變得很窄"** — fixed in
  mobile layout (collapse #NN to inline prefix); the structural insight is
  that lede length matters more than column geometry, leading to the
  density rewrite
- **"我覺得我們要再好好想想今日十則的架構"** — surfaced two primary
  use modes the existing layout did not optimize for:
  - **Quick scan** (~3 minutes) — read every title + one lede sentence,
    move on. Existing 3-sentence italic lede is over-budget for this mode
  - **Repeated visits** through the day — second visit lands on a wall of
    already-read items, no way to compress them out of the way

The design optimizes for both: a quick first visit (smaller cards, cleaner
ledes, domain groups make scanning predictable) and an efficient second
visit (read items collapse to title-only with fade).

## 3. Layout: card density (was: lede long, italic)

### Per-card structure

```html
<article class="vg-card vg-card-roundup" id="item-NN"
         data-vg-readkey-item="{{page.url}}#item-NN">
  <span class="vg-card-roundup-num">#NN</span>
  <div class="vg-card-roundup-body">
    <h2 class="vg-card-title">{{TITLE}}</h2>
    <p class="vg-card-lede">{{ONE_SENTENCE_LEDE}}</p>
    <p class="vg-card-meta">
      <a href="{{source_url}}">read source →</a>
      {{IF has_deep}} · <a href="{{deep_url}}">deep ↗</a>{{END}}
      {{IF tag}} · <a class="vg-tag" href="/tags/{{tag}}/">{{tag}}</a>{{END}}
    </p>
  </div>
</article>
```

### Typography deltas vs. current

| Element | Was | Now |
|---|---|---|
| `.vg-card-title` | Spectral 600, `--fs-md` (~19 px), `--ink` | unchanged |
| `.vg-card-lede` | IM Fell italic, `--fs-base` (~17 px), `--ink-soft` | **Spectral 400 normal**, `--fs-sm` (~15 px), `--ink-soft`, `line-height: 1.55` |
| `.vg-card-meta` | mixed (italic anchor + Manrope tags) | Manrope small caps, `--fs-xs`, `--muted`; anchors get `--accent-text` |
| Card padding (desktop) | `--s-3` (~16 px) | `--s-3` (unchanged) |
| Card padding (mobile) | `--s-3 --s-3 --s-3` | `--s-2 --s-3 --s-3` (tighten vertical) |

### Per-card height target

~ 110 px desktop, ~ 130 px mobile (allowing for title wrap). Was ~150 px
desktop / ~180 px mobile.

### Lede content rule

The lede is **one sentence**. Maximum two clauses separated by `——`. The
sentence must answer "what + why an engineer cares" in one breath. If the
news genuinely needs more, that's a signal to deep-story, not stuff more
into the roundup card.

Update `skills/daily-news/references/archetypes.md` § Roundup content rules
accordingly:

> Item lede is **one sentence**. Answers "what happened + why an engineer
> cares" in one breath. If the news needs three sentences to land, it
> belongs in a deep-story, not the roundup.

## 4. Read state: collapse + fade

### Visual

When `.vg-card-roundup` carries the `.vg-read` class:

- Card padding shrinks to `--s-2` top/bottom
- `display` changes from `grid` to `block` (mobile-style)
- `.vg-card-lede` and `.vg-card-meta` `display: none`
- `.vg-card-title` font-weight drops to 500, size to `--fs-sm`
- Opacity 0.55 on the whole card
- `::before` content `"✓ "` in `--sage-deep` (green)
- `::after` content `" ↕"` in `--muted-2`, suggests expand affordance
- A small `<button class="vg-read-collapse-toggle">` overlays the card
  enabling "↕" click to expand

### Expand-on-click behavior

Clicking a collapsed card (anywhere on the title row, or the ↕ icon)
removes `.vg-read` temporarily, restoring full height. The next interaction
elsewhere does NOT auto-recollapse; only an explicit `↶ unread` action
toggles state back. (Treat expand as "let me see what this said again".)

### Stored state

`localStorage["vg-read"]` already keys per-item. No change to storage
shape. Display logic changes only.

## 5. Read trigger: automatic on source click, manual fallback

### Automatic

When the user clicks **any** `<a>` inside `.vg-card-meta` of a roundup
item (typically `read source →` or `deep ↗`), `read-tracker.js` marks that
item read **before** following the link. Implementation: attach a click
handler to every `.vg-card-meta a` inside a roundup that runs:

```js
mark(state, readkey, true);
// allow default navigation to proceed (do not preventDefault)
```

The mark happens synchronously; localStorage write completes before the
browser navigates away.

### Manual fallback

Each card has a small toggle button bound to the same key. In unread
state: not shown (auto trigger covers most cases). In read state: shown as
`<button class="vg-read-toggle">↶ unread</button>` inside the collapsed
card, so the user can revert.

Reading the universe of cases:

| User action | Result |
|---|---|
| Click `read source →` | Mark read, navigate to publisher |
| Click `deep ↗` | Mark read, navigate to deep-story |
| Click `↕` on collapsed | Temporarily expand (no state change) |
| Click `↶ unread` on collapsed | Restore unread state |
| Click anywhere else in card | No state change (just selectable text) |
| Skip an item (no click at all) | Stays unread — that's the point |

### Manual "skip read" affordance

Spec defers: a user who wants to mark unread items as read without
clicking anywhere has no current path. Could add a single "mark all
remaining read" button at the bottom of the roundup, but that's likely
yagni for day one. Revisit if real usage shows missing it.

## 6. Domain grouping (was: by score)

### Order

Items group by domain, in this fixed display order:

```
ai → systems → infra → storage → industry
```

Within each domain, sort by score descending (the score-rank still drives
`news_id`; display order changes only). Empty domains are skipped — no
empty `<section>` block emitted.

### Section labels

One hairline label per domain group:

```html
<header class="vg-roundup-section-label" aria-hidden="true">
  <span class="vg-roundup-section-name">SYSTEMS</span>
  <span class="vg-roundup-section-count">3 篇</span>
</header>
```

Section label includes the count of items in the domain. Hides if a domain
has zero items.

### news_id is unchanged

`news_id` continues to be `YYYY-MM-DD-NN` in **score order**, NOT display
order. So a reader navigating to `#item-04` lands on whichever item is
4th-by-score regardless of which domain section it appears in.

This keeps cross-links from past deep-stories stable (a deep-story
referencing `2026-05-16-04` always resolves to the same item even if the
display algorithm changes).

### Card display order

The HTML emits items in display order (grouped by domain), so visually
they read top-to-bottom in domain order. The `#NN` numeral on each card
shows the score-rank — so a reader sees e.g.:

```
AI · 1 篇
  #08  …

SYSTEMS · 3 篇
  #02  …
  #04  …
  #05  …

INFRA · 3 篇
  #01  …
  #03  …
  #09  …
```

The non-monotonic `#NN` sequence is a feature: it tells the reader
"item #01 was the day's highest-scored, but the display puts it under
INFRA because that's its domain."

## 7. Implementation file map

| File | Change |
|---|---|
| `src/static/site.css` | `.vg-card-roundup` density rewrite; `.vg-card-lede` typography change; `.vg-read` collapse styles; `.vg-card-meta` styles |
| `src/static/read-tracker.js` | Auto-mark on `.vg-card-meta a` click; collapse-toggle handler for expand-without-state-change; surface `↶ unread` button when collapsed |
| `src/posts/2026/05/16/roundup.html` | Re-emit cards in domain-grouped order; add count to section labels; ensure each `vg-card-roundup` carries `.vg-card-roundup-body` wrapper for the new layout |
| `skills/daily-news/references/archetypes.md` (Roundup spec) | Update §"Content rules": one-sentence lede; §"Visual differentiation rules": new domain-grouping algorithm |
| `tests/archetype-check.mjs` | Validate roundup section labels (one per non-empty domain); validate item lede is single sentence (heuristic: max 1 `。`); validate cards appear in domain order |
| `skills/daily-news/SKILL.md` | Step 6 (write roundup) — update to reflect domain-grouped emission order and one-sentence lede constraint |

## 8. Phased rollout

This is single-archetype scope; no need for multi-phase rollout. Build the
CSS first (zero content change can demo collapse via dev tools toggling
`.vg-read` class), then read-tracker.js, then roundup.html re-emit, then
update archetypes.md + archetype-check + SKILL.md.

A simple linear order:

1. CSS: density + collapse + lede typography (`fix(roundup-css)`)
2. read-tracker.js: auto-mark + expand toggle + ↶ unread surface
   (`feat(read-tracker)`)
3. Update existing 2026-05-16 sample roundup with domain grouping + section
   counts to verify visually (`fix(roundup-sample)`)
4. archetypes.md + archetype-check + SKILL.md spec updates so future
   routine runs follow the new rules (`docs(skill)`)

## 9. Out of scope (deliberately deferred)

- **"Mark all remaining read" bulk action** — yagni until usage shows it
- **Already-read items pinned to bottom** — preserving domain order beats
  visual freshness for this use case; revisit if section labels with mixed
  read/unread feel cluttered
- **Per-domain expand/collapse all** — would let user fully hide a domain
  ("not interested in AI today"). Interesting but not asked for
- **Score-rank toggle vs domain-group toggle** — let user override default
  display order. Adds complexity; default order should just be right
- **Animation on collapse / expand** — keep it static for now; CSS
  `transition` on opacity / height adds complexity for marginal gain

## 10. Success criteria

After implementation:

- A 10-item roundup with 5 read + 5 unread renders in < 900 px (was
  ~1700 px) on mobile
- Visiting an item via `read source →` or `deep ↗` automatically marks
  it read; revisiting the roundup shows it collapsed
- Domain groups visible at a glance via section labels; switching the
  default emit order in the future means changing one ordering rule in
  `roundup.html`
- Lede is one Spectral-normal sentence per item, ~15 px, comfortably
  readable on both light and dark themes
