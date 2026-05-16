# Six Deep-Story Archetypes + Tighter Domain Coverage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single fixed three-act deep-story structure with six archetypes (5 structured + 1 freeform), tighten domain coverage to aim-5/floor-4/cap-6, build a public `/archetypes/` catalog page mirroring kaer-morhen's, and run the daily-news skill once for real.

**Architecture:** Pure additive changes to an existing Eleventy SSG. Skill `references/` doc reshuffle (single file → directory + 6 sub-docs), `tests/archetype-check.mjs` extended with per-archetype rule set keyed by sidecar `deep_archetype` field, `src/archetypes/` repurposed from skill-only-template to rendered pages, and `src/_data/site.js` nav adds the `archetypes` link. No new dependencies.

**Tech Stack:** Eleventy 3.x, Nunjucks, vanilla JS (the tests are node:test-compatible mjs), HTML+CSS for archetype catalog pages. Same stack as the rest of vatt-ghern.

**Spec reference:** `docs/superpowers/specs/2026-05-16-archetypes-and-domains.md`.

---

## File Structure

Files this plan creates or modifies:

### Phase A (spec + reference docs + SKILL.md)

| Path | Action | Purpose |
|---|---|---|
| `skills/daily-news/references/archetypes.md` | Modify (shrink to overview + roundup spec + pointers) | Entry point, ~100 lines |
| `skills/daily-news/references/archetypes/deep-narrative.md` | Create | Narrative archetype detailed spec |
| `skills/daily-news/references/archetypes/deep-technical-deep-dive.md` | Create | Technical deep dive spec |
| `skills/daily-news/references/archetypes/deep-investigation.md` | Create | Investigation spec |
| `skills/daily-news/references/archetypes/deep-comparison.md` | Create | Comparison spec |
| `skills/daily-news/references/archetypes/deep-explainer.md` | Create | Explainer spec |
| `skills/daily-news/references/archetypes/deep-freeform.md` | Create | Freeform escape-hatch spec |
| `skills/daily-news/SKILL.md` | Modify (Steps 4–7 + PR body template) | Wire new domain rule + archetype decision tree + reference paths |

### Phase B (`/archetypes/` page + check rewrite)

| Path | Action | Purpose |
|---|---|---|
| `src/archetypes/archetypes.11tydata.json` | Modify (excludeFromCollections false, layout, permalink) | Activate as renderable pages |
| `src/archetypes/daily-roundup.html` | Modify (placeholder → display content) | Catalog detail page content |
| `src/archetypes/daily-roundup.11tydata.json` | Modify (add display metadata) | Title, definition, silhouette name |
| `src/archetypes/deep-narrative.html` | Create (was deep-deep-story.html renamed) | Detail page content for narrative |
| `src/archetypes/deep-narrative.11tydata.json` | Create | Sidecar |
| `src/archetypes/deep-technical-deep-dive.html` | Create | Detail page |
| `src/archetypes/deep-technical-deep-dive.11tydata.json` | Create | Sidecar |
| `src/archetypes/deep-investigation.html` | Create | Detail page |
| `src/archetypes/deep-investigation.11tydata.json` | Create | Sidecar |
| `src/archetypes/deep-comparison.html` | Create | Detail page |
| `src/archetypes/deep-comparison.11tydata.json` | Create | Sidecar |
| `src/archetypes/deep-explainer.html` | Create | Detail page |
| `src/archetypes/deep-explainer.11tydata.json` | Create | Sidecar |
| `src/archetypes/deep-freeform.html` | Create | Detail page |
| `src/archetypes/deep-freeform.11tydata.json` | Create | Sidecar |
| `src/_includes/layouts/archetype.njk` | Create | Detail page layout (crumb + hero + body + real-examples filter) |
| `src/archetypes-index.njk` | Create | `/archetypes/` index page with 6-card grid + silhouettes |
| `src/static/site.css` | Modify (add `.vg-archetype-*` classes + silhouette styles) | Catalog page styling |
| `src/_data/site.js` | Modify (add archetypes nav item) | Visible from day 1 |
| `tests/archetype-check.mjs` | Modify (per-archetype rule set) | Validate by `deep_archetype` |
| `src/posts/2026/05/16/deep-sample.html` | Rename → `deep-narrative-sample.html` | Make explicit narrative sample |
| `src/posts/2026/05/16/deep-sample.11tydata.json` | Rename + add `deep_archetype: "narrative"` | Sidecar updated |

### Phase C (samples + routine run)

| Path | Action | Purpose |
|---|---|---|
| `src/posts/2026/05/16/deep-technical-deep-dive-sample.html` | Create | Structural sample for catalog |
| `src/posts/2026/05/16/deep-technical-deep-dive-sample.11tydata.json` | Create | Sidecar |
| `src/posts/2026/05/16/deep-investigation-sample.html` | Create | Structural sample |
| `src/posts/2026/05/16/deep-investigation-sample.11tydata.json` | Create | Sidecar |
| `src/posts/2026/05/16/deep-comparison-sample.html` | Create | Structural sample |
| `src/posts/2026/05/16/deep-comparison-sample.11tydata.json` | Create | Sidecar |
| `src/posts/2026/05/16/deep-explainer-sample.html` | Create | Structural sample |
| `src/posts/2026/05/16/deep-explainer-sample.11tydata.json` | Create | Sidecar |
| `src/posts/2026/05/16/deep-freeform-sample.html` | Create | Structural sample |
| `src/posts/2026/05/16/deep-freeform-sample.11tydata.json` | Create | Sidecar |
| `src/posts/2026/05/16/*` | Overwrite via routine | Real daily-news content replaces samples |

Total ~38 files touched across 3 phases.

---

## PHASE A — Spec + reference docs + SKILL.md

### Task A1: Create directory + freeform reference (smallest, sets the pattern)

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/skills/daily-news/references/archetypes/deep-freeform.md`

- [ ] **Step 1: Create the new directory**

```bash
mkdir -p /Users/bluesky/arsenal/vatt-ghern/skills/daily-news/references/archetypes
```

- [ ] **Step 2: Create `deep-freeform.md`**

```markdown
# Archetype: deep-freeform

The escape hatch. When none of the five structured archetypes fits
cleanly, or when the topic is hybrid, the skill picks `freeform` and
shapes the post by the content's natural rhythm.

## When to pick freeform

Pick when one of these is true:

- Topic is hybrid: part-narrative + part-explainer
- The natural reading order doesn't match any structured archetype's
  H2 sequence
- The story's pivot is structural in a way no archetype captures
  (e.g., "two parallel events turn out to share the same root cause")
- Forcing one of the five would make the prose worse

When in doubt between freeform and a structured archetype, prefer
freeform. A forced fit produces worse content than free shape.

## Required structure (universal contract only)

The skill MUST emit:

- `<h1 class="vg-post-title">` with the post title
- `<p class="vg-deep-opener">` with the hook (a scene, question, or
  reframing — pulls the reader in before technical content begins)
- `<span class="vg-dropcap">` wrapping the first character of the
  first paragraph of the body
- `<p class="vg-deep-closer">` near the end, containing a `<strong>`
  with a closing label (Take-away / Closing thought / Reflection /
  any label that signals "this is the wrap")
- ≥2 inline `<svg>` widgets

Chrome (post-trail, share buttons, bards-note) comes from
`layouts/post.njk` automatically.

## What freeform does NOT allow (banned even here)

- No opener (article starts cold)
- No drop cap (visual rhythm broken)
- No closer (article ends mid-thought)
- Wall-of-text without paragraph breaks
- One SVG or zero (visual budget still applies)

## Example shape (one of many possible)

A 2026-style freeform post on a hybrid topic might look like:

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK}}</p>
  <h1 class="vg-post-title">{{TITLE}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro paragraph}}</p>

  <!-- Free-shaped sections; H2 names, count, and order are unconstrained -->

  <p class="vg-deep-closer"><strong>{{CLOSING_LABEL}}</strong>：{{closing}}</p>
</div>
```

Sidecar JSON:

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "freeform",
  "...": "..."
}
```
```

- [ ] **Step 3: Commit**

```bash
git add skills/daily-news/references/archetypes/deep-freeform.md
git commit -m "feat(skill): add deep-freeform archetype reference"
```

---

### Task A2: Create deep-narrative.md

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/skills/daily-news/references/archetypes/deep-narrative.md`

- [ ] **Step 1: Create the file**

```markdown
# Archetype: deep-narrative

Tells what happened as a time-ordered story.

## When to pick narrative

Pick when the topic is event-driven and has a clear time sequence:

- CVE chains (vulnerability disclosed → exploit appears → patch lands)
- Production-incident postmortems (oncall paged → investigation → fix)
- Acquisition / re-org sagas
- Release-week wrap-ups (release-day → adoption → community reaction)
- Oncall war stories

If the news has a "first this happened, then that happened" rhythm, it
is narrative.

## Required structure

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — a scene, a quote, a question}}</p>
  <h1 class="vg-post-title">{{TITLE}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro paragraph — one
  sentence orienting the reader to what the post is about}}</p>

  <h2>what happened</h2>
  <!-- The factual timeline. Widget #1 typically goes here:
       a timeline SVG or sequence diagram. -->

  <h2>why it matters</h2>
  <!-- Technical context, ramifications. Widget #2 typically goes here:
       architecture sketch, before/after, comparison. -->

  <h2>so what</h2>
  <!-- Industry pattern, related reading, what the reader takes away. -->

  <p class="vg-deep-closer"><strong>Take-away</strong>：{{one sentence
  the reader carries out}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- Exactly 3 H2 elements in the body
- H2 text matches exactly: `what happened`, `why it matters`, `so what`
- Closer label is `Take-away` (with full-width 「：」 separator if
  followed by CJK prose, half-width `:` if followed by English)
- ≥2 inline `<svg>` widgets
- Universal contract from `deep-freeform.md` (opener, dropcap, closer)

## Recommended widgets

1. **Timeline / sequence**: orient the reader in time. ViewBox
   `0 0 480 80` or `0 0 480 120`. Use `<circle>` for events,
   `<line>` for the spine, `<text font-family="EB Garamond, serif">`
   for time labels.
2. **Architecture / before-after**: show what changed in
   the system. ViewBox `0 0 480 200` or wider.

## Sidecar

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "narrative",
  "...": "..."
}
```
```

- [ ] **Step 2: Commit**

```bash
git add skills/daily-news/references/archetypes/deep-narrative.md
git commit -m "feat(skill): add deep-narrative archetype reference"
```

---

### Task A3: Create deep-technical-deep-dive.md

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/skills/daily-news/references/archetypes/deep-technical-deep-dive.md`

- [ ] **Step 1: Create the file**

```markdown
# Archetype: deep-technical-deep-dive

Structural exposition of a new design, algorithm, or protocol. Not
time-ordered. Reader emerges knowing how the thing is composed.

## When to pick technical-deep-dive

Pick when the topic is a *thing* whose internal structure rewards
explanation:

- New Postgres planner internals
- QUIC mechanics, congestion control variant
- New SIMD extension on a CPU
- New ML inference architecture (dual-path KV cache, etc.)
- Novel consensus algorithm
- A library's design philosophy

Distinguish from narrative: narrative says "first X happened, then Y";
technical-deep-dive says "this system has components A, B, C, and they
relate this way." The post does not move through time — it moves
through structure.

## Required structure

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — a counter-intuitive design choice,
  a clever trick, a constraint that drove the design}}</p>
  <h1 class="vg-post-title">{{TITLE}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro — one sentence on
  what this thing is and what problem it solves}}</p>

  <h2>{{COMPONENT_1_NAME}}</h2>
  <!-- First component / concept. Free-named after the actual thing. -->

  <h2>{{COMPONENT_2_NAME}}</h2>
  <!-- Second component. -->

  <h2>{{COMPONENT_3_NAME}}</h2>
  <!-- Third. (3-5 component sections total.) -->

  <p class="vg-deep-closer"><strong>What this enables</strong>：{{one
  sentence on the new capability the components together unlock}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- 3 to 5 H2 elements in the body
- H2 text is free-named (use the actual component / concept name in
  English). **Banned H2 names**: `what happened`, `why it matters`,
  `so what`, `observation`, `the truth`, `how to choose`, `the core
  idea` — these belong to other archetypes.
- Closer label is `What this enables` (not `Take-away` — the
  emphasis is on capability, not conclusion)
- ≥2 inline `<svg>` widgets
- Universal contract from `deep-freeform.md`

## Recommended widgets

1. **Architecture diagram**: show the components and their connections.
   ViewBox `0 0 480 200` or `0 0 720 240`. Boxes for components, lines
   for data flow.
2. **Data viz**: a measurement that proves the design works — throughput,
   memory profile, latency distribution. Real numbers from the source.

## Sidecar

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "technical-deep-dive",
  "...": "..."
}
```
```

- [ ] **Step 2: Commit**

```bash
git add skills/daily-news/references/archetypes/deep-technical-deep-dive.md
git commit -m "feat(skill): add deep-technical-deep-dive archetype reference"
```

---

### Task A4: Create deep-investigation.md

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/skills/daily-news/references/archetypes/deep-investigation.md`

- [ ] **Step 1: Create the file**

