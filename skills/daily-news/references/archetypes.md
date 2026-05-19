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
  "topics": ["ai" | "systems" | "infra" | "web" | "backend" | "roundup"],
  "tags": ["string", ...],
  "sources": ["https://...", ...],
  "news_ids": ["YYYY-MM-DD-NN", ...],
  "summary": "one-sentence CJK summary, <= 80 chars",
  "estimated_read_min": integer,
  "related_roundup": "/YYYY/MM/DD/roundup/",
  "widget_count": integer,
  "widget_questions": ["conceptual question per widget", ...],
  "widget_templates": ["interactive-param-demo" | "scroll-driven-explanation"
                       | "mini-canvas-simulation" | "annotated-diagram-walkthrough"
                       | "data-driven-chart" | "<tier-2 snippet id>", ...]
}
```

`deep_archetype` is REQUIRED for `archetype: "daily-deep-story"` posts
and OMITTED for `daily-roundup`.

`widget_count`, `widget_questions`, and `widget_templates` are
REQUIRED for `archetype: "daily-deep-story"` posts (where the new
widget contract applies). They are OPTIONAL for `daily-roundup` (the
roundup's widget budget is unchanged — see "Roundup spec" below).

Invariants:

- `widget_count == widget_questions.length`
- `widget_templates.length == widget_count`
- Every entry in `widget_templates` exists as a file under
  `skills/daily-news/references/widget-cookbook/tier-1-golden/<id>.md`
  OR `skills/daily-news/references/widget-cookbook/tier-2-snippets/<id>.md`

`publish.mjs` enforces presence + length invariants. The cookbook-id
existence check runs in `tests/widget-cookbook-check.mjs`.

### Hero contract (deep-story only)

Every deep-story emits this `<header>` block at the top of the body:

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK}}</p>
  <h1 class="vg-post-title">{{TITLE}}</h1>
</header>
```

**Why opener is in the DOM before h1**: the universal-contract check
greps for `.vg-deep-opener` and `<h1 class="vg-post-title">` as siblings
of `.vg-deep-hero`. Keeping opener as the first child is the historical
convention and is what `tests/archetype-check.mjs` validates.

**Why the rendered order is h1-then-opener**: site.css applies
`.vg-deep-hero { display: flex; flex-direction: column }` plus
`order: 0` on the title and `order: 1` on the opener, so sighted
readers see article identity first and the hook second. Screen-reader
order matches the DOM and is unaffected.

**Opener writing rules** — because it renders as a *pull-quote* (italic
Spectral, ink-deep color, left accent rule, fs-md), write it to stand
alone:

- One or two sentences max. A pull-quote that runs four sentences feels
  like a stuck intro, not a hook.
- Self-contained — does not start with "之後" / "因此" / "所以" or any
  back-reference that needs the body to make sense.
- Concrete: a scene, a quote, a number, a question, a counter-intuitive
  observation. Not a topic summary ("this post is about CDC").
- Independent of the title — the opener and h1 should *each* be the
  best version of itself, not redundant. If the opener restates the
  title, rewrite the opener.

Bad opener (echoes title, hedges):

```
BuildBuddy 在 Bazel 中啟用了 content-defined chunking，這項技術讓檔案
dedup 變得更有效，本文將深入解析其運作原理與實際成效。
```

Good opener (concrete, self-standing):

```
Bazel 的 remote cache 早就會 dedup——只要兩個 action 產出 byte-for-byte
相同的輸出，第二份不會佔新的儲存。問題出在「99% 相同的輸出」這種情況。
```

The h1 then names the post: `BuildBuddy 把 FastCDC 帶進 Bazel——300 TiB
重複資料消失`. Together: hook → identity.

### Design system hygiene (apply to ALL archetypes)

- All inline SVG uses `var(--accent)` / `var(--ink)` / `var(--muted)` / etc.
  Never hardcoded hex/rgb. Token list lives in `references/design-system.md`.
- Use `currentColor` for SVG strokes that should follow theme.
- Use CJK 全形 punctuation: `：` `，` `、` `。` inside CJK prose. Half-width
  `:` allowed in English H2s (e.g., one valid investigation H2 phrasing is
  `hypothesis: cache-eviction lock contention`, but the H2 wording is free
  per the archetype reference — name it after the actual hypothesis).
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
        {{IF deep-story exists}} · <a href="{{deep_url}}">deep read <svg class="vg-icon vg-icon-arrow-up-right" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg></a>{{END}}
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

This is reserved as a marker class for future styling hooks. Currently no
visual treatment is attached; the inline `deep read <arrow-up-right>` link
inside the meta row is the only deep-story affordance.

All icons in vatt-ghern come from **lucide** (`lucide-static`). Inline
them as SVG with `class="vg-icon vg-icon-<name>"` and `stroke="currentColor"`
so they inherit the surrounding text color. Common icons: `arrow-up-right`
(external link to deep story or source), `check` (read state), `undo-2`
(unread), `list-checks` (mark all read), `link` (copy link). Do NOT use
unicode glyphs (↗, ✓, ↶) for chrome icons.

**Domain grouping (mandatory)**: items render in this fixed display order:

```
ai → systems → infra → web → backend
```

> Legacy posts (pre-2026-05-19) tagged with `storage` or `industry` continue
> to render under their original section headers. New posts must use one of
> the five domains above.

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

**Read-state buttons are JS-injected — do NOT hardcode them in HTML**:

- `↶ unread` button (inside `.vg-card-roundup-body`, shown when collapsed)
- `✓ mark read` button (appended into `.vg-card-meta`, with a `·` separator)
- `mark all read` link (appended next to the progress span)

All three are injected at page-load by `src/static/read-tracker.js`. Future
roundup HTML should emit just the source link, optional deep link, and
optional tag chip in the meta row — the mark-read button arrives via JS.
This keeps the emitted HTML focused on content and lets the read-tracker
evolve independently.

### Content rules

- `TITLE` format: `YYYY.MM.DD —— 今日 N 則`. Use the actual N, not 10
  if fewer items qualified.
- Hero lede begins with the inline chrome label
  `<span class="vg-roundup-lede-label">TODAY'S THREAD</span>` (uppercase,
  no trailing colon; CSS applies Manrope small caps + terracotta). The
  CJK summary sentence follows after a space — do NOT prefix with
  "今日主旋律：" since the English chrome label has replaced that role.
- Hero lede summary is one sentence — the *one* signal across all items.
  Example body: "QUIC 擁塞控制死亡螺旋、ClickHouse mutex 瓶頸——兩條
  獨立的事件，根源都是邊緣條件下靜默出錯。"
- **Item lede is 2-3 sentences**. First sentence = what happened. Second =
  why an engineer cares. Optional third = a concrete number, quote, or
  consequence. Lint enforces ≤ 4 「。」 periods (allows the 2-3 sentences
  plus inline references like `ClickHouse 25.11.`). The lede renders as
  Spectral 400 normal (not italic) — keep it readable, not decorative.
- Item meta row uses `<p class="vg-card-meta">` containing source link,
  optional deep link, optional tag chip — in that order, separated by
  `·` dots. Do NOT add a mark-read button here; JS injects it.
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
  today — defined as ≤2 candidates in that domain in today's harvest;
  computed mechanically by `scripts/decisions/score.mjs`)

## Deep-story selection (from today's items)

See SKILL.md Step 5 for the full selection algorithm including domain
and archetype diversity constraints.
