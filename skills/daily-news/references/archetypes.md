# Archetypes — Output Format Rules

Each day the daily-news skill emits one `daily-roundup` and up to three
`daily-deep-story` posts. The roundup follows a single fixed structure
(specified here). Each deep-story picks ONE of six archetypes:

| deep_archetype | When to pick | Detail file |
|---|---|---|
| `narrative` | Time-ordered event story (incident, CVE chain, release week) | `archetypes/deep-narrative.md` |
| `technical-deep-dive` | Structural exposition of a new design / algorithm / protocol | `archetypes/deep-technical-deep-dive.md` |
| `investigation` | "Why is this happening?" puzzle with hypotheses | `archetypes/deep-investigation.md` |
| `comparison` | Two or more options to choose between | `archetypes/deep-comparison.md` |
| `explainer` | Concept explained from zero (reader needs the prereqs) | `archetypes/deep-explainer.md` |
| `freeform` | Hybrid topic, or none of the structured five fits | `archetypes/deep-freeform.md` |

The five structured archetypes have specific H2 requirements; freeform
requires only the universal contract (opener, dropcap, closer, ≥2 SVG).

**Archetypes are SUGGESTIONS, not commandments.** When in doubt or when
forcing a structured archetype would worsen the prose, pick `freeform`.
A forced fit produces worse content than free shape.

The skill picks the archetype in Step 5 of the workflow (see SKILL.md),
then reads the appropriate `archetypes/<name>.md` file for the structure
rules to follow when writing.

## Common conventions

### File layout

Each post lives in `src/posts/YYYY/MM/DD/<slug>.{html,11tydata.json}`.

- Roundup: slug is always `roundup`.
- Deep-story: slug is `deep-<kebab-case-topic>`, e.g.
  `deep-io-uring-cve-2026-xxxx`.

### Sidecar JSON schema

```json
{
  "title": "string (CJK ok)",
  "date": "YYYY-MM-DD",
  "archetype": "daily-roundup" | "daily-deep-story",
  "deep_archetype": "narrative" | "technical-deep-dive" | "investigation"
                    | "comparison" | "explainer" | "freeform",
  "topics": ["systems" | "ai" | "infra" | "storage" | "industry" | "roundup"],
  "tags": ["string", ...],
  "sources": ["https://...", ...],
  "news_ids": ["YYYY-MM-DD-NN", ...],
  "summary": "one-sentence CJK summary, <= 80 chars",
  "estimated_read_min": integer,
  "related_roundup": "/YYYY/MM/DD/roundup/"
}
```

`deep_archetype` is REQUIRED for `archetype: "daily-deep-story"` posts
and OMITTED for `daily-roundup`. publish.mjs enforces presence.

### Design system hygiene (apply to ALL archetypes)

- All inline SVG uses `var(--accent)` / `var(--ink)` / `var(--muted)` / etc.
  Never hardcoded hex/rgb. Token list lives in `references/design-system.md`.