```markdown
# Archetype: deep-investigation

A "why is this happening?" inquiry. A counter-intuitive observation
drives the story; hypotheses get falsified one by one until the truth
emerges.

## When to pick investigation

Pick when the news is a puzzle being solved:

- Bug hunts (someone found a weird crash, narrowed it down, found root cause)
- Surprising performance regressions (added cache → got slower; why?)
- Benchmarks that contradict expectation
- Metrics anomalies (sudden 10x traffic, not from any campaign — where from?)

Distinguish from narrative: narrative tells the timeline of what
happened externally. Investigation tells the *inquiry's* internal
structure — what we thought, what we tried, what was wrong, what was
right.

## Required structure

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — the counter-intuitive observation
  itself, stated as the puzzle}}</p>
  <h1 class="vg-post-title">{{TITLE}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro — set up the
  puzzle, hint that "we thought X, it turned out not to be X"}}</p>

  <h2>observation</h2>
  <!-- Describe the puzzle precisely. Widget #1: metrics chart showing
       the surprising thing. -->

  <h2>hypothesis: {{HYPOTHESIS_1_SHORT_NAME}}</h2>
  <!-- What we suspected and why. How we tested it. Why it turned out
       wrong (or partially right). -->

  <h2>hypothesis: {{HYPOTHESIS_2_SHORT_NAME}}</h2>
  <!-- (1 to 3 hypothesis sections total. At least 1 required.) -->

  <h2>the truth</h2>
  <!-- The real root cause. Why it's plausible. Why the wrong
       hypotheses pointed elsewhere. Widget #2: flame graph,
       call stack, or sequence diagram revealing the cause. -->

  <p class="vg-deep-closer"><strong>Take-away</strong>：{{one sentence
  methodology lesson — "next time you see X, look at Y first"}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- H2 sequence: `observation` first, `the truth` last, with one or more
  H2 elements starting with `hypothesis: ` between them
- All H2 text in lowercase English; `hypothesis: ` H2s use the literal
  prefix `hypothesis: ` (lowercase, colon, space) followed by a short
  name
- 1 to 3 `hypothesis: ...` sections
- Closer label is `Take-away`
- ≥2 inline `<svg>` widgets
- Universal contract from `deep-freeform.md`

## Recommended widgets

1. **Metrics chart**: show the anomaly visually. ViewBox commonly
   `0 0 480 160` or `0 0 600 200`. Y-axis for the metric, X-axis for
   time / config / parameter. Mark the surprising point.
2. **Flame graph or call sequence**: reveal the truth. Boxes for
   functions, dashed arrows for the unexpected path.

## Sidecar

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "investigation",
  "...": "..."
}
```
```

- [ ] **Step 2: Commit**

```bash
git add skills/daily-news/references/archetypes/deep-investigation.md
git commit -m "feat(skill): add deep-investigation archetype reference"
```

---

### Task A5: Create deep-comparison.md

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/skills/daily-news/references/archetypes/deep-comparison.md`

- [ ] **Step 1: Create the file**

```markdown
# Archetype: deep-comparison

Two or more options laid side by side to help the reader choose.

## When to pick comparison

Pick when the topic is a selection / migration / shootout:

- A vs B selection (Redis vs DragonFly, Postgres vs ClickHouse for X)
- Version-N vs version-M migration ("should I upgrade to Postgres 17?")
- Library shootouts (which gRPC implementation, which HTTP client)
- Tooling decisions (which CI? which container runtime?)

Distinguish from technical-deep-dive: deep-dive explains ONE thing.
Comparison weighs MULTIPLE things and reaches a recommendation.

## Required structure

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — why this comparison matters
  *now* (a deadline, a deprecation, a release that changes the
  calculation)}}</p>
  <h1 class="vg-post-title">{{TITLE — typically contains "vs" or
  "之間如何選"}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro — name the options
  by full name, state the selection stakes}}</p>

  <!-- An at-a-glance comparison widget: HTML <table> or
       SVG with class "vg-w-comparison-*" — required (see below). -->

  <h2>dimension: {{DIMENSION_1_NAME}}</h2>
  <!-- e.g., "dimension: write throughput" or "dimension: developer
       ergonomics". How each option fares on this axis. -->

  <h2>dimension: {{DIMENSION_2_NAME}}</h2>

  <h2>dimension: {{DIMENSION_3_NAME}}</h2>
  <!-- 3 to 5 dimension sections required. -->

  <h2>how to choose</h2>
  <!-- The decision. "If your situation is X, pick A; if Y, pick B."
       Concrete enough that a reader can self-classify and walk away
       with the answer. -->

  <p class="vg-deep-closer"><strong>Take-away</strong>：{{one sentence —
  typically "for 80% of cases pick X; only in scenario Z does Y win"}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- ≥3 H2 elements matching `dimension: ...` (lowercase prefix, colon,
  space, then the dimension name)
- Exactly 1 H2 with text `how to choose`
- `how to choose` must be the last H2 before the closer
- Total H2 count: 4 to 6 (3-5 dimensions + 1 how-to-choose)
- ≥1 HTML `<table>` element OR ≥1 `<svg>` with a class matching
  `vg-w-comparison-*`
- Closer label is `Take-away`
- ≥2 inline `<svg>` widgets total (the comparison-shaped one counts)
- Universal contract from `deep-freeform.md`

## Recommended widgets

1. **At-a-glance comparison**: HTML `<table>` with rows for criteria
   and columns for options, OR SVG row-of-cells with checks/X marks.
2. **Per-dimension visualization**: in one of the dimension H2 sections,
   a chart that visualizes the gap (throughput bars, latency CDFs).

## Sidecar

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "comparison",
  "...": "..."
}
```
```

- [ ] **Step 2: Commit**

```bash
git add skills/daily-news/references/archetypes/deep-comparison.md
git commit -m "feat(skill): add deep-comparison archetype reference"
```

---

### Task A6: Create deep-explainer.md

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/skills/daily-news/references/archetypes/deep-explainer.md`

- [ ] **Step 1: Create the file**

```markdown
# Archetype: deep-explainer

Explains a concept from zero. Does NOT assume the reader knows the
prerequisites.

## When to pick explainer

Pick when the news triggers "what is X" — that is, the news depends on
a concept readers may not yet have:

- "What is CRDT" (because some new database uses CRDTs)
- "What is io_uring" (because some new performance trick relies on it)
- "Zero-knowledge proofs in plain words" (because some new protocol uses ZK)
- "SIMD, intuitively" (because some new compiler optimization vectorizes)
- New paradigm or technique becoming mainstream

Distinguish from technical-deep-dive: deep-dive assumes the reader
knows the surrounding concepts and explores ONE specific implementation
of an established idea. Explainer assumes the reader knows little and
walks them up the abstraction ladder.

## Required structure

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — "if you don't know X, you probably
  think it's Y" or "imagine the situation where..."}}</p>
  <h1 class="vg-post-title">{{TITLE — typically "what is X" or
  "X, in plain words"}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro — one sentence on
  what the reader will know after reading}}</p>

  <h2>start with a concrete case</h2>
  <!-- A scenario the reader already understands. No new concepts yet. -->

  <h2>where today's tools fall short</h2>
  <!-- Show why existing approaches fail to solve the scenario well. -->

  <h2>the core idea</h2>
  <!-- The new concept stated plainly. Widget #1: conceptual diagram. -->

  <h2>what it actually looks like</h2>
  <!-- Concrete example: simplified code or a worked example.
       Widget #2: before/after or worked-example diagram. -->

  <h2>when you'd reach for it</h2>
  <!-- Real situations where the concept earns its place. Limits and
       trade-offs. -->

  <p class="vg-deep-closer"><strong>Take-away</strong>：{{one-line
  mental model — the sentence the reader keeps}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- Exactly 5 H2 elements in the body
- H2 text matches exactly, in this exact order:
  1. `start with a concrete case`
  2. `where today's tools fall short`
  3. `the core idea`
  4. `what it actually looks like`
  5. `when you'd reach for it`
- The `what it actually looks like` section must contain a
  `<pre><code>...</code></pre>` OR an inline `<svg>` (a worked
  example must be concrete, not just prose)
- Closer label is `Take-away`
- ≥2 inline `<svg>` widgets
- Universal contract from `deep-freeform.md`

## Recommended widgets

1. **Conceptual diagram**: in `the core idea`. Visualizes the new
   abstraction at its most distilled form. Boxes, arrows, labels in
   plain words.
2. **Before/after or worked example**: in `what it actually looks like`.
   Shows the old approach next to the new approach, OR walks through
   one concrete instance step by step.

## Sidecar

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "explainer",
  "...": "..."
}
```
```

- [ ] **Step 2: Commit**

```bash
git add skills/daily-news/references/archetypes/deep-explainer.md
git commit -m "feat(skill): add deep-explainer archetype reference"
```

---

### Task A7: Rewrite archetypes.md to overview + roundup + pointers

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/skills/daily-news/references/archetypes.md`

- [ ] **Step 1: Replace the entire file with this content**

```markdown
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

**Domain grouping**: when a day has items spanning 3+ domains, group items
visually by domain. Insert a `<header>` between items of different domains:

```html
<header class="vg-roundup-section-label" aria-hidden="true">
  <span class="vg-roundup-section-name">SYSTEMS</span>
</header>
```

The section-name is the domain in uppercase (one of: AI, SYSTEMS, INFRA,
STORAGE, INDUSTRY). The first domain's section header is omitted (header
appears only when domain CHANGES).

### Content rules

- `TITLE` format: `YYYY.MM.DD —— 今日 N 則`. Use the actual N, not 10
  if fewer items qualified.
- Lede names today's thread in one sentence — the *one* signal across all
  items. Example: "今日主旋律：io_uring CVE 連環爆 + Cloudflare DNS 服務改版"
- Item lede is 2-3 sentences. First sentence = what happened. Second = why
  an engineer cares. Optional third = a concrete number or quote.
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
```

- [ ] **Step 2: Verify the file is now ~150 lines (was ~210)**

```bash
wc -l /Users/bluesky/arsenal/vatt-ghern/skills/daily-news/references/archetypes.md
```

Expected: ~150 lines.

- [ ] **Step 3: Commit**

```bash
git add skills/daily-news/references/archetypes.md
git commit -m "refactor(skill): shrink archetypes.md to overview + roundup + pointers"
```

---

### Task A8: Update SKILL.md Step 4 (domain coverage rules)

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/skills/daily-news/SKILL.md`

- [ ] **Step 1: Replace the existing Step 4 block**

Find the existing block in `skills/daily-news/SKILL.md`:

```markdown
### Step 4: Pick today's 10

Select top 10 by score with constraint: **≥3 distinct domains represented**.
If a single-domain day is genuinely the truth (e.g., model-release Friday),
accept fewer than 10 rather than padding with low-quality items.

Assign final `news_id` values as `YYYY-MM-DD-NN` (zero-padded) in
ranked order.
```

Replace with:

```markdown
### Step 4: Pick today's items (domain coverage)

Aim: all 5 priority domains represented (ai / systems / infra / storage /
industry). Hard floor: ≥4 distinct domains. Per-domain cap: ≤6 items.

**Selection algorithm**:

1. Sort all candidates by score, descending.
2. Take top items in score order until 10 selected.
3. If fewer than 4 domains represented in the selected 10:
   - For each uncovered domain, find the highest-score candidate in
     that domain
   - SWAP it in for the lowest-score selected item from an
     over-represented domain
   - Repeat until ≥4 domains met
4. If any domain has >6 items in the selected list (over the cap):
   - Drop the lowest-score items in that domain until count is 6
   - If those drops bring total below 10, swap in the highest-score
     candidates from under-represented domains until 10 or until no
     candidates remain
5. If exhaustive search shows no qualifying candidate for ≥2 domains
   (genuine sparse day), accept fewer items rather than padding with
   garbage. Log skipped domains in the PR body under "Domains skipped
   today".

Assign final `news_id` values as `YYYY-MM-DD-NN` (zero-padded) in
ranked order.

**PR body must list**:
- Domain distribution (e.g., "AI · 3 · SYSTEMS · 3 · INFRA · 2 ·
  STORAGE · 1 · INDUSTRY · 1")
- Any domain skipped (with reason: no qualifying candidates / all
  candidates failed dedup / etc.)
- Any domain that hit the cap and had candidates dropped (e.g.,
  "8 qualifying items in AI today, top 6 selected")
```

- [ ] **Step 2: Commit**

```bash
git add skills/daily-news/SKILL.md
git commit -m "feat(skill): tighten Step 4 — aim 5 / floor 4 / cap 6 per domain"
```

---

### Task A9: Update SKILL.md Step 5 (archetype decision tree)

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/skills/daily-news/SKILL.md`

- [ ] **Step 1: Replace the existing Step 5 block**

Find the existing block:

```markdown
### Step 5: Pick deep-story candidates

From today's 10, select up to 3 deep-story candidates satisfying ALL:

- Score ≥ 8
- Source has drillable depth (long-form, paper, RFC, design doc — not press
  release)
- Different domains where possible

Cross-check against `past_deep_titles` (Jaccard > 0.70 = drop). If fewer
than 3 qualify, write fewer. Never recycle a past deep-story topic to hit 3.
```

Replace with:

```markdown
### Step 5: Pick deep-story candidates + choose archetype

For each candidate scoring ≥8 from Step 4, decide:

**a. Worth a deep-story?**

YES if all of:
- Source has drillable depth (long-form blog, paper, RFC, design doc,
  postmortem, repo with substantial README/docs)
- Topic genuinely benefits from 600-1200 lines of treatment
- Not duplicate-similar to a past `past_deep_titles` entry (Jaccard
  bigram similarity ≤ 0.70)

**b. If yes, which archetype fits?**

Decision tree:

| Signal | Pick |
|---|---|
| Time-ordered story of an event | `narrative` |
| Structural exposition of a new design / algorithm / protocol | `technical-deep-dive` |
| "Why is this happening?" puzzle with hypotheses | `investigation` |
| Two or more options to choose between | `comparison` |
| Reader may not know what X even is, concept needs explained | `explainer` |
| None fit cleanly, or fits multiple awkwardly, or hybrid | `freeform` |

**IMPORTANT**: Archetypes are SUGGESTIONS. When in doubt — or when
forcing a structured archetype would worsen the prose — pick
`freeform`. A forced fit produces worse content than free shape.

**c. Selection constraints when writing up to 3**:

