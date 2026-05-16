# Archetypes — Output Format Rules

Two HTML archetypes ship per day: one `daily-roundup` and (up to) three
`daily-deep-story`. Each follows a strict structure so the design system
keeps cohesion and the test suite can validate output mechanically.

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
  "topics": ["systems" | "ai" | "infra" | "storage" | "industry" | "roundup"],
  "tags": ["string", ...],
  "sources": ["https://...", ...],
  "news_ids": ["YYYY-MM-DD-NN", ...],
  "summary": "one-sentence CJK summary, <= 80 chars",
  "estimated_read_min": integer,
  "related_roundup": "/YYYY/MM/DD/roundup/"  // deep-story only
}
```

### Design system hygiene (apply to BOTH archetypes)

- All inline SVG uses `var(--accent)` / `var(--ink)` / `var(--muted)` / etc.
  Never hardcoded hex/rgb. Token list lives in `references/design-system.md`.
- Use `currentColor` for SVG strokes that should follow theme.
- Use CJK 全形 punctuation: `：` `，` `、` `。`. Never half-width `:` in
  prose or H2 text.
- Use CJK 雙破折號 `——` (two em-dashes, full-width). Never Latin `—`.
- No emoji. No tracking scripts. No `<style>` blocks (use design system
  classes; inline `style=""` allowed only for SVG sizing).

## Archetype 1: `daily-roundup`

Index of today's 10 news items for 3-minute scan.

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

**Domain grouping**: when a day has 10 items spanning 3+ domains, group items
visually by domain. Insert a `<header>` between the previous item and the next
item of a new domain:

```html
  <header class="vg-roundup-section-label" aria-hidden="true">
    <span class="vg-roundup-section-name">SYSTEMS</span>
  </header>
```

The section-name is the domain in uppercase (one of: AI, SYSTEMS, INFRA,
STORAGE, INDUSTRY). The first domain's section header is omitted (header
appears only when domain CHANGES).

### Content rules

- `TITLE` format: `YYYY.MM.DD —— 今日 N 則` (no parenthetical when not a
  sample).
- Lede names today's thread in one sentence — the *one* signal across the
  10. Examples: "今日主旋律：io_uring CVE 連環爆 + Cloudflare DNS 服務改版"
  or "今日多事之秋：Rust async traits 進入 stable、Postgres 17 釋出"。
- Item lede is 2-3 sentences. First sentence = what happened. Second = why
  an engineer cares. Optional third = a concrete number or quote.
- Stats SVG must render correctly in dark mode (use tokens, not hex).
- The progress span `0 / {{N}} read` text is updated by the read-tracker JS
  at runtime; never hardcode another number.

### Minimum widget budget

1 SVG (the donut). Optional: source-distribution bar, top-tags cloud.

## Archetype 2: `daily-deep-story`

Long-form drill into one of today's 10 items, ~600-1200 lines of HTML.

### Required structure

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK}}</p>
  <h1 class="vg-post-title">{{TITLE}}</h1>
</header>

<div class="vg-post-prose">
  <p>
    <span class="vg-dropcap">{{FIRST_CHAR}}</span>{{REST_OF_OPENING_PARAGRAPH}}
  </p>

  <h2>幕一：發生了什麼</h2>
  <!-- prose -->
  <!-- WIDGET 1: timeline OR sequence diagram (inline SVG, viewBox-based) -->
  <!-- optional: blockquote -->

  <h2>幕二：為什麼重要</h2>
  <!-- prose -->
  <!-- WIDGET 2: architecture diagram OR data viz (inline SVG) -->
  <!-- optional: <pre><code>...</code></pre> -->

  <h2>幕三：延伸與思考</h2>
  <!-- prose -->
  <ul>
    <li>對應今日 roundup：<a href="/YYYY/MM/DD/roundup/#item-NN">#NN {{title}}</a></li>
    <!-- optional: prior-vatt-ghern cross-links -->
  </ul>

  <p class="vg-deep-closer"><strong>Take-away</strong>：{{ONE_SENTENCE_TAKEAWAY}}</p>
</div>
```

### Content rules

- **Opener**: a scene, a question, or a snatch of dialogue. Pull the reader
  in. Examples: "凌晨三點。值班工程師接到通知⋯⋯" or "如果我說 Postgres
  17 不再 vacuum 整張表，你會怎麼想？"
- **Drop cap** on the first paragraph: wrap the first CJK character in
  `<span class="vg-dropcap">字</span>`. Use one character only.
- **All three H2** must be present. Use exactly `幕一：發生了什麼`,
  `幕二：為什麼重要`, `幕三：延伸與思考`. (Full-width `：`.)
- **Cross-link** in 幕三 must reference today's roundup item by `news_id`.
- **Take-away** is ONE sentence ending with `。`. No bullet expansion.

### Minimum widget budget

**Two inline SVG widgets** (one per first two acts), each non-trivial — a
timeline, sequence diagram, architecture diagram, comparison plot, or
sparkline tied to a real number. A solitary donut does not count.

### Code blocks

`<pre><code>` rendering — no syntax-highlight library; CSS in
`src/static/site.css` handles type. Languages can be tagged
(`<pre data-lang="nginx">`) but no JS highlighting at build time in Phase 2.

## Scoring rubric (for source-selection step)

For each candidate, score 0–10:

- 3 pts: teaches something non-obvious
- 3 pts: actionable for someone shipping code soon
- 2 pts: substantial original material (not a paraphrase)
- 2 pts: domain coverage bonus (item belongs to under-represented domain
  today)

Pick top 10 with the constraint that ≥3 domains are represented.

## Deep-story selection (from today's 10)

Pick up to 3 items that satisfy ALL:

- Score ≥ 8
- Original source has drillable depth (long-form, RFC, paper, design doc —
  not just a press release)
- Different domains where possible (3 different > 2 different > 1)

If fewer than 3 qualify, write fewer. Do not force.