- Use `currentColor` for SVG strokes that should follow theme.
- Use CJK 全形 punctuation: `：` `，` `、` `。` inside CJK prose. Half-width
  `:` allowed in English H2s (e.g., investigation's `hypothesis: foo` or
  comparison's `dimension: bar`).
- Use CJK 雙破折號 `——` (two em-dashes, full-width) inside CJK prose.
  Never Latin `—` in CJK prose.
- No emoji. No tracking scripts. No `<style>` blocks (use design system
  classes; inline `style=""` allowed only for SVG sizing).

## Roundup spec

Index of today's items for 3-minute scan.

### Required structure

```html
<header class="vg-roundup-hero">
  <h1 class="vg-post-title">{{TITLE}}</h1>
  <p class="vg-roundup-lede">{{ONE-SENTENCE_TODAY_THREAD}}</p>
</header>

<section class="vg-roundup-stats" aria-label="today's stats">
  <!-- SVG donut: domain distribution -->
</section>

<section class="vg-roundup-list" aria-label="today's stories">
  <span data-vg-progress-of="{{page.url}}#item-"
        data-vg-progress-total="{{N}}"
        class="vg-card-progress">0 / {{N}} read</span>

  <!-- Repeat for each item, NN=01..10 -->
  <article class="vg-card vg-card-roundup" id="item-NN"
           data-vg-readkey-item="{{page.url}}#item-NN">
    <span class="vg-card-roundup-num">#NN</span>
    <div>
      <h2 class="vg-card-title">{{ITEM_TITLE}}</h2>
      <p class="vg-card-lede">{{2-3_SENTENCES_WHAT_AND_WHY}}</p>
      <p>
        <a href="{{source_url}}">read source →</a>
        {{IF deep-story exists}} · <a href="{{deep_url}}">deep read ↗</a>{{END}}
        {{IF domain_chip}} · <a class="vg-tag" href="/tags/{{tag}}/">{{tag}}</a>{{END}}
      </p>
    </div>
  </article>
</section>

<section class="vg-roundup-deep" aria-label="today's deep reads">
  <h2>today's deep reads</h2>
  <!-- One vg-card-deep <a> per deep-story; href to the deep-story's url -->
</section>
```

### Visual differentiation rules

**Deep-story-bearing items**: items that have a corresponding `daily-deep-story`
post must get the `vg-card-roundup-has-deep` modifier class on the `<article>`:

```html
<article class="vg-card vg-card-roundup vg-card-roundup-has-deep" id="item-NN" ...>
```

This adds a sage-colored corner mark "↗ deep" so readers can scan for which
items have drill-down content.

**Domain grouping (mandatory)**: items render in this fixed display order:

```
ai → systems → infra → storage → industry
```

Within each domain, sort by score descending. Each non-empty domain emits
exactly ONE section header at the top of its group:

```html
<header class="vg-roundup-section-label" aria-hidden="true">
  <span class="vg-roundup-section-name">SYSTEMS</span>
  <span class="vg-roundup-section-count">3 篇</span>
</header>
```

The domain name is uppercase English; the count uses CJK 「篇」 with the
integer. Empty domains are skipped (no empty section emitted).

**Important**: `news_id` (`YYYY-MM-DD-NN`) is assigned in **score order**,
NOT display order. The on-page `#NN` numeral therefore appears in
non-monotonic sequence when grouped by domain — this is a feature: it
shows the reader both score-rank and domain at once.

**Item body wrapper**: each card MUST wrap title + lede + meta in a
`<div class="vg-card-roundup-body">` for the read-tracker JS to find a
stable insertion point for the `↶ unread` button.

### Content rules

- `TITLE` format: `YYYY.MM.DD —— 今日 N 則`. Use the actual N, not 10
  if fewer items qualified.
- Lede names today's thread in one sentence — the *one* signal across all
  items. Example: "今日主旋律：io_uring CVE 連環爆 + Cloudflare DNS 服務改版"
- **Item lede is 2-3 sentences**. First sentence = what happened. Second =
  why an engineer cares. Optional third = a concrete number, quote, or
  consequence. Lint enforces ≤ 4 「。」 periods (allows the 2-3 sentences
  plus inline references like `ClickHouse 25.11.`). The lede renders as
  Spectral 400 normal (not italic) — keep it readable, not decorative.
- Item meta row uses `<p class="vg-card-meta">` containing source link,
  optional deep link, optional tag chip — in that order, separated by
  `·` dots.
- Stats SVG must render correctly in dark mode (use tokens, not hex).
- The progress span text is updated by the read-tracker JS at runtime;
  never hardcode another number.

### Minimum widget budget

1 SVG (the donut). Optional: source-distribution bar, top-tags cloud.

## Scoring rubric (for source-selection step)

For each candidate, score 0–10:

- 3 pts: teaches something non-obvious
- 3 pts: actionable for someone shipping code soon
- 2 pts: substantial original material (not a paraphrase)
- 2 pts: domain coverage bonus (item belongs to under-represented domain
  today)

## Deep-story selection (from today's items)

See SKILL.md Step 5 for the full selection algorithm including domain
and archetype diversity constraints.