- All 3 must score ≥8
- ≥2 distinct domains required if writing 3 (≥1 if writing 2)
- ≥2 distinct archetypes required if writing 3 (avoid "3 narratives in
  a row"); `freeform` counts as its own archetype for diversity
- If candidates cannot satisfy domain + archetype diversity, write
  fewer (2 or 1). Do not force.

After picking each archetype, read the corresponding detail file for the
structure rules to follow when writing:

- `${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/archetypes/deep-narrative.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/archetypes/deep-technical-deep-dive.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/archetypes/deep-investigation.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/archetypes/deep-comparison.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/archetypes/deep-explainer.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/archetypes/deep-freeform.md`
```

- [ ] **Step 2: Commit**

```bash
git add skills/daily-news/SKILL.md
git commit -m "feat(skill): rewrite Step 5 — archetype decision tree + 6 archetypes"
```

---

### Task A10: Update SKILL.md Step 7 (write deep-story HTML)

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/skills/daily-news/SKILL.md`

- [ ] **Step 1: Replace the existing Step 7 block**

Find the existing block:

```markdown
### Step 7: Write each deep-story HTML + sidecar (×N where N ≤ 3)

For each deep-story candidate, do additional WebFetch on the canonical
source to gather technical detail (RFC excerpts, code samples, real
numbers). Read the skeleton at
`${CLAUDE_PLUGIN_ROOT}/src/archetypes/daily-deep-story.html`. Author
following `references/archetypes.md` § "Archetype 2".

Each deep-story file:

- Path: `src/posts/YYYY/MM/DD/deep-<kebab-slug>.html`
- Sidecar: `news_ids` references exactly one item from today's roundup;
  `related_roundup` is set to `/YYYY/MM/DD/roundup/`
- Body contains opener → drop-cap intro → three H2 acts → take-away closer
- ≥2 inline SVG widgets (timeline, architecture, comparison, data viz)
```

Replace with:

```markdown
### Step 7: Write each deep-story HTML + sidecar (×N where N ≤ 3)

For each deep-story candidate, do additional WebFetch on the canonical
source to gather technical detail (RFC excerpts, code samples, real
numbers).

Read the archetype reference file picked in Step 5:
`${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/archetypes/deep-<archetype>.md`.

It contains the required structure (H2 sequence, widget budget, closer
label) for that specific archetype. Follow it.

Each deep-story file:

- Path: `src/posts/YYYY/MM/DD/deep-<kebab-slug>.html`
- Sidecar: `news_ids` references exactly one item from today's roundup;
  `related_roundup` is set to `/YYYY/MM/DD/roundup/`; `archetype` is
  `"daily-deep-story"`; **`deep_archetype` is the value picked in Step 5**
- Body matches the picked archetype's required structure exactly
- ≥2 inline SVG widgets (per archetype-specific widget recommendations)
- Universal contract from `deep-freeform.md` applies to all archetypes:
  opener (`<p class="vg-deep-opener">`), drop-cap in first paragraph,
  closer (`<p class="vg-deep-closer">` with `<strong>` inside)
```

- [ ] **Step 2: Commit**

```bash
git add skills/daily-news/SKILL.md
git commit -m "feat(skill): rewrite Step 7 — per-archetype reference loading"
```

---

### Task A11: Update SKILL.md PR body template

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/skills/daily-news/SKILL.md`

- [ ] **Step 1: Replace the existing "## 來源使用" section in the PR body template**

Find this block in the PR body template within Step 9:

```markdown
## 來源使用

- HackerNoon: 18 candidates → 4 selected
- Hacker News: 12 candidates → 2 selected
- Cloudflare blog: 5 candidates → 1 selected
- ...
- Failed: (none) or list of failed-fetch sources
```

Replace with:

```markdown
## Domain distribution

AI · 3 · SYSTEMS · 3 · INFRA · 2 · STORAGE · 1 · INDUSTRY · 1

## Domains skipped today

- (none) — or list each: e.g., "STORAGE: no qualifying candidates"

## Domains capped (≤6 rule)

- (none) — or list e.g., "AI: 8 qualifying, top 6 selected"

## 來源使用

- HackerNoon: 18 candidates → 4 selected
- Hacker News: 12 candidates → 2 selected
- Cloudflare blog: 5 candidates → 1 selected
- ...
- Failed: (none) or list of failed-fetch sources
```

Also add a new section to the PR body template, right after "Visual Concerns" and before "## Preview":

```markdown
## Deep-story archetypes used today

- {{deep_title_1}} — `narrative`
- {{deep_title_2}} — `technical-deep-dive`
- {{deep_title_3}} — `freeform` (hybrid topic, no structured archetype fit cleanly)
```

- [ ] **Step 2: Commit**

```bash
git add skills/daily-news/SKILL.md
git commit -m "feat(skill): PR body template — domain + archetype reporting"
```

---

### Task A12: Phase A verification

- [ ] **Step 1: Confirm no skill regression by running existing scripts**

```bash
cd /Users/bluesky/arsenal/vatt-ghern
node skills/daily-news/scripts/load-context.mjs >/dev/null && echo "load-context ok"
node skills/daily-news/scripts/check-dup.mjs src/posts/2026/05/16/ && echo "check-dup ok"
node skills/daily-news/scripts/publish.mjs src/posts/2026/05/16/ && echo "publish ok"
```

Expected: all three echo "ok".

- [ ] **Step 2: Verify all 6 archetype reference docs exist**

```bash
ls skills/daily-news/references/archetypes/
```

Expected output (alphabetical):
```
deep-comparison.md
deep-explainer.md
deep-freeform.md
deep-investigation.md
deep-narrative.md
deep-technical-deep-dive.md
```

- [ ] **Step 3: Verify SKILL.md word count is still within budget**

```bash
wc -w skills/daily-news/SKILL.md
```

Expected: <2500 words (rough budget; current target 1500-2000 per skill-creator guidance).

If it grew past 2500, move any procedural elaboration to a new reference
file. Do NOT shrink by removing required steps.

- [ ] **Step 4: Build + lint still pass**

```bash
npm run clean && npm run build && npm run lint:html
```

Expected: build wrote ~11 files, html-validate clean.

**Phase A exit criteria**: 6 archetype reference docs exist, SKILL.md
references them, scripts still pass on existing sample posts, build clean.

---

## PHASE B — `/archetypes/` page + check rewrite

### Task B1: Add archetypes nav item

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/src/_data/site.js`

- [ ] **Step 1: Replace the nav array**

Find:

```javascript
  nav: [
    { href: "/", label: "today" },
    { href: "/archive/", label: "archive" },
    { href: "/topics/", label: "topics", showIfTopics: true },
    { href: "/tags/", label: "tags" },
    { href: "/feed.xml", label: "feed" },
  ],
```

Replace with:

```javascript
  nav: [
    { href: "/", label: "today" },
    { href: "/archive/", label: "archive" },
    { href: "/topics/", label: "topics", showIfTopics: true },
    { href: "/tags/", label: "tags" },
    { href: "/archetypes/", label: "archetypes" },
    { href: "/feed.xml", label: "feed" },
  ],
```

- [ ] **Step 2: Build (page does not exist yet, link will 404 — that's fine until B7)**

```bash
npm run build
```

Expected: build clean.

- [ ] **Step 3: Commit**

```bash
git add src/_data/site.js
git commit -m "feat(nav): add archetypes link (page coming in B7)"
```

---

### Task B2: Create archetype.njk layout

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/_includes/layouts/archetype.njk`

- [ ] **Step 1: Create the layout file**

```html
---
layout: layouts/base.njk
bodyClass: "vg-archetype-page"
---
<article class="vg-archetype">
  <nav class="vg-archetype-trail" aria-label="catalog chrome">
    <a class="vg-crumb-link" href="/archetypes/">← archetype catalog</a>
    <span class="vg-sep" aria-hidden="true">·</span>
    <span>{{ archetypeName }}</span>
  </nav>

  <header class="vg-archetype-hero">
    <h1 class="vg-post-title">{{ archetypeName }}</h1>
    <p class="vg-archetype-tagline">{{ tagline }}</p>
  </header>

  <div class="vg-archetype-body">
    {{ content | safe }}
  </div>

  {% set sampleArchetype = deepArchetypeFilter or archetypeName %}
  {% set realExamples = [] %}
  {% for post in collections.posts %}
    {% if post.data.deep_archetype == sampleArchetype %}
      {% set realExamples = (realExamples.push(post), realExamples) %}
    {% endif %}
    {% if archetypeName == "daily-roundup" and post.data.archetype == "daily-roundup" %}
      {% set realExamples = (realExamples.push(post), realExamples) %}
    {% endif %}
  {% endfor %}

  {% if realExamples.length > 0 %}
    <section class="vg-archetype-examples" aria-label="real examples">
      <h2>Posts using this archetype</h2>
      <ul>
        {% for post in realExamples %}
          <li>
            <span class="vg-archetype-example-date">{{ post.data.date | dateMD }}</span>
            <a href="{{ post.url }}">{{ post.data.title }}</a>
          </li>
        {% endfor %}
      </ul>
    </section>
  {% endif %}
</article>
```

- [ ] **Step 2: Commit (no build yet — page files don't exist)**

```bash
git add src/_includes/layouts/archetype.njk
git commit -m "feat(layout): archetype detail page layout with real-examples filter"
```

---

### Task B3: Rewrite src/archetypes/archetypes.11tydata.json

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/src/archetypes/archetypes.11tydata.json`

This file currently excludes archetype files from collections and disables permalinks. We now want them rendered.

- [ ] **Step 1: Replace the entire file**

```json
{
  "layout": "layouts/archetype.njk",
  "permalink": "/archetypes/{{ page.fileSlug }}/",
  "eleventyExcludeFromCollections": true
}
```

(`eleventyExcludeFromCollections: true` is preserved so the archetype pages don't appear in `collections.posts` — they're catalog pages, not posts.)

- [ ] **Step 2: Build (still will produce nothing useful until the per-file sidecars are updated in subsequent tasks)**

```bash
npm run build
```

Expected: build wrote files. Some archetype files may render now with raw "TODO" markup — that's fine, we rewrite them in B4-B9.

- [ ] **Step 3: Commit**

```bash
git add src/archetypes/archetypes.11tydata.json
git commit -m "feat(archetypes): enable rendering with archetype layout + permalink"
```

---

### Task B4: Rewrite src/archetypes/daily-roundup.html + sidecar

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/src/archetypes/daily-roundup.html`
- Modify: `/Users/bluesky/arsenal/vatt-ghern/src/archetypes/daily-roundup.11tydata.json`

- [ ] **Step 1: Replace `daily-roundup.11tydata.json`**

```json
{
  "title": "daily-roundup archetype",
  "archetypeName": "daily-roundup",
  "tagline": "The day's index. Roughly 10 items spanning 4-5 priority domains, designed for a 3-minute scan."
}
```

- [ ] **Step 2: Replace `daily-roundup.html` body**

```html
<svg class="vg-archetype-silhouette" viewBox="0 0 120 72" role="img" aria-label="daily-roundup silhouette">
  <g fill="none" stroke="currentColor" stroke-width="1.2">
    <rect x="10" y="10" width="100" height="5" />
    <rect x="10" y="18" width="100" height="5" />
    <rect x="10" y="26" width="100" height="5" />
    <rect x="10" y="34" width="100" height="5" />
    <rect x="10" y="42" width="100" height="5" />
    <rect x="10" y="50" width="100" height="5" />
    <rect x="10" y="58" width="100" height="5" />
  </g>
</svg>

<section class="vg-archetype-spec">
  <h2>Required structure</h2>
  <ul>
    <li>Hero with <code>vg-roundup-hero</code> wrapping the title and one-sentence today-thread lede</li>
    <li>Stats section with a domain-distribution donut SVG</li>
    <li>Item list, each card with <code>id="item-NN"</code> (zero-padded), <code>data-vg-readkey-item</code>, title, 2-3 sentence lede, source link</li>
    <li>Section labels between domain transitions when items span 3+ domains</li>
    <li>"Today's deep reads" section linking to each deep-story</li>
  </ul>

  <h2>Visual differentiation</h2>
  <ul>
    <li>Items with deep-stories get <code>vg-card-roundup-has-deep</code> modifier → sage "↗ deep" corner mark</li>
    <li>Domain transitions get <code>vg-roundup-section-label</code> headers (omitted for the first domain)</li>
  </ul>

  <h2>Widget budget</h2>
  <p>1 SVG required (the domain-distribution donut). Optional: source-distribution bar, top-tags cloud.</p>

  <h2>Reference file</h2>
  <p>Full spec: <code>skills/daily-news/references/archetypes.md</code> § "Roundup spec".</p>
</section>
```

- [ ] **Step 3: Build and verify the page renders**

```bash
npm run clean && npm run build
ls _site/archetypes/daily-roundup/
```

Expected: directory contains `index.html`.

- [ ] **Step 4: Commit**

```bash
git add src/archetypes/daily-roundup.html src/archetypes/daily-roundup.11tydata.json
git commit -m "feat(archetypes): daily-roundup catalog page"
```

---

### Task B5: Create deep-narrative.html + sidecar

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/archetypes/deep-narrative.html`
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/archetypes/deep-narrative.11tydata.json`
- Delete: `/Users/bluesky/arsenal/vatt-ghern/src/archetypes/daily-deep-story.html` (replaced by per-archetype pages)
- Delete: `/Users/bluesky/arsenal/vatt-ghern/src/archetypes/daily-deep-story.11tydata.json`

- [ ] **Step 1: Remove the old generic deep-story archetype files**

```bash
rm /Users/bluesky/arsenal/vatt-ghern/src/archetypes/daily-deep-story.html
rm /Users/bluesky/arsenal/vatt-ghern/src/archetypes/daily-deep-story.11tydata.json
```

- [ ] **Step 2: Create `deep-narrative.11tydata.json`**

```json
{
  "title": "deep-narrative archetype",
  "archetypeName": "deep-narrative",
  "deepArchetypeFilter": "narrative",
  "tagline": "Time-ordered event story: incident, CVE chain, release week. The reader follows what happened, then sees why, then walks away with what it means."
}
```

- [ ] **Step 3: Create `deep-narrative.html`**

```html
<svg class="vg-archetype-silhouette" viewBox="0 0 120 72" role="img" aria-label="deep-narrative silhouette">
  <g fill="none" stroke="currentColor" stroke-width="1.2">
    <circle cx="14" cy="14" r="3" fill="currentColor"/>
    <rect x="22" y="10" width="26" height="20" />
    <path d="M 50 20 L 56 20" />
    <path d="M 54 17 L 56 20 L 54 23" />
    <rect x="58" y="10" width="26" height="20" />
    <path d="M 86 20 L 92 20" />
    <path d="M 90 17 L 92 20 L 90 23" />
    <rect x="94" y="10" width="22" height="20" />
    <rect x="22" y="44" width="94" height="20" stroke-dasharray="2 2" />
  </g>
</svg>

<section class="vg-archetype-spec">
  <h2>When to pick narrative</h2>
  <p>Pick when the topic is event-driven and has a clear time sequence: CVE chains, production-incident postmortems, acquisition sagas, release-week wrap-ups, oncall war stories.</p>

  <h2>Required H2 sequence</h2>
  <ol>
    <li><code>what happened</code></li>
    <li><code>why it matters</code></li>
    <li><code>so what</code></li>
  </ol>
  <p>Exactly 3 H2 elements. No additional or missing sections.</p>

  <h2>Closer label</h2>
  <p><code>Take-away</code> — one sentence the reader carries out.</p>

  <h2>Widget budget</h2>
  <ul>
    <li>≥2 inline <code>&lt;svg&gt;</code> widgets</li>
    <li>Recommended: timeline / sequence in "what happened", architecture / before-after in "why it matters"</li>
  </ul>

  <h2>Reference file</h2>
  <p>Full spec: <code>skills/daily-news/references/archetypes/deep-narrative.md</code></p>
</section>
```

- [ ] **Step 4: Build and verify**

```bash
npm run clean && npm run build
ls _site/archetypes/deep-narrative/
```

Expected: directory contains `index.html`.

- [ ] **Step 5: Commit**

```bash
git add src/archetypes/deep-narrative.html src/archetypes/deep-narrative.11tydata.json
git add -u src/archetypes/  # captures the deletions
git commit -m "feat(archetypes): deep-narrative catalog page; remove old generic deep-story"
```

---

### Task B6: Create remaining 5 deep-* catalog pages (deep-technical-deep-dive, deep-investigation, deep-comparison, deep-explainer, deep-freeform)

**Files:**
- Create: 10 files (5 HTML + 5 sidecars) under `src/archetypes/`

This task batches the remaining 5 archetype catalog pages since they all follow the same structure (silhouette SVG + spec section).

- [ ] **Step 1: Create `deep-technical-deep-dive.11tydata.json`**

```json
{
  "title": "deep-technical-deep-dive archetype",
  "archetypeName": "deep-technical-deep-dive",
  "deepArchetypeFilter": "technical-deep-dive",
  "tagline": "Structural exposition: a new design, algorithm, or protocol. The reader emerges knowing how the thing is composed."
}
```

- [ ] **Step 2: Create `deep-technical-deep-dive.html`**

```html
<svg class="vg-archetype-silhouette" viewBox="0 0 120 72" role="img" aria-label="deep-technical-deep-dive silhouette">
  <g fill="none" stroke="currentColor" stroke-width="1.2">
    <rect x="42" y="10" width="36" height="14" />
    <line x1="60" y1="24" x2="60" y2="32" />
    <rect x="18" y="34" width="30" height="14" />
    <rect x="72" y="34" width="30" height="14" />
    <line x1="33" y1="48" x2="33" y2="54" />
    <line x1="87" y1="48" x2="87" y2="54" />
    <rect x="18" y="56" width="84" height="10" />
    <line x1="48" y1="24" x2="33" y2="34" />
    <line x1="72" y1="24" x2="87" y2="34" />
  </g>
</svg>

<section class="vg-archetype-spec">
  <h2>When to pick technical-deep-dive</h2>
  <p>Pick when the topic is a *thing* whose internal structure rewards explanation: new Postgres planner internals, QUIC mechanics, new SIMD extension, ML inference architecture, novel consensus algorithm.</p>

  <h2>H2 sequence</h2>
  <p>3 to 5 H2 elements, free-named after the actual components or concepts (in English). Examples: "Dual-path KV cache", "Speculative diffusion head", "Verification gate".</p>
  <p><strong>Banned H2 names</strong> (belong to other archetypes): <code>what happened</code>, <code>why it matters</code>, <code>so what</code>, <code>observation</code>, <code>the truth</code>, <code>how to choose</code>, <code>the core idea</code>.</p>

  <h2>Closer label</h2>
  <p><code>What this enables</code> — emphasizes the new capability the components together unlock, not the conclusion.</p>

  <h2>Widget budget</h2>
  <ul>
    <li>≥2 inline <code>&lt;svg&gt;</code> widgets</li>
    <li>Recommended: architecture diagram + data viz (throughput, memory profile, latency)</li>
  </ul>

  <h2>Reference file</h2>
  <p>Full spec: <code>skills/daily-news/references/archetypes/deep-technical-deep-dive.md</code></p>
</section>
```

- [ ] **Step 3: Create `deep-investigation.11tydata.json`**

```json
{
  "title": "deep-investigation archetype",
  "archetypeName": "deep-investigation",
  "deepArchetypeFilter": "investigation",
  "tagline": "A 'why is this happening?' inquiry. The reader follows hypotheses being falsified one by one until the truth emerges."
}
```

- [ ] **Step 4: Create `deep-investigation.html`**

```html
<svg class="vg-archetype-silhouette" viewBox="0 0 120 72" role="img" aria-label="deep-investigation silhouette">
  <g fill="none" stroke="currentColor" stroke-width="1.2">
    <rect x="10" y="10" width="28" height="16" stroke-dasharray="3 2"/>
    <path d="M 16 14 L 32 22 M 32 14 L 16 22" />
    <rect x="46" y="10" width="28" height="16" stroke-dasharray="3 2"/>
    <path d="M 52 14 L 68 22 M 68 14 L 52 22" />
    <rect x="82" y="10" width="28" height="16" stroke-dasharray="3 2"/>
    <path d="M 88 14 L 104 22 M 104 14 L 88 22" />
    <line x1="24" y1="32" x2="60" y2="44" />
    <line x1="60" y1="32" x2="60" y2="44" />
    <line x1="96" y1="32" x2="60" y2="44" />
    <rect x="42" y="46" width="36" height="20" fill="currentColor" opacity="0.18"/>
    <rect x="42" y="46" width="36" height="20"/>
  </g>
</svg>

<section class="vg-archetype-spec">
  <h2>When to pick investigation</h2>
  <p>Pick when the news is a puzzle being solved: bug hunts, surprising performance regressions, benchmarks that contradict expectation, metrics anomalies.</p>

  <h2>Required H2 sequence</h2>
  <ol>
    <li><code>observation</code></li>
    <li><code>hypothesis: {{name}}</code> (1 to 3 instances)</li>
    <li><code>the truth</code></li>
  </ol>

  <h2>Closer label</h2>
  <p><code>Take-away</code> — methodology lesson ("next time you see X, look at Y first").</p>

  <h2>Widget budget</h2>
  <ul>
    <li>≥2 inline <code>&lt;svg&gt;</code> widgets</li>
    <li>Recommended: metrics chart in "observation", flame graph / sequence in "the truth"</li>
  </ul>

  <h2>Reference file</h2>
  <p>Full spec: <code>skills/daily-news/references/archetypes/deep-investigation.md</code></p>
</section>
```

- [ ] **Step 5: Create `deep-comparison.11tydata.json`**

```json
{
  "title": "deep-comparison archetype",
  "archetypeName": "deep-comparison",
  "deepArchetypeFilter": "comparison",
  "tagline": "Two or more options side by side. The reader walks in undecided and walks out with a recommendation."
}
```

- [ ] **Step 6: Create `deep-comparison.html`**

```html
<svg class="vg-archetype-silhouette" viewBox="0 0 120 72" role="img" aria-label="deep-comparison silhouette">
  <g fill="none" stroke="currentColor" stroke-width="1.2">
    <rect x="10" y="10" width="48" height="44" />
    <rect x="62" y="10" width="48" height="44" />
    <line x1="10" y1="22" x2="58" y2="22" />
    <line x1="62" y1="22" x2="110" y2="22" />
    <line x1="10" y1="34" x2="58" y2="34" />
    <line x1="62" y1="34" x2="110" y2="34" />
    <line x1="10" y1="46" x2="58" y2="46" />
    <line x1="62" y1="46" x2="110" y2="46" />
    <line x1="34" y1="56" x2="34" y2="64" />
    <line x1="30" y1="60" x2="34" y2="64" />
    <line x1="38" y1="60" x2="34" y2="64" />
  </g>
</svg>

<section class="vg-archetype-spec">
  <h2>When to pick comparison</h2>
  <p>Pick when the topic is a selection / migration / shootout: A vs B selection, version-N vs version-M migration, library shootouts, tooling decisions.</p>

  <h2>Required H2 sequence</h2>
  <ol>
    <li><code>dimension: {{name}}</code> (3 to 5 instances)</li>
    <li><code>how to choose</code> (mandatory, must be last before closer)</li>
  </ol>

  <h2>Required widget shape</h2>
  <p>At least one HTML <code>&lt;table&gt;</code> OR one <code>&lt;svg class="vg-w-comparison-*"&gt;</code> visualizing the side-by-side comparison.</p>

  <h2>Closer label</h2>
  <p><code>Take-away</code> — typically "for 80% of cases pick X; only in scenario Z does Y win".</p>

  <h2>Widget budget</h2>
  <ul>
    <li>≥2 inline widgets total (the comparison-shaped one counts as one)</li>
  </ul>

  <h2>Reference file</h2>
  <p>Full spec: <code>skills/daily-news/references/archetypes/deep-comparison.md</code></p>
</section>
```

- [ ] **Step 7: Create `deep-explainer.11tydata.json`**

```json
{
  "title": "deep-explainer archetype",
  "archetypeName": "deep-explainer",
  "deepArchetypeFilter": "explainer",
  "tagline": "Explains a concept from zero. The reader needs no prerequisites; the post walks them up the abstraction ladder."
}
```

- [ ] **Step 8: Create `deep-explainer.html`**

```html
<svg class="vg-archetype-silhouette" viewBox="0 0 120 72" role="img" aria-label="deep-explainer silhouette">
  <g fill="none" stroke="currentColor" stroke-width="1.2">
    <rect x="6" y="50" width="20" height="14" />
    <rect x="28" y="42" width="20" height="14" />
    <rect x="50" y="32" width="20" height="14" />
    <rect x="72" y="22" width="20" height="14" />
    <rect x="94" y="12" width="20" height="14" />
  </g>
</svg>

<section class="vg-archetype-spec">
  <h2>When to pick explainer</h2>
  <p>Pick when the news triggers "what is X" — the news depends on a concept readers may not yet have: "what is CRDT", "what is io_uring", "zero-knowledge proofs in plain words".</p>

  <h2>Required H2 sequence (exact, in this order)</h2>
  <ol>
    <li><code>start with a concrete case</code></li>
    <li><code>where today's tools fall short</code></li>
    <li><code>the core idea</code></li>
    <li><code>what it actually looks like</code></li>
    <li><code>when you'd reach for it</code></li>
  </ol>

  <h2>Required worked example</h2>
  <p>"What it actually looks like" section must contain a <code>&lt;pre&gt;&lt;code&gt;</code> OR an inline <code>&lt;svg&gt;</code> — concrete, not just prose.</p>

  <h2>Closer label</h2>
  <p><code>Take-away</code> — the one-line mental model the reader keeps.</p>

  <h2>Widget budget</h2>
  <ul>
    <li>≥2 inline <code>&lt;svg&gt;</code> widgets</li>
    <li>Recommended: conceptual diagram in "the core idea", before/after in "what it actually looks like"</li>
  </ul>

  <h2>Reference file</h2>
  <p>Full spec: <code>skills/daily-news/references/archetypes/deep-explainer.md</code></p>
</section>
```

- [ ] **Step 9: Create `deep-freeform.11tydata.json`**

```json
{
  "title": "deep-freeform archetype",
  "archetypeName": "deep-freeform",
  "deepArchetypeFilter": "freeform",
  "tagline": "The escape hatch. When none of the structured archetypes fit cleanly, or the topic is hybrid, free shape beats forced shape."
}
```

- [ ] **Step 10: Create `deep-freeform.html`**

```html
<svg class="vg-archetype-silhouette" viewBox="0 0 120 72" role="img" aria-label="deep-freeform silhouette">
  <g fill="none" stroke="currentColor" stroke-width="1.2">
    <rect x="10" y="10" width="100" height="52" stroke-dasharray="4 4" />
    <text x="60" y="44" text-anchor="middle" font-family="EB Garamond, serif" font-style="italic" font-size="28" fill="currentColor" stroke="none">?</text>
  </g>
</svg>

<section class="vg-archetype-spec">
  <h2>When to pick freeform</h2>
  <ul>
    <li>Topic is hybrid: part-narrative + part-explainer</li>
    <li>The natural reading order doesn't match any structured archetype's H2 sequence</li>
    <li>The story's pivot is structural in a way no archetype captures</li>
    <li>Forcing one of the five would make the prose worse</li>
  </ul>
  <p><strong>When in doubt between freeform and a structured archetype, prefer freeform.</strong> A forced fit produces worse content than free shape.</p>

  <h2>Universal contract (the only requirements)</h2>
  <ul>
    <li><code>&lt;h1 class="vg-post-title"&gt;</code></li>
    <li><code>&lt;p class="vg-deep-opener"&gt;</code> — the hook</li>
    <li><code>&lt;span class="vg-dropcap"&gt;</code> in the first paragraph</li>
    <li><code>&lt;p class="vg-deep-closer"&gt;</code> near the end, with <code>&lt;strong&gt;</code> for the closing label (free wording)</li>
    <li>≥2 inline <code>&lt;svg&gt;</code> widgets</li>
  </ul>

  <h2>Banned even in freeform</h2>
  <ul>
    <li>No opener (article starts cold)</li>
    <li>No drop cap (visual rhythm broken)</li>
    <li>No closer (article ends mid-thought)</li>
    <li>Wall-of-text without paragraph breaks</li>
    <li>One SVG or zero (visual budget still applies)</li>
  </ul>

  <h2>Reference file</h2>
  <p>Full spec: <code>skills/daily-news/references/archetypes/deep-freeform.md</code></p>
</section>
```

- [ ] **Step 11: Build, verify all 6 detail pages exist**

```bash
npm run clean && npm run build
ls _site/archetypes/
```

Expected:
```
daily-roundup
deep-comparison
deep-explainer
deep-freeform
deep-investigation
deep-narrative
deep-technical-deep-dive
```

(`archetypes/index.html` doesn't exist yet — that's B7.)

- [ ] **Step 12: Commit**

```bash
git add src/archetypes/
git commit -m "feat(archetypes): 5 remaining catalog pages with silhouettes + specs"
```

---

### Task B7: Create archetypes-index.njk

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/archetypes-index.njk`

- [ ] **Step 1: Create the index page**

```njk
---
layout: layouts/base.njk
title: archetypes
permalink: /archetypes/
---
<section class="vg-archetype-catalog">
  <header class="vg-archetype-catalog-hero">
    <h1 class="vg-archetype-title">archetype catalog</h1>
    <p class="vg-archetype-catalog-lede">Six structural shapes that bespoke posts on this site take. Five structured shapes for common patterns, plus one freeform for everything else.</p>
  </header>

  <section class="vg-archetype-group" aria-label="roundup">
    <h2 class="vg-archetype-group-label">daily roundup</h2>
    <div class="vg-archetype-grid">
      <a href="/archetypes/daily-roundup/" class="vg-archetype-card">
        <svg class="vg-archetype-card-silhouette" viewBox="0 0 120 72" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="1.2">
            <rect x="10" y="10" width="100" height="5"/>
            <rect x="10" y="18" width="100" height="5"/>
            <rect x="10" y="26" width="100" height="5"/>
            <rect x="10" y="34" width="100" height="5"/>
            <rect x="10" y="42" width="100" height="5"/>
            <rect x="10" y="50" width="100" height="5"/>
            <rect x="10" y="58" width="100" height="5"/>
          </g>
        </svg>
        <h3 class="vg-archetype-card-name">daily-roundup</h3>
        <p class="vg-archetype-card-tagline">The day's index.</p>
      </a>
    </div>
  </section>

  <section class="vg-archetype-group" aria-label="deep stories">
    <h2 class="vg-archetype-group-label">deep stories</h2>
    <div class="vg-archetype-grid">
      <a href="/archetypes/deep-narrative/" class="vg-archetype-card">
        <svg class="vg-archetype-card-silhouette" viewBox="0 0 120 72" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="1.2">
            <circle cx="14" cy="14" r="3" fill="currentColor"/>
            <rect x="22" y="10" width="26" height="20"/>
            <path d="M 50 20 L 56 20 M 54 17 L 56 20 L 54 23"/>
            <rect x="58" y="10" width="26" height="20"/>
            <path d="M 86 20 L 92 20 M 90 17 L 92 20 L 90 23"/>
            <rect x="94" y="10" width="22" height="20"/>
            <rect x="22" y="44" width="94" height="20" stroke-dasharray="2 2"/>
          </g>
        </svg>
        <h3 class="vg-archetype-card-name">narrative</h3>
        <p class="vg-archetype-card-tagline">Time-ordered event story.</p>
      </a>

      <a href="/archetypes/deep-technical-deep-dive/" class="vg-archetype-card">
        <svg class="vg-archetype-card-silhouette" viewBox="0 0 120 72" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="1.2">
            <rect x="42" y="10" width="36" height="14"/>
            <line x1="60" y1="24" x2="60" y2="32"/>
            <rect x="18" y="34" width="30" height="14"/>
            <rect x="72" y="34" width="30" height="14"/>
            <line x1="33" y1="48" x2="33" y2="54"/>
            <line x1="87" y1="48" x2="87" y2="54"/>
            <rect x="18" y="56" width="84" height="10"/>
            <line x1="48" y1="24" x2="33" y2="34"/>
            <line x1="72" y1="24" x2="87" y2="34"/>
          </g>
        </svg>
        <h3 class="vg-archetype-card-name">technical-deep-dive</h3>
        <p class="vg-archetype-card-tagline">Structural exposition.</p>
      </a>

      <a href="/archetypes/deep-investigation/" class="vg-archetype-card">
        <svg class="vg-archetype-card-silhouette" viewBox="0 0 120 72" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="1.2">
            <rect x="10" y="10" width="28" height="16" stroke-dasharray="3 2"/>
            <path d="M 16 14 L 32 22 M 32 14 L 16 22"/>
            <rect x="46" y="10" width="28" height="16" stroke-dasharray="3 2"/>
            <path d="M 52 14 L 68 22 M 68 14 L 52 22"/>
            <rect x="82" y="10" width="28" height="16" stroke-dasharray="3 2"/>
            <path d="M 88 14 L 104 22 M 104 14 L 88 22"/>
            <line x1="24" y1="32" x2="60" y2="44"/>
            <line x1="60" y1="32" x2="60" y2="44"/>
            <line x1="96" y1="32" x2="60" y2="44"/>
            <rect x="42" y="46" width="36" height="20" fill="currentColor" opacity="0.18"/>
            <rect x="42" y="46" width="36" height="20"/>
          </g>
        </svg>
        <h3 class="vg-archetype-card-name">investigation</h3>
        <p class="vg-archetype-card-tagline">"Why is this happening?"</p>
      </a>

      <a href="/archetypes/deep-comparison/" class="vg-archetype-card">
        <svg class="vg-archetype-card-silhouette" viewBox="0 0 120 72" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="1.2">
            <rect x="10" y="10" width="48" height="44"/>
            <rect x="62" y="10" width="48" height="44"/>
            <line x1="10" y1="22" x2="58" y2="22"/>
            <line x1="62" y1="22" x2="110" y2="22"/>
            <line x1="10" y1="34" x2="58" y2="34"/>
            <line x1="62" y1="34" x2="110" y2="34"/>
            <line x1="10" y1="46" x2="58" y2="46"/>
            <line x1="62" y1="46" x2="110" y2="46"/>
            <line x1="34" y1="56" x2="34" y2="64"/>
            <line x1="30" y1="60" x2="34" y2="64"/>
            <line x1="38" y1="60" x2="34" y2="64"/>
          </g>
        </svg>
        <h3 class="vg-archetype-card-name">comparison</h3>
        <p class="vg-archetype-card-tagline">Two or more options weighed.</p>
      </a>

      <a href="/archetypes/deep-explainer/" class="vg-archetype-card">
        <svg class="vg-archetype-card-silhouette" viewBox="0 0 120 72" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="1.2">
            <rect x="6" y="50" width="20" height="14"/>
            <rect x="28" y="42" width="20" height="14"/>
            <rect x="50" y="32" width="20" height="14"/>
            <rect x="72" y="22" width="20" height="14"/>
            <rect x="94" y="12" width="20" height="14"/>
          </g>
        </svg>
        <h3 class="vg-archetype-card-name">explainer</h3>
        <p class="vg-archetype-card-tagline">A concept from zero.</p>
      </a>

      <a href="/archetypes/deep-freeform/" class="vg-archetype-card">
        <svg class="vg-archetype-card-silhouette" viewBox="0 0 120 72" aria-hidden="true">
          <g fill="none" stroke="currentColor" stroke-width="1.2">
            <rect x="10" y="10" width="100" height="52" stroke-dasharray="4 4"/>
            <text x="60" y="44" text-anchor="middle" font-family="EB Garamond, serif" font-style="italic" font-size="28" fill="currentColor" stroke="none">?</text>
          </g>
        </svg>
        <h3 class="vg-archetype-card-name">freeform</h3>
        <p class="vg-archetype-card-tagline">When none of the others fit.</p>
      </a>
    </div>
  </section>
</section>
```

- [ ] **Step 2: Build and verify**

```bash
npm run clean && npm run build
ls _site/archetypes/index.html
```

Expected: file exists.

- [ ] **Step 3: Commit**

```bash
git add src/archetypes-index.njk
git commit -m "feat(archetypes): /archetypes/ index page with 6-card grid + silhouettes"
```

---

### Task B8: Add archetype catalog CSS

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/src/static/site.css`

- [ ] **Step 1: Append this CSS block to the end of `src/static/site.css`**

```css
/* ── Archetype catalog ───────────────────────────────────── */
.vg-archetype-catalog-hero {
  margin-bottom: var(--s-5);
}
.vg-archetype-title {
  font-family: var(--serif);
  font-weight: 600;
  font-size: var(--fs-xl);
  margin: 0 0 var(--s-2);
  color: var(--ink);
}
.vg-archetype-catalog-lede {
  font-family: var(--scribed);
  font-style: italic;
  color: var(--muted);
  margin: 0;
}
.vg-archetype-group {
  margin-top: var(--s-5);
}
.vg-archetype-group-label {
  font-family: var(--sans);
  font-size: var(--fs-sm);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-variant: small-caps;
  color: var(--accent-text);
  margin: 0 0 var(--s-3);
}
.vg-archetype-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--s-4);
}
@media (max-width: 700px) {
  .vg-archetype-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 460px) {
  .vg-archetype-grid { grid-template-columns: 1fr; }
}
.vg-archetype-card {
  display: block;
  padding: var(--s-3);
  border: 1px solid var(--line);
  border-radius: 4px;
  text-decoration: none;
  color: inherit;
  background: var(--bg);
  transition: border-color 0.15s ease;
}
.vg-archetype-card:hover {
  border-color: var(--accent-text);
  text-decoration: none;
}
.vg-archetype-card-silhouette {
  width: 100%;
  height: auto;
  color: var(--muted);
  margin-bottom: var(--s-2);
}
.vg-archetype-card:hover .vg-archetype-card-silhouette {
  color: var(--accent-text);
}
.vg-archetype-card-name {
  font-family: var(--serif);
  font-weight: 600;
  font-size: var(--fs-md);
  margin: 0 0 var(--s-1);
  color: var(--ink);
}
.vg-archetype-card-tagline {
  font-family: var(--scribed);
  font-style: italic;
  font-size: var(--fs-sm);
  color: var(--muted);
  margin: 0;
}

/* ── Archetype detail page ───────────────────────────────── */
.vg-archetype-trail {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  align-items: baseline;
  padding-bottom: var(--s-2);
  margin-bottom: var(--s-4);
  border-bottom: 1px solid var(--line);
  font-family: var(--sans);
  font-size: var(--fs-sm);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  font-variant: small-caps;
  color: var(--muted);
}
.vg-archetype-hero {
  margin-bottom: var(--s-4);
}
.vg-archetype-tagline {
  font-family: var(--scribed);
  font-style: italic;
  font-size: var(--fs-md);
  color: var(--ink-soft);
  margin: var(--s-2) 0 0;
}
.vg-archetype-silhouette {
  width: 280px;
  max-width: 100%;
  height: auto;
  color: var(--accent-text);
  margin: var(--s-3) 0 var(--s-4);
}
.vg-archetype-spec h2 {
  font-family: var(--scribed);
  font-style: italic;
  font-weight: 400;
  font-size: var(--fs-md);
  color: var(--sage-deep);
  margin: var(--s-4) 0 var(--s-2);
  padding-left: var(--s-3);
  border-left: 2px solid var(--sage);
}
.vg-archetype-spec ul,
.vg-archetype-spec ol {
  padding-left: var(--s-4);
  margin: 0 0 var(--s-3);
}
.vg-archetype-spec li {
  margin-bottom: var(--s-1);
}
.vg-archetype-spec code {
  font-family: var(--mono);
  font-size: 0.92em;
  background: var(--bg-soft);
  padding: 0.05em 0.35em;
  border-radius: 2px;
}
.vg-archetype-examples {
  margin-top: var(--s-5);
  padding-top: var(--s-3);
  border-top: 1px solid var(--line);
}
.vg-archetype-examples h2 {
  font-family: var(--sans);
  font-size: var(--fs-sm);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-variant: small-caps;
  color: var(--accent-text);
  margin: 0 0 var(--s-3);
}
.vg-archetype-examples ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.vg-archetype-examples li {
  display: flex;
  gap: var(--s-3);
  align-items: baseline;
  padding: var(--s-2) 0;
  border-bottom: 1px dashed var(--line);
}
.vg-archetype-examples li:last-child {
  border-bottom: none;
}
.vg-archetype-example-date {
  font-family: var(--display);
  font-style: italic;
  color: var(--muted);
  min-width: 4rem;
}
```

- [ ] **Step 2: Build and lint**

```bash
npm run clean && npm run build && npm run lint:html
```

Expected: build clean, lint clean.

- [ ] **Step 3: Commit**

```bash
git add src/static/site.css
git commit -m "feat(catalog): styling for /archetypes/ index + detail pages"
```

---

### Task B9: Extend archetype-check.mjs with per-archetype rules

**Files:**
- Modify: `/Users/bluesky/arsenal/vatt-ghern/tests/archetype-check.mjs`

- [ ] **Step 1: Replace the deep-story-specific check function and add per-archetype dispatchers**

Find this block:

```javascript
function checkDeepStory(path, html) {
  for (const act of ["幕一：", "幕二：", "幕三："]) {
    if (!html.includes(act)) {
      violations.push(`${path}: missing H2 act "${act}" (full-width colon required)`);
    }
  }
  if (!/class="[^"]*vg-deep-opener/.test(html)) {
    violations.push(`${path}: missing .vg-deep-opener`);
  }
  if (!/class="[^"]*vg-dropcap/.test(html)) {
    violations.push(`${path}: missing .vg-dropcap`);
  }
  if (!/class="[^"]*vg-deep-closer/.test(html)) {
    violations.push(`${path}: missing .vg-deep-closer`);
  }
  const svgCount = (html.match(/<svg\b/g) || []).length;
  if (svgCount < 2) {
    violations.push(`${path}: deep-story requires ≥2 <svg> widgets, found ${svgCount}`);
  }
}
```

Replace with:

```javascript
function readSidecarArchetype(htmlPath) {
  // Given _site/.../<slug>/index.html, find the corresponding sidecar in src/posts/.../<slug>.11tydata.json
  // Strategy: parse the post URL from the HTML path back to the source path.
  // _site/YYYY/MM/DD/<slug>/index.html -> src/posts/YYYY/MM/DD/<slug>.11tydata.json
  const m = htmlPath.match(/[/\\](\d{4})[/\\](\d{2})[/\\](\d{2})[/\\]([^/\\]+)[/\\]index\.html$/);
  if (!m) return null;
  const [, y, mo, d, slug] = m;
  const sidecarPath = join(REPO_ROOT, "src", "posts", y, mo, d, `${slug}.11tydata.json`);
  if (!existsSync(sidecarPath)) return null;
  try {
    const data = JSON.parse(readFileSync(sidecarPath, "utf8"));
    return data.deep_archetype || null;
  } catch {
    return null;
  }
}

function checkUniversalContract(path, html) {
  if (!/class="[^"]*vg-deep-opener/.test(html)) {
    violations.push(`${path}: missing .vg-deep-opener`);
  }
  if (!/class="[^"]*vg-dropcap/.test(html)) {
    violations.push(`${path}: missing .vg-dropcap`);
  }
  if (!/class="[^"]*vg-deep-closer/.test(html)) {
    violations.push(`${path}: missing .vg-deep-closer`);
  }
  if (!/<p[^>]*class="[^"]*vg-deep-closer[^"]*"[^>]*>[\s\S]*?<strong>/.test(html)) {
    violations.push(`${path}: .vg-deep-closer must contain a <strong> for the closing label`);
  }
  const svgCount = (html.match(/<svg\b/g) || []).length;
  if (svgCount < 2) {
    violations.push(`${path}: deep-story requires ≥2 <svg> widgets, found ${svgCount}`);
  }
}

function extractH2Texts(html) {
  return [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)]
    .map((m) => m[1].trim());
}

function checkNarrative(path, html) {
  const expected = ["what happened", "why it matters", "so what"];
  const actual = extractH2Texts(html);
  if (actual.length !== 3) {
    violations.push(`${path}: narrative requires exactly 3 H2 elements, found ${actual.length}`);
  }
  for (let i = 0; i < expected.length; i++) {
    if (actual[i] !== expected[i]) {
      violations.push(`${path}: narrative H2[${i}] expected "${expected[i]}", got "${actual[i] || "(missing)"}"`);
    }
  }
  if (!/<strong>Take-away<\/strong>/.test(html)) {
    violations.push(`${path}: narrative closer must use <strong>Take-away</strong> label`);
  }
}

function checkTechnicalDeepDive(path, html) {
  const actual = extractH2Texts(html);
  if (actual.length < 3 || actual.length > 5) {
    violations.push(`${path}: technical-deep-dive requires 3-5 H2 elements, found ${actual.length}`);
  }
  const banned = ["what happened", "why it matters", "so what", "observation", "the truth", "how to choose", "the core idea"];
  for (const h2 of actual) {
    if (banned.includes(h2.toLowerCase())) {
      violations.push(`${path}: technical-deep-dive H2 "${h2}" is banned (belongs to another archetype)`);
    }
  }
  if (!/<strong>What this enables<\/strong>/.test(html)) {
    violations.push(`${path}: technical-deep-dive closer must use <strong>What this enables</strong> label`);
  }
}

function checkInvestigation(path, html) {
  const actual = extractH2Texts(html);
  if (actual.length < 3) {
    violations.push(`${path}: investigation requires at least 3 H2 elements (observation + ≥1 hypothesis + the truth), found ${actual.length}`);
  }
  if (actual[0] !== "observation") {
    violations.push(`${path}: investigation H2[0] must be "observation", got "${actual[0] || "(missing)"}"`);
  }
  if (actual[actual.length - 1] !== "the truth") {
    violations.push(`${path}: investigation last H2 must be "the truth", got "${actual[actual.length - 1] || "(missing)"}"`);
  }
  const middle = actual.slice(1, -1);
  const hypothesisCount = middle.filter((h) => h.startsWith("hypothesis: ")).length;
  if (hypothesisCount < 1 || hypothesisCount > 3) {
    violations.push(`${path}: investigation requires 1-3 "hypothesis: ..." H2s, found ${hypothesisCount}`);
  }
  if (hypothesisCount !== middle.length) {
    violations.push(`${path}: investigation middle H2s must all start with "hypothesis: ", got: ${middle.join(", ")}`);
  }
  if (!/<strong>Take-away<\/strong>/.test(html)) {
    violations.push(`${path}: investigation closer must use <strong>Take-away</strong> label`);
  }
}

function checkComparison(path, html) {
  const actual = extractH2Texts(html);
  if (actual.length < 4 || actual.length > 6) {
    violations.push(`${path}: comparison requires 4-6 H2 elements (3-5 dimensions + how to choose), found ${actual.length}`);
  }
  const lastH2 = actual[actual.length - 1];
  if (lastH2 !== "how to choose") {
    violations.push(`${path}: comparison last H2 must be "how to choose", got "${lastH2 || "(missing)"}"`);
  }
  const dimensions = actual.slice(0, -1);
  if (dimensions.length < 3 || dimensions.length > 5) {
    violations.push(`${path}: comparison requires 3-5 "dimension: ..." H2s before "how to choose", found ${dimensions.length}`);
  }
  for (const h2 of dimensions) {
    if (!h2.startsWith("dimension: ")) {
      violations.push(`${path}: comparison H2 "${h2}" must start with "dimension: "`);
    }
  }
  const hasTable = /<table\b/.test(html);
  const hasComparisonSvg = /class="[^"]*vg-w-comparison-/.test(html);
  if (!hasTable && !hasComparisonSvg) {
    violations.push(`${path}: comparison requires either <table> or <svg class="vg-w-comparison-...">`);
  }
  if (!/<strong>Take-away<\/strong>/.test(html)) {
    violations.push(`${path}: comparison closer must use <strong>Take-away</strong> label`);
  }
}

function checkExplainer(path, html) {
  const expected = [
    "start with a concrete case",
    "where today's tools fall short",
    "the core idea",
    "what it actually looks like",
    "when you'd reach for it",
  ];
  const actual = extractH2Texts(html);
  if (actual.length !== 5) {
    violations.push(`${path}: explainer requires exactly 5 H2 elements, found ${actual.length}`);
  }
  for (let i = 0; i < expected.length; i++) {
    if (actual[i] !== expected[i]) {
      violations.push(`${path}: explainer H2[${i}] expected "${expected[i]}", got "${actual[i] || "(missing)"}"`);
    }
  }
  // The "what it actually looks like" section must contain code or svg
  const wialMatch = html.match(/<h2[^>]*>\s*what it actually looks like\s*<\/h2>([\s\S]*?)(?:<h2|<p[^>]*vg-deep-closer)/);
  if (wialMatch) {
    const section = wialMatch[1];
    if (!/<pre/.test(section) && !/<svg\b/.test(section)) {
      violations.push(`${path}: explainer "what it actually looks like" section must contain <pre><code> or <svg>`);
    }
  }
  if (!/<strong>Take-away<\/strong>/.test(html)) {
    violations.push(`${path}: explainer closer must use <strong>Take-away</strong> label`);
  }
}

function checkFreeform(path, html) {
  // Universal contract only — already checked by checkUniversalContract
  // No H2 constraints, no closer label constraints (label is free)
}

const ARCHETYPE_CHECKERS = {
  narrative: checkNarrative,
  "technical-deep-dive": checkTechnicalDeepDive,
  investigation: checkInvestigation,
  comparison: checkComparison,
  explainer: checkExplainer,
  freeform: checkFreeform,
};

function checkDeepStory(path, html) {
  checkUniversalContract(path, html);
  const archetype = readSidecarArchetype(path);
  if (!archetype) {
    violations.push(`${path}: deep-story sidecar missing or has no deep_archetype field`);
    return;
  }
  const checker = ARCHETYPE_CHECKERS[archetype];
  if (!checker) {
    violations.push(`${path}: deep_archetype "${archetype}" is not a known archetype`);
    return;
  }
  checker(path, html);
}
```

- [ ] **Step 2: Add the necessary imports at the top**

Find the existing imports:

```javascript
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
```

Replace with:

```javascript
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, "..");
```

- [ ] **Step 3: Run the test on the existing sample post (must pass since sample currently uses narrative shape)**

First, update the sample's sidecar to declare `deep_archetype: "narrative"`. Open `src/posts/2026/05/16/deep-sample.11tydata.json` and ensure it includes `"deep_archetype": "narrative"`. Add it if missing.

```bash
# Verify
cat src/posts/2026/05/16/deep-sample.11tydata.json | grep deep_archetype
```

Expected: `"deep_archetype": "narrative"` (if not present, edit the file to add it).

Also: the current deep-sample.html uses CJK H2s (`幕一：發生了什麼` etc.). The new narrative archetype expects English H2s (`what happened` / `why it matters` / `so what`). Update the sample's H2s:

```bash
sed -i '' 's/<h2>幕一：發生了什麼<\/h2>/<h2>what happened<\/h2>/' src/posts/2026/05/16/deep-sample.html
sed -i '' 's/<h2>幕二：為什麼重要<\/h2>/<h2>why it matters<\/h2>/' src/posts/2026/05/16/deep-sample.html
sed -i '' 's/<h2>幕三：延伸與思考<\/h2>/<h2>so what<\/h2>/' src/posts/2026/05/16/deep-sample.html
grep -c '<h2>' src/posts/2026/05/16/deep-sample.html
```

Expected: `3` (exactly 3 H2s).

- [ ] **Step 4: Run the updated archetype-check**

```bash
npm run build
node tests/archetype-check.mjs _site/
```

Expected: `OK: archetype-check passed for _site/`. If there are violations, fix them by adjusting the sample post HTML OR the archetype rules. Do NOT loosen the rules to pass — the goal is rules that match the spec.

- [ ] **Step 5: Commit**

```bash
git add tests/archetype-check.mjs src/posts/2026/05/16/deep-sample.html src/posts/2026/05/16/deep-sample.11tydata.json
git commit -m "feat(check): per-archetype rule set + update narrative sample to new H2s"
```

---

### Task B10: Phase B verification

- [ ] **Step 1: Full clean build + all quality gates**

```bash
npm run clean
npm run build
npm run lint:html
node tests/archetype-check.mjs _site/
node tests/link-check.mjs
```

Expected: all pass.

- [ ] **Step 2: Verify /archetypes/ page renders with all 6 cards**

```bash
grep -c 'vg-archetype-card' _site/archetypes/index.html
```

Expected: at least 12 (6 cards × 2 references each — opening tag + class).

- [ ] **Step 3: Verify nav shows archetypes link**

```bash
grep -c 'archetypes' _site/index.html
```

Expected: ≥1.

- [ ] **Step 4: Spot-check one detail page**

```bash
cat _site/archetypes/deep-investigation/index.html | grep -E 'observation|hypothesis|the truth' | head -5
```

Expected: at least 3 matches.

**Phase B exit criteria**: 6 archetype detail pages render, index page renders with 6 silhouette cards, nav link works, archetype-check passes with new per-archetype rules on the updated narrative sample.

---

## PHASE C — Remaining samples + first real routine run

### Task C1: Create deep-technical-deep-dive-sample

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/posts/2026/05/16/deep-technical-deep-dive-sample.html`
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/posts/2026/05/16/deep-technical-deep-dive-sample.11tydata.json`

- [ ] **Step 1: Create the sidecar**

```json
{
  "title": "範例：技術深度文 archetype 示範",
  "date": "2026-05-16",
  "archetype": "daily-deep-story",
  "deep_archetype": "technical-deep-dive",
  "topics": ["systems"],
  "tags": ["sample", "deep-story", "archetype-demo"],
  "sources": ["https://example.com/sample-tdd"],
  "news_ids": ["2026-05-16-04"],
  "related_roundup": "/2026/05/16/roundup/",
  "summary": "結構性解析示範，展示 technical-deep-dive archetype 的 3-5 component-named H2 + What this enables closer。",
  "estimated_read_min": 5
}
```

- [ ] **Step 2: Create the HTML**

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">如果你以為這個系統的瓶頸是 disk I/O，看完三個元件你會發現瓶頸其實在另一個地方。</p>
  <h1 class="vg-post-title">{{ title }}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">這</span>是一篇 technical-deep-dive archetype 的範例文。實際 routine 寫的內容會以真實系統的元件名稱替換下面的 H2。三個 component sections 後接 What this enables 收尾，整篇是 structural exposition，不是時間敘事。</p>

  <h2>The query planner core</h2>

  <p>第一個元件的解析。展示這個元件做什麼、它的內部結構、它對外部的 contract。配上一個 architecture SVG 視覺化內部 sub-component 之間的關係。</p>

  <figure aria-label="planner-core architecture">
    <svg viewBox="0 0 480 200" role="img" style="width: 100%; height: auto;">
      <g fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="20" y="40" width="120" height="40" rx="4"/>
        <rect x="180" y="20" width="120" height="40" rx="4"/>
        <rect x="180" y="80" width="120" height="40" rx="4"/>
        <rect x="340" y="40" width="120" height="40" rx="4"/>
        <line x1="140" y1="60" x2="180" y2="40"/>
        <line x1="140" y1="60" x2="180" y2="100"/>
        <line x1="300" y1="40" x2="340" y2="60"/>
        <line x1="300" y1="100" x2="340" y2="60"/>
      </g>
      <g font-family="Manrope, sans-serif" font-size="11" fill="var(--ink)" text-anchor="middle">
        <text x="80" y="65">parser</text>
        <text x="240" y="45">rule rewriter</text>
        <text x="240" y="105">cost estimator</text>
        <text x="400" y="65">executor</text>
      </g>
    </svg>
  </figure>

  <h2>Cost model with skew correction</h2>

  <p>第二個元件。這裡解析 cost model 的內部設計，特別是處理 data skew 的修正項。展示前後對比（傳統 cost model vs 加 skew 修正後）。</p>

  <figure aria-label="cost-model comparison">
    <svg viewBox="0 0 480 160" role="img" style="width: 100%; height: auto;">
      <g fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="20" y="20" width="200" height="120"/>
        <rect x="260" y="20" width="200" height="120" stroke="var(--accent)"/>
        <polyline points="40,100 70,90 100,95 130,40 160,38 190,60" stroke="var(--muted)"/>
        <polyline points="280,100 310,80 340,60 370,50 400,45 430,42" stroke="var(--accent)"/>
      </g>
      <g font-family="Manrope, sans-serif" font-size="10" fill="var(--muted)" text-anchor="middle" letter-spacing="0.08em">
        <text x="120" y="155">TRADITIONAL</text>
        <text x="360" y="155">WITH SKEW CORRECTION</text>
      </g>
    </svg>
  </figure>

  <h2>Adaptive execution loop</h2>

  <p>第三個元件。Runtime 階段如何根據觀察到的實際資料調整 plan。包含一段虛擬的偽碼示意：</p>

  <pre><code>while (running) {
  observation = collect_stats(execution_so_far);
  if (deviation_from_estimate(observation) > THRESHOLD) {
    new_plan = replan(observation);
    if (cost(new_plan) &lt; cost(current_plan) * REPLAN_RATIO) {
      switch_to(new_plan);
    }
  }
}</code></pre>

  <p class="vg-deep-closer"><strong>What this enables</strong>：三個元件合起來讓系統能在 query 開始執行後仍持續優化計畫，而不是 plan-then-execute 的傳統模型——對 ad-hoc analytical workload 特別有用。</p>
</div>
```

- [ ] **Step 3: Build + check**

```bash
npm run clean && npm run build
node tests/archetype-check.mjs _site/
```

Expected: archetype-check passes.

- [ ] **Step 4: Commit**

```bash
git add src/posts/2026/05/16/deep-technical-deep-dive-sample.html src/posts/2026/05/16/deep-technical-deep-dive-sample.11tydata.json
git commit -m "content: technical-deep-dive sample (3 components + What this enables)"
```

---

### Task C2: Create deep-investigation-sample

**Files:**
- Create: 2 files for the investigation sample

- [ ] **Step 1: Create the sidecar**

```json
{
  "title": "範例：調查文 archetype 示範",
  "date": "2026-05-16",
  "archetype": "daily-deep-story",
  "deep_archetype": "investigation",
  "topics": ["infra"],
  "tags": ["sample", "deep-story", "archetype-demo"],
  "sources": ["https://example.com/sample-investigation"],
  "news_ids": ["2026-05-16-06"],
  "related_roundup": "/2026/05/16/roundup/",
  "summary": "追兇文示範。observation → hypothesis ×2 → the truth + Take-away 方法論教訓。",
  "estimated_read_min": 6
}
```

- [ ] **Step 2: Create the HTML**

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">凌晨四點，p99 latency 突然從 80ms 跳到 800ms——但 CPU、記憶體、磁碟、網路全都正常。</p>
  <h1 class="vg-post-title">{{ title }}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">每</span>個工程師都遇過這種 incident。表面看一切正常的 metric，卻有某個維度暴增。這篇範例追蹤兩個假設的證偽過程，最後揭示真相。</p>

  <h2>observation</h2>

  <p>p99 從 80ms 暴增到 800ms，持續約 20 分鐘後自行恢復。CPU 利用率、記憶體、磁碟 IO、網路頻寬全在正常範圍。錯誤率沒上升、QPS 沒變化。</p>

  <figure aria-label="latency spike">
    <svg viewBox="0 0 480 160" role="img" style="width: 100%; height: auto;">
      <g fill="none" stroke="currentColor" stroke-width="1">
        <line x1="40" y1="140" x2="460" y2="140" stroke="var(--muted-2)"/>
        <line x1="40" y1="20" x2="40" y2="140" stroke="var(--muted-2)"/>
        <polyline points="40,120 80,118 120,122 160,120 200,118 220,30 240,28 260,32 280,30 320,118 360,120 400,118 440,120" stroke="var(--accent)" stroke-width="1.5"/>
      </g>
      <g font-family="EB Garamond, serif" font-style="italic" font-size="11" fill="var(--ink)" text-anchor="middle">
        <text x="240" y="20">800ms spike (20 min)</text>
        <text x="40" y="155">04:00</text>
        <text x="240" y="155">04:20</text>
        <text x="440" y="155">04:40</text>
      </g>
    </svg>
  </figure>

  <h2>hypothesis: GC pause cascade</h2>

  <p>第一個假設：可能是 JVM Full GC 卡住造成 p99 變差。我們檢查了 GC log——確實有 GC 活動，但暫停時間都在 10-20ms，無法解釋 800ms。GC log 反而顯示這 20 分鐘 GC 頻率比平常還低。<strong>假設失敗</strong>。</p>

  <h2>hypothesis: downstream slow query</h2>

  <p>第二個假設：可能是後端某個 DB query 變慢了，把上游也拖慢。我們檢查 DB metrics 與 query log——所有 query latency 都在 base line。沒有 lock contention、沒有 slow log 條目、沒有 connection pool exhaustion。<strong>假設失敗</strong>。</p>

  <h2>the truth</h2>

  <p>真相是 kernel 層級的問題：那 20 分鐘剛好對應到 systemd-journald 在做 log rotation + fsync，因為 disk write back cache 被 flush 干擾了一個與我們服務不直接相關的 cgroup 的 IO 排程，間接影響了 socket buffer flushing。前面的 metrics 看不到是因為它們聚合在 process 層，沒看到 cgroup-level 的 IO scheduling 細節。</p>

  <figure aria-label="cgroup IO interference">
    <svg viewBox="0 0 480 200" role="img" style="width: 100%; height: auto;">
      <g fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="20" y="20" width="120" height="160" stroke-dasharray="3 2"/>
        <rect x="180" y="20" width="120" height="60"/>
        <rect x="180" y="100" width="120" height="60"/>
        <rect x="340" y="80" width="120" height="40"/>
        <line x1="140" y1="50" x2="180" y2="50"/>
        <line x1="140" y1="130" x2="180" y2="130"/>
        <line x1="300" y1="50" x2="340" y2="90"/>
        <line x1="300" y1="130" x2="340" y2="110"/>
      </g>
      <g font-family="Manrope, sans-serif" font-size="10" fill="var(--ink)" text-anchor="middle">
        <text x="80" y="105">cgroup A</text>
        <text x="80" y="120">(journald)</text>
        <text x="240" y="55">disk queue</text>
        <text x="240" y="135">our app</text>
        <text x="400" y="105">socket buffer</text>
      </g>
    </svg>
  </figure>

  <p class="vg-deep-closer"><strong>Take-away</strong>：下次遇到「所有 metric 都看起來正常但 p99 暴增」的情況，先看 cgroup-level 的 IO 排程指標，不要只信 process-level metric。</p>
</div>
```

- [ ] **Step 3: Build + check**

```bash
npm run clean && npm run build
node tests/archetype-check.mjs _site/
```

Expected: archetype-check passes (5 H2s: observation, 2× hypothesis: ..., the truth, plus the closer doesn't count as H2).

Wait — count H2s in the file:

```bash
grep -c '<h2>' _site/2026/05/16/deep-investigation-sample/index.html
```

Expected: `4` (observation + 2 hypothesis + the truth).

Hmm, the archetype-check rule says investigation requires "at least 3 H2s, observation first, the truth last, 1-3 hypothesis between". 4 satisfies. If check fails, debug why.

- [ ] **Step 4: Commit**

```bash
git add src/posts/2026/05/16/deep-investigation-sample.html src/posts/2026/05/16/deep-investigation-sample.11tydata.json
git commit -m "content: investigation sample (observation + 2 hypotheses + the truth)"
```

---

### Task C3: Create deep-comparison-sample

**Files:**
- Create: 2 files for the comparison sample

- [ ] **Step 1: Create the sidecar**

```json
{
  "title": "範例：對照文 archetype 示範",
  "date": "2026-05-16",
  "archetype": "daily-deep-story",
  "deep_archetype": "comparison",
  "topics": ["storage"],
  "tags": ["sample", "deep-story", "archetype-demo"],
  "sources": ["https://example.com/sample-comparison"],
  "news_ids": ["2026-05-16-09"],
  "related_roundup": "/2026/05/16/roundup/",
  "summary": "對照選型示範。3 個 dimension + how to choose + 對照表 widget。",
  "estimated_read_min": 5
}
```

- [ ] **Step 2: Create the HTML**

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">當你的 streaming pipeline 從 1K events/s 成長到 10K events/s，原本的選擇可能不再對。</p>
  <h1 class="vg-post-title">{{ title }}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">這</span>是 comparison archetype 範例。對比兩個 streaming framework 選項：Kafka Streams 與 Apache Flink。對照表先給出 at-a-glance、然後 3 個 dimension 各自展開，最後 how to choose 給決策建議。</p>

  <table>
    <thead>
      <tr>
        <th></th>
        <th>Kafka Streams</th>
        <th>Apache Flink</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>State backend</td><td>RocksDB (local)</td><td>RocksDB + remote checkpoint</td></tr>
      <tr><td>Deployment model</td><td>Library (in app JVM)</td><td>Cluster (separate runtime)</td></tr>
      <tr><td>Latency profile</td><td>~10-50ms</td><td>~50-200ms</td></tr>
      <tr><td>Exactly-once</td><td>Yes (within Kafka)</td><td>Yes (across systems)</td></tr>
      <tr><td>Learning curve</td><td>Low (Java/Scala fluency enough)</td><td>Medium (需懂 distributed state)</td></tr>
    </tbody>
  </table>

  <h2>dimension: state management</h2>

  <p>Kafka Streams 把 state 存在 local RocksDB，重啟時從 changelog topic 重建。Flink 預設也是 RocksDB，但加上 remote checkpoint（HDFS / S3），復原速度更快，但 latency 多 50-100ms。</p>

  <h2>dimension: operational model</h2>

  <p>Kafka Streams 是 library，跟你的 app 一起部署，沒有額外 cluster 要管。Flink 是 standalone cluster，需要 JobManager + TaskManager + ZooKeeper 等，但相對地 resource isolation 更好。</p>

  <h2>dimension: latency vs throughput</h2>

  <p>Kafka Streams 預設 micro-batch 100ms，latency 低、throughput 受 partition 並行限制。Flink 是真 streaming，latency 較高（checkpoint 開銷）但 throughput 更高（pipeline parallelism + state spilling）。</p>

  <h2>how to choose</h2>

  <p>如果你的 pipeline 已經 in-Kafka（input + output 都是 Kafka topic）且 latency 要求 &lt;100ms，<strong>選 Kafka Streams</strong>——operational simplicity 是真價值。如果你需要 cross-system exactly-once（例如 Kafka in + Postgres out）或單 instance 要處理 &gt;50K events/s，<strong>選 Flink</strong>——cluster 開銷值得。</p>

  <p class="vg-deep-closer"><strong>Take-away</strong>：對 80% 的「我已經在用 Kafka 想加 stream processing」場景，Kafka Streams 是正確選擇；只有 cross-system 或高吞吐才該付 Flink cluster 的 operational tax。</p>
</div>
```

- [ ] **Step 3: Build + check**

```bash
npm run clean && npm run build
node tests/archetype-check.mjs _site/
```

Expected: archetype-check passes (4 H2s: 3 dimensions + how to choose; table present).

- [ ] **Step 4: Commit**

```bash
git add src/posts/2026/05/16/deep-comparison-sample.html src/posts/2026/05/16/deep-comparison-sample.11tydata.json
git commit -m "content: comparison sample (Kafka Streams vs Flink, table + 3 dimensions)"
```

---

### Task C4: Create deep-explainer-sample

**Files:**
- Create: 2 files for the explainer sample

- [ ] **Step 1: Create the sidecar**

```json
{
  "title": "範例：解釋文 archetype 示範",
  "date": "2026-05-16",
  "archetype": "daily-deep-story",
  "deep_archetype": "explainer",
  "topics": ["systems"],
  "tags": ["sample", "deep-story", "archetype-demo"],
  "sources": ["https://example.com/sample-explainer"],
  "news_ids": ["2026-05-16-07"],
  "related_roundup": "/2026/05/16/roundup/",
  "summary": "概念解釋示範。從具體案例開始，5 個固定 H2，包含 worked example code block。",
  "estimated_read_min": 7
}
```

- [ ] **Step 2: Create the HTML**

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">如果你沒聽過 CRDT，可能會以為它是某種新型 database。其實它是一種 data structure。</p>
  <h1 class="vg-post-title">{{ title }}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">這</span>篇範例文展示 explainer archetype。讀完你會知道 CRDT 的核心是什麼、什麼時候會用上它。從具體案例開始、推導到核心概念，最後給個簡化的 worked example。</p>

  <h2>start with a concrete case</h2>

  <p>想像兩個使用者同時編輯 Google Docs。A 在第 5 行插入「hello」，B 在第 5 行刪除整行。兩人的編輯都成功，網路同步後，結果應該是什麼？</p>

  <h2>where today's tools fall short</h2>

  <p>傳統做法是 server-side conflict resolution——所有編輯送到 server，server 用 OT (Operational Transformation) 排序。問題是：(a) 需要 strong consistency 的 server、(b) offline 編輯不行、(c) peer-to-peer 場景沒解。</p>

  <h2>the core idea</h2>

  <p>CRDT (Conflict-free Replicated Data Type) 用一個關鍵性質繞過 conflict resolution：操作本身被設計成**可交換**（commutative）、**冪等**（idempotent）、**結合**（associative）。所以無論操作以什麼順序 apply、apply 幾次，最終結果一定一致。</p>

  <figure aria-label="CRDT convergence">
    <svg viewBox="0 0 480 160" role="img" style="width: 100%; height: auto;">
      <g fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="20" y="20" width="120" height="40" rx="4"/>
        <rect x="20" y="100" width="120" height="40" rx="4"/>
        <rect x="340" y="60" width="120" height="40" rx="4" stroke="var(--accent)"/>
        <line x1="140" y1="40" x2="340" y2="80"/>
        <line x1="140" y1="120" x2="340" y2="80"/>
      </g>
      <g font-family="Manrope, sans-serif" font-size="11" fill="var(--ink)" text-anchor="middle">
        <text x="80" y="45">replica A</text>
        <text x="80" y="125">replica B</text>
        <text x="400" y="85" fill="var(--accent-text)">convergent state</text>
      </g>
    </svg>
  </figure>

  <h2>what it actually looks like</h2>

  <p>最簡單的 CRDT 是 G-Counter（grow-only counter）：</p>

  <pre><code>class GCounter {
  Map&lt;NodeId, int&gt; counts = {};

  void increment(NodeId self) {
    counts[self] = (counts[self] ?? 0) + 1;
  }

  int value() {
    return counts.values.sum();
  }

  GCounter merge(GCounter other) {
    Map&lt;NodeId, int&gt; result = {};
    for (id in counts.keys ∪ other.counts.keys) {
      result[id] = max(counts[id] ?? 0, other.counts[id] ?? 0);
    }
    return GCounter(result);
  }
}</code></pre>

  <p>關鍵在 <code>merge</code> 用 max——這讓 merge 操作 commutative、idempotent、associative。兩個 replica 怎麼同步、同步幾次，最終都會 converge。</p>

  <h2>when you'd reach for it</h2>

  <p>用 CRDT 的場景：(a) 多用戶協作編輯（Figma、Notion、Linear 都在用）、(b) offline-first app（Riak、Redis CRDT module）、(c) peer-to-peer 應用（無 central server）、(d) edge computing（latency 敏感、不能等 server roundtrip）。不適合的：transactional consistency 強的場景（銀行轉帳）、需要 strong ordering 的場景（event sourcing 的單一 source of truth）。</p>

  <p class="vg-deep-closer"><strong>Take-away</strong>：CRDT 的核心不是「沒有 conflict」而是「conflict resolution 內建在 data structure 的數學性質裡」——把問題從 system level 推到 type level。</p>
</div>
```

- [ ] **Step 3: Build + check**

```bash
npm run clean && npm run build
node tests/archetype-check.mjs _site/
```

Expected: archetype-check passes (5 H2s in exact order, `<pre>` inside "what it actually looks like" section).

- [ ] **Step 4: Commit**

```bash
git add src/posts/2026/05/16/deep-explainer-sample.html src/posts/2026/05/16/deep-explainer-sample.11tydata.json
git commit -m "content: explainer sample (CRDT walkthrough with worked G-Counter example)"
```

---

### Task C5: Create deep-freeform-sample

**Files:**
- Create: 2 files for the freeform sample

- [ ] **Step 1: Create the sidecar**

```json
{
  "title": "範例：自由格式 archetype 示範",
  "date": "2026-05-16",
  "archetype": "daily-deep-story",
  "deep_archetype": "freeform",
  "topics": ["industry"],
  "tags": ["sample", "deep-story", "archetype-demo"],
  "sources": ["https://example.com/sample-freeform"],
  "news_ids": ["2026-05-16-10"],
  "related_roundup": "/2026/05/16/roundup/",
  "summary": "自由格式示範。hybrid 主題：part-narrative + part-comparison + part-reflection。",
  "estimated_read_min": 6
}
```

- [ ] **Step 2: Create the HTML**

The freeform sample intentionally has an unusual H2 sequence that doesn't fit any structured archetype:

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">這週同時發生了兩件事，乍看無關：一個資料庫釋出新版本，一篇 paper 質疑了它二十年的設計假設。</p>
  <h1 class="vg-post-title">{{ title }}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">這</span>篇範例文示範 freeform archetype。主題是 hybrid——既有「兩件事相互呼應」的 narrative 性質，也有「新舊設計對比」的 comparison 性質，又夾帶「為什麼這個時點」的 reflection。沒有任何一個 structured archetype 能套得自然，所以選 freeform。</p>

  <h2>兩件事</h2>

  <p>第一件：PostgreSQL 17 正式釋出，包含改進的 vacuum 機制和新的 JSON 處理。第二件：一篇學術論文用 12 個 production workload 證明，PostgreSQL 從 1996 年就在用的 MVCC 假設，在 OLAP 場景下其實是 anti-pattern。</p>

  <h2>它們為什麼擺在一起看</h2>

  <p>PostgreSQL 17 的 vacuum 改進，正是在回應 MVCC 在 high-write workload 下的痛點。但這個改進的方向（更聰明的 vacuum）和論文建議的方向（重新思考 MVCC）幾乎相反。一個是漸進改良、一個是 paradigm shift。</p>

  <figure aria-label="MVCC paths">
    <svg viewBox="0 0 480 160" role="img" style="width: 100%; height: auto;">
      <g fill="none" stroke="currentColor" stroke-width="1.5">
        <line x1="60" y1="80" x2="140" y2="80"/>
        <rect x="140" y="60" width="80" height="40"/>
        <line x1="220" y1="80" x2="280" y2="80"/>
        <rect x="280" y="60" width="80" height="40" stroke="var(--accent)"/>
        <line x1="220" y1="80" x2="280" y2="40"/>
        <rect x="280" y="20" width="80" height="40" stroke-dasharray="3 2"/>
      </g>
      <g font-family="Manrope, sans-serif" font-size="10" fill="var(--ink)" text-anchor="middle">
        <text x="180" y="85">PG 16</text>
        <text x="320" y="85">PG 17 (better vacuum)</text>
        <text x="320" y="45">paper: drop MVCC?</text>
      </g>
    </svg>
  </figure>

  <h2>業界的應對</h2>

  <p>觀察其他 database 怎麼接這個 paradigm question：</p>
  <ul>
    <li><strong>CockroachDB</strong>：把 MVCC 變成 multi-region 一致性的基礎，他們會繼續優化、不會放棄</li>
    <li><strong>ClickHouse</strong>：從來沒用 MVCC，是 append-only + merge-on-read，論文的論點對他們是「我們早就知道」</li>
    <li><strong>DuckDB</strong>：用一種混合方案，row-level versioning 但 columnar storage，論文沒直接涵蓋</li>
  </ul>

  <h2>所以呢</h2>

  <p>PostgreSQL 17 的方向是務實的——他們服務的 user base 不能 paradigm shift，必須漸進改良。論文的方向是學術的——可以挑戰假設、即使這個假設支撐了三十年的 production system。兩者都對。</p>

  <figure aria-label="evolution vs disruption">
    <svg viewBox="0 0 480 100" role="img" style="width: 100%; height: auto;">
      <g fill="none" stroke="currentColor" stroke-width="1.5">
        <line x1="40" y1="50" x2="440" y2="50" stroke="var(--muted-2)"/>
        <circle cx="80" cy="50" r="6"/>
        <circle cx="240" cy="50" r="6" fill="var(--accent)"/>
        <circle cx="400" cy="50" r="6" stroke="var(--accent)" stroke-dasharray="2 2"/>
      </g>
      <g font-family="EB Garamond, serif" font-style="italic" font-size="11" fill="var(--ink)" text-anchor="middle">
        <text x="80" y="85">PG 16</text>
        <text x="240" y="85">PG 17</text>
        <text x="400" y="85">post-MVCC?</text>
      </g>
    </svg>
  </figure>

  <p class="vg-deep-closer"><strong>Closing thought</strong>：當一個 paradigm shift 的論文與一個 incremental release 同週出現，比較它們的方向有時比深入任一篇更有啟發——這就是 freeform archetype 存在的理由。</p>
</div>
```

- [ ] **Step 3: Build + check**

```bash
npm run clean && npm run build
node tests/archetype-check.mjs _site/
```

Expected: archetype-check passes (universal contract only — opener, dropcap, closer with `<strong>`, ≥2 SVG; the H2 sequence is unconstrained).

- [ ] **Step 4: Commit**

```bash
git add src/posts/2026/05/16/deep-freeform-sample.html src/posts/2026/05/16/deep-freeform-sample.11tydata.json
git commit -m "content: freeform sample (hybrid topic, unusual H2 sequence, Closing thought label)"
```

---

### Task C6: Visual verification of all 6 archetype catalog + sample pages

This task uses Playwright to visually inspect each archetype catalog page and the corresponding sample post, in both light and dark themes.

- [ ] **Step 1: Start dev server**

```bash
npm run dev > /tmp/vg-phasec.log 2>&1 &
sleep 2 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/
```

Expected: `200`.

- [ ] **Step 2: Manually check each catalog page renders**

Visit in a browser (or Playwright):
- `http://localhost:8080/archetypes/` — 6-card grid
- `http://localhost:8080/archetypes/daily-roundup/`
- `http://localhost:8080/archetypes/deep-narrative/`
- `http://localhost:8080/archetypes/deep-technical-deep-dive/`
- `http://localhost:8080/archetypes/deep-investigation/`
- `http://localhost:8080/archetypes/deep-comparison/`
- `http://localhost:8080/archetypes/deep-explainer/`
- `http://localhost:8080/archetypes/deep-freeform/`

For each detail page: verify "Posts using this archetype" section lists the matching sample post.

- [ ] **Step 3: Stop dev server**

```bash
kill $(lsof -ti:8080) 2>/dev/null
```

- [ ] **Step 4: No commit needed — this is verification only**

If any page fails to render or shows wrong "Real examples", fix the underlying issue (likely the deepArchetypeFilter in the archetype's sidecar, or the layout's filter logic) and commit the fix.

---

### Task C7: Run daily-news skill for today, write to canonical path, push

This is the deliverable that puts real content on the live site. The skill writes to `src/posts/2026/05/16/` (overwriting the existing roundup.html / deep-sample.html — those were Phase 1 placeholders; the 5 new sample posts created in C1–C5 remain in place since they have distinct slugs).

- [ ] **Step 1: Dispatch the daily-news skill run**

The recommended way is to invoke the skill via Claude Code's slash command in a fresh session:

```bash
claude --plugin-dir /Users/bluesky/arsenal/vatt-ghern -p "/vatt-ghern:daily-news"
```

The skill will:
1. Read SKILL.md (now Step 4/5/7 reflect the new rules)
2. Fetch sources (HN, Lobste.rs, Cloudflare blog, etc.)
3. Score, filter, pick today's 10 with 4+ domains
4. Pick up to 3 deep-stories with diverse domains AND diverse archetypes
5. Author each per the picked archetype's spec
6. Run mechanical + visual self-check
7. Open a PR

If running interactively (not via routine), you can answer prompts as they come.

- [ ] **Step 2: Verify the PR was opened**

```bash
cd /Users/bluesky/arsenal/vatt-ghern
git fetch origin
git branch -r | grep daily/2026
```

Expected: see `origin/daily/2026-05-16` (or similar). If no branch, the skill ran but failed before push — read the skill's run log.

- [ ] **Step 3: Locally check out the branch and verify**

```bash
git fetch origin daily/2026-05-16
git checkout daily/2026-05-16
ls src/posts/2026/05/16/
```

Expected: roundup.html + up to 3 deep-*.html files (plus their sidecars). The 5 archetype-demo sample files (deep-*-sample.html) created in C1–C5 should still be present, untouched.

- [ ] **Step 4: Run quality gates locally**

```bash
npm run clean
npm run build
npm run lint:html
node tests/archetype-check.mjs _site/
node tests/link-check.mjs
node skills/daily-news/scripts/check-dup.mjs src/posts/2026/05/16/
node skills/daily-news/scripts/publish.mjs src/posts/2026/05/16/
```

Expected: all pass.

- [ ] **Step 5: Visually inspect via Playwright the new live posts**

```bash
npm run dev > /tmp/vg-phasec-verify.log 2>&1 &
sleep 2
```

Then navigate Playwright (or browser) to:
- `http://localhost:8080/` — homepage shows real titles (not "範例新聞一")
- `http://localhost:8080/2026/05/16/roundup/` — real roundup
- `http://localhost:8080/2026/05/16/deep-<slug>/` — for each deep-story
- `http://localhost:8080/archetypes/deep-<archetype>/` — verify real examples now include both samples AND the real post

For each: take a screenshot in light mode, set `data-theme="dark"`, take another. Look for any visual regression introduced by content that doesn't match the sample's structure.

```bash
kill $(lsof -ti:8080) 2>/dev/null
```

- [ ] **Step 6: Merge the PR**

Through GitHub UI: review the PR description (should include Domain distribution / Domains skipped / Domains capped / 來源使用 / Visual Concerns / Deep-story archetypes used today / Preview URL), check the Cloudflare Pages preview URL one more time, then squash + merge.

After merge:
- GitHub Pages workflow runs (already done — Cloudflare auto-builds)
- Cloudflare builds + deploys to production
- Wait ~2-3 minutes

- [ ] **Step 7: Verify live site shows real content**

```bash
curl -s https://vatt-ghern.pages.dev/ | grep -E '(範例|hello|null|today)' | head -10
```

Expected: title and lede should match what the routine wrote (not the placeholder sample text).

Visit https://vatt-ghern.pages.dev/ in a browser. Verify:
- Homepage hero shows today's actual roundup title and lede
- "Today's deep reads" shows real deep-story titles
- Clicking a deep-story shows real content following the picked archetype
- `/archetypes/` index renders with 6 cards
- Clicking any archetype shows the detail page + "Real examples" includes both the sample post AND today's real post (if archetype was used today)

**Phase C exit criteria**: live URL shows actual routine-produced content for today; `/archetypes/` catalog populated with samples + real posts.

---

## Self-Review

### Spec coverage walk-through

| Spec section | Plan task | Status |
|---|---|---|
| §3.1 narrative | A2, B5, C7 (sample), C7 (real) | ✓ |
| §3.2 technical-deep-dive | A3, B6, C1, C7 (real) | ✓ |
| §3.3 investigation | A4, B6, C2, C7 (real) | ✓ |
| §3.4 comparison | A5, B6, C3, C7 (real) | ✓ |
| §3.5 explainer | A6, B6, C4, C7 (real) | ✓ |
| §3.6 freeform | A1, B6, C5, C7 (real) | ✓ |
| §4 Domain coverage rules | A8 (SKILL.md Step 4) | ✓ |
| §5 Deep-story selection / archetype decision tree | A9 (SKILL.md Step 5) | ✓ |
| §6 Sidecar JSON schema (deep_archetype) | A7 (archetypes.md docs), B9 (publish.mjs enforcement — already enforced via existing publish.mjs accepting any archetype field; archetype-check now enforces deep_archetype presence) | ✓ |
| §7 Reference doc reorganization | A1-A7 | ✓ |
| §8 archetype-check.mjs per-archetype rules | B9 | ✓ |
| §9.1 /archetypes/ index | B7 | ✓ |
| §9.2 detail pages | B2, B4, B5, B6 | ✓ |
| §9.3 6 SVG silhouettes | B4 (roundup), B5 (narrative), B6 (4 others), B7 (index cards reuse) | ✓ |
| §9.4 Eleventy plumbing | B1 (nav), B3 (passthrough/permalink), B7 (index page) | ✓ |
| §10 Sample posts | B9 (update narrative sample), C1-C5 (5 new) | ✓ |
| §11 Phased rollout | A→B→C order preserved | ✓ |

### Placeholder scan

Searched plan text for: TBD, TODO, "fill in details", "implement later", "Add appropriate", "handle edge cases", "Similar to Task". Found: zero. All steps contain concrete code.

### Type / property consistency

- `deep_archetype` field name used consistently across: sidecar schema (A7), publish/check scripts (B9), `deepArchetypeFilter` in archetype detail sidecars (B5-B6), and decision tree (A9). ✓
- Archetype names in `kebab-case`: narrative, technical-deep-dive, investigation, comparison, explainer, freeform — used uniformly. ✓
- Catalog page detail-page paths: `/archetypes/<slug>/` with slug matching the source file's basename. ✓
- archetype-check rule names match SKILL.md decision tree exactly (no `tech-deep-dive` vs `technical-deep-dive` mismatch). ✓

### Spec gaps

None identified.
