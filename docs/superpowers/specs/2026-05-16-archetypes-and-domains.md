# Deep-story Archetypes + Domain Coverage — design spec

**Date**: 2026-05-16
**Status**: design freeze (post-brainstorm, pre-implementation-plan)
**Supersedes**: portions of `2026-05-16-vatt-ghern-design.md` §6.2 (deep-story archetype) and §7 Step 4/5
**Companion docs**: that earlier spec stays canonical for everything not redefined here

---

## 1. What this is

Two related changes to the `daily-news` skill:

1. **Six deep-story archetypes** (was: one fixed three-act structure). Five
   structured archetypes for common content shapes + one `freeform` for
   topics that don't fit cleanly into any of them.
2. **Domain coverage tightened**: aim for all 5 priority domains in the
   day's roundup, hard floor ≥4 (was: ≥3).

These ship together because (a) varied content needs varied form, and
(b) varied form is wasted unless the curation actually surfaces variety
across domains.

## 2. Why

### 2.1 The fixed three-act was over-rigid

Phase 2 produced a real test run on 2026-05-16. Three deep-stories got
written, all forced into `幕一：發生了什麼 / 幕二：為什麼重要 / 幕三：
延伸與思考`. One was a Cloudflare incident timeline (perfect fit). The
other two were a Linux kernel exploit chain explainer (fits awkwardly —
"what happened" is the whole story, no separate "why it matters") and an
ML inference architecture (terrible fit — should be structural exposition
of components, not a time-ordered narrative).

The H2 names became a tax: every post had to be bent until the prose fit
under those three headings.

### 2.2 The "≥3 domains" floor lets too much through

Same test run: the 10 items spanned 4 domains (ai/systems/infra/storage).
Industry was missing entirely. ≥3 was satisfied so no warning fired. But
"missing one whole domain" should be visible in the PR body so the human
reviewer knows what got skipped — and the skill should at least try harder
to swap something in before giving up.

## 3. Six archetypes

Five **structured** archetypes for common shapes; one **freeform** for
everything else. The structured ones come with required H2 names and
section counts; freeform requires only the universal contract (opener,
drop-cap intro, closer, ≥2 SVG widgets).

Archetypes are **suggestions, not commandments**. A forced fit produces
worse content than free shape. When in doubt the skill picks `freeform`.

### 3.1 narrative

**Definition**: tells what happened as a time-ordered story.

**Pick when**: CVE chains, production-incident postmortems, acquisition
sagas, release-week wrap-ups, oncall war stories.

**H2 (English)**: `what happened` / `why it matters` / `so what`.

**Closer label**: `Take-away`.

**Widget budget**: ≥2 SVG. Recommended: timeline first, then
architecture or before/after.

### 3.2 technical-deep-dive

**Definition**: structural exposition of a new design / algorithm /
protocol. Not time-ordered.

**Pick when**: Postgres planner internals, QUIC mechanics, new SIMD
extension, ML inference architecture, consensus algorithm.

**H2**: free-named (use the actual component / concept name in English),
3–5 sections. Do NOT use "what happened / why it matters / so what" or
similar generic shells — that's narrative territory.

**Closer label**: `What this enables` (emphasizes the new capability,
not the conclusion).

**Widget budget**: ≥2 SVG. Recommended: architecture diagram + data viz
(throughput, memory profile, latency).

### 3.3 investigation

**Definition**: a "why is this happening?" inquiry. Counter-intuitive
observation drives the story; hypotheses get falsified one by one until
the truth emerges.

**Pick when**: bug hunts, surprising performance regressions, benchmarks
that contradict expectation, metrics anomalies.

**H2**: `observation` / `hypothesis: {{name}}` (×1–3) / `the truth`.

**Closer label**: `Take-away` — the methodology lesson ("next time you see
X, look at Y first").

**Widget budget**: ≥2 SVG. Recommended: metrics chart (the puzzle) +
flame graph / sequence (the reveal).

### 3.4 comparison

**Definition**: two or more options laid side by side to help the reader
choose.

**Pick when**: A vs B selection, version-N vs version-M migration, library
shootouts.

**H2**: `dimension: {{name}}` (≥3, ≤5) + `how to choose` (mandatory final
section).

**Closer label**: `Take-away` — typically "for 80% of cases, pick X; only
in scenario Z does Y win."

**Widget budget**: ≥2 SVG/HTML. Required: at least one comparison-shaped
widget (HTML `<table>` styled or SVG comparison chart).

### 3.5 explainer

**Definition**: explains a concept from zero. Does NOT assume the reader
knows the prerequisites.

**Pick when**: "what is CRDT", "what is io_uring", "zero-knowledge proofs
in plain words", "SIMD intuitively".

**H2 (in this exact order)**:
- `start with a concrete case`
- `where today's tools fall short`
- `the core idea`
- `what it actually looks like`
- `when you'd reach for it`

**Closer label**: `Take-away` — the one-line mental model for the concept.

**Widget budget**: ≥2 SVG. Recommended: one conceptual diagram (the new
abstraction) + one before/after (old approach vs new concept).

### 3.6 freeform

**Definition**: the escape hatch. When none of the five structured
archetypes fits cleanly, or when the topic is hybrid, write freeform.

**Pick when** (heuristics):
- Topic is hybrid: part-narrative + part-explainer, etc.
- The natural reading order doesn't match any structured archetype's H2
- The story's pivot is structural in a way no archetype captures (e.g.,
  "two parallel events turn out to share the same root cause")
- Forcing one of the five would make the prose worse

**Required structure** (universal contract only):
- `<h1 class="vg-post-title">` exists
- `<p class="vg-deep-opener">` exists (the hook)
- One `<span class="vg-dropcap">` in the first paragraph
- One `<p class="vg-deep-closer">` near the end (label inside `<strong>`
  is free — Take-away / Closing thought / Reflection / anything that
  signals "this is the wrap")
- ≥2 inline `<svg>` widgets
- All chrome inherited from `layouts/post.njk` (post-trail, share buttons,
  bards-note marginalia)

**No H2 constraints**: zero, three, ten — whatever the content needs.

**Reverse anti-patterns** (banned even in freeform):
- No opener (article starts cold)
- No drop cap (visual rhythm broken)
- No closer (article ends mid-thought)
- Wall-of-text without paragraph breaks
- Single SVG (or zero) — visual budget still applies

## 4. Domain coverage rules (Step 4)

Replace the "≥3 domains required" rule with:

```
Aim: all 5 priority domains represented (ai / systems / infra / storage /
industry).

Hard floor: ≥4 distinct domains.

Selection algorithm:
  a. Sort all candidates by score, descending.
  b. Take top items in score order until 10 selected, OR until 5+
     domains all represented, whichever comes first.
  c. If after taking top 10 by score, fewer than 4 domains are
     represented:
       - Identify uncovered domains
       - For each uncovered domain, find the highest-score candidate
         in that domain
       - SWAP it in for the lowest-score selected item from an
         over-represented domain
       - Repeat until ≥4 domains met
  d. If exhaustive search shows no candidate exists for ≥2 domains
     (genuine sparse day), accept fewer items rather than padding
     with garbage. Log skipped domains in PR body under "Domains
     skipped today".

Caps:
  - No domain may exceed 6 of the 10 items (prevents single-domain
    days even when one domain has many qualifying items). If a
    domain has >6 strong candidates, surface only top 6, log
    "X qualifying items in {domain} (top 6 selected)" in PR body.

PR body must list:
  - Domain distribution (e.g., "AI · 3 · SYSTEMS · 3 · INFRA · 2 ·
    STORAGE · 1 · INDUSTRY · 1")
  - Any domain skipped (with reason: no qualifying candidates / all
    candidates failed dedup / etc.)
```

**Cap rationale**: ≥4 floor + ≤6 ceiling per domain creates a soft
distribution band. Genuine model-release Friday still allowed (AI=6) but
not pure AI day (AI=10). Sparse storage day allowed (Storage=0 logged)
but not "every Storage candidate dropped" without trace.

## 5. Deep-story selection (Step 5)

Replace the existing decision logic:

```
For each top candidate (score ≥8):
  a. Worth a deep-story? (drillable depth + 600-1200 lines warranted)
  b. If yes: consider which archetype fits.

Decision tree:
  - Time-ordered story of an event              → narrative
  - Structural exposition of a new design       → technical-deep-dive
  - "Why is this happening?" puzzle             → investigation
  - Two or more options to choose between       → comparison
  - Reader may not know what X even is          → explainer
  - None fit cleanly, or fits multiple awkwardly → freeform

Picking 3 deep-stories with constraints:
  - All 3 must score ≥8
  - ≥2 distinct domains required if writing 3 (≥1 if writing 2)
  - ≥2 distinct archetypes required if writing 3 (avoid 3 narratives
    in a row); freeform counts as its own archetype for diversity
  - If 3 candidates can't satisfy domain + archetype diversity,
    write fewer (2 or 1). Don't force.
```

## 6. Sidecar JSON schema change

Add `deep_archetype` field to deep-story sidecars (roundup unchanged):

```json
{
  "title": "...",
  "date": "YYYY-MM-DD",
  "archetype": "daily-deep-story",
  "deep_archetype": "narrative" | "technical-deep-dive" | "investigation"
                    | "comparison" | "explainer" | "freeform",
  ...
}
```

Field is **required** for `archetype: "daily-deep-story"` posts. The
publish.mjs script enforces presence. archetype-check.mjs reads the value
to decide which structural rule set to apply.

## 7. Reference doc reorganization

Existing `references/archetypes.md` is ~210 lines; adding 5 archetype
specs in-place would push past 500-line readability cliff. Split:

```
skills/daily-news/references/
├── archetypes.md                    (overview + roundup spec, ~100 lines)
├── archetypes/
│   ├── deep-narrative.md            (~80 lines)
│   ├── deep-technical-deep-dive.md  (~80 lines)
│   ├── deep-investigation.md        (~80 lines)
│   ├── deep-comparison.md           (~80 lines)
│   ├── deep-explainer.md            (~80 lines)
│   └── deep-freeform.md             (~50 lines)
```

`archetypes.md` stays as the entry point — it lists the six options with
one-line descriptions and points to the per-archetype detail files.

SKILL.md Step 6/7 instructions: "After picking the archetype in Step 5,
read `references/archetypes/<name>.md` for the structural rules to follow
when writing." Skill loads only the relevant detail file (progressive
disclosure).

## 8. archetype-check.mjs rules

Per-archetype validation (selected via sidecar `deep_archetype`):

| Archetype | Required H2s | H2 count | Other |
|---|---|---|---|
| narrative | `what happened`, `why it matters`, `so what` | exactly 3 | closer is `Take-away` |
| technical-deep-dive | (free names) | 3–5 | closer is `What this enables`; no `what happened` / `why it matters` / `so what` H2s |
| investigation | `observation`, `the truth`, ≥1 `hypothesis: ...` | depends | closer is `Take-away` |
| comparison | `how to choose`, ≥3 `dimension: ...` | depends | closer is `Take-away`; ≥1 `<table>` or `<svg class="vg-w-comparison-*">` |
| explainer | `start with a concrete case`, `where today's tools fall short`, `the core idea`, `what it actually looks like`, `when you'd reach for it` | exactly 5, in this order | closer is `Take-away` |
| freeform | (none) | (any) | universal contract only |

**Universal contract** (all 6 archetypes):
- `<p class="vg-deep-opener">` exists
- `<span class="vg-dropcap">` exists
- `<p class="vg-deep-closer">` exists with `<strong>` inside
- ≥2 inline `<svg>` elements
- Chrome from `layouts/post.njk` (auto)

## 9. `/archetypes/` page (Eleventy collection)

Mirror kaer-morhen's `/archetypes/` catalog page.

### 9.1 Index page `/archetypes/`

```
[Hero]
  archetype catalog
  Six structural shapes that bespoke posts on this site take.

[Group 1: roundup]
  ┌────────────────────────────────────┐
  │ [SVG silhouette]  daily-roundup    │
  │                   The day's index. │
  └────────────────────────────────────┘

[Group 2: deep-stories]
  Five structured shapes + one freeform.
  ┌──────────┬──────────┬──────────┐
  │ silhou.  │ silhou.  │ silhou.  │
  │narrative │technical-│investiga-│
  │          │deep-dive │tion      │
  ├──────────┼──────────┼──────────┤
  │ silhou.  │ silhou.  │ silhou.  │
  │comparison│explainer │freeform  │
  └──────────┴──────────┴──────────┘
```

Each entry shows:
- Small SVG silhouette (~120×72 viewBox, abstract structural shape)
- Archetype name (Spectral 600)
- One-line definition (IM Fell italic)
- Click → detail page

### 9.2 Detail page `/archetypes/<name>/`

Example `/archetypes/investigation/`:

```
[Crumb] ← archetype catalog · investigation

[Hero]
  investigation
  追兇文 — 從反直覺現象開始，逐步排除假設找到 root cause

[Required structure]
  H2 sections required
  ────────
    observation
    hypothesis: {{name}}  ×1-3
    the truth

  Widgets ≥2
  ──────
    1× metrics chart (the puzzle)
    1× flame graph / sequence (the reveal)

  Closer
  ──────
    Take-away: methodology lesson ("next time, look at Y first")

[Real examples]
  Posts using this archetype
  ────────────
    YYYY.MM.DD  {{title}} → link
    (auto-populated from collections.posts filtered by deep_archetype)

[HTML skeleton]
  <pre><code> ... full required structure ... </code></pre>
```

### 9.3 Six SVG silhouettes

| Archetype | Silhouette concept (120×72 viewBox, currentColor stroke) |
|---|---|
| daily-roundup | 10 horizontal stacked thin rectangles representing list items |
| narrative | 3 vertical "act" boxes connected by → arrows; tiny circle (drop cap) top-left |
| technical-deep-dive | 3-5 boxes arranged as architecture diagram with connecting lines |
| investigation | 3 dashed boxes labeled with X marks (failed hypotheses), one solid box (truth) |
| comparison | 2-column grid with check/X cells; arrow at bottom (→ choice) |
| explainer | 5 stepped cells ascending diagonally (concrete → abstract progression) |
| freeform | Loose dotted outline with `?` glyph in center, intentionally unspecified |

### 9.4 Eleventy plumbing

`src/archetypes/` contents change role: was "skill template files,
excluded from collections"; becomes "actual rendered pages".

- `src/archetypes/archetypes.11tydata.json`:
  - Remove `eleventyExcludeFromCollections: true`
  - Add `layout: layouts/archetype.njk`
  - Add `permalink: /archetypes/{{ page.fileSlug }}/`
- Each `src/archetypes/<name>.html`: rewrite from "TODO_*" placeholders
  to actual displayable spec content (H2 list, widget budget, code
  skeleton)
- `src/_includes/layouts/archetype.njk`: new layout extending base.njk,
  renders the detail page chrome (crumb, hero, real-examples filter)
- `src/archetypes-index.njk`: new page at `/archetypes/`, renders the
  6-card grid with silhouettes
- `src/_data/site.js` nav: add `{ href: "/archetypes/", label: "archetypes" }`
  unconditionally (visible from day 1)

## 10. Sample posts

Existing `src/posts/2026/05/16/`:
- `roundup.html` (sample) — keeps role
- `deep-sample.html` (sample) — rename to `deep-narrative-sample.html`
  (most existing structure is narrative shape)

Add 5 more sample posts in same directory (one per other archetype):
- `deep-technical-deep-dive-sample.html`
- `deep-investigation-sample.html`
- `deep-comparison-sample.html`
- `deep-explainer-sample.html`
- `deep-freeform-sample.html`

Each sample's sidecar declares `deep_archetype: "<name>"`. Each sample
exists primarily to:
1. Validate the archetype check rules pass on a real example
2. Populate `/archetypes/<name>/` Real examples section so the catalog
   isn't empty on day 1
3. Show the routine (and future readers) what each archetype's structure
   actually looks like in rendered form

These are **structural samples** — the prose can stay placeholder ("這是
範例 X 文，用來示範 Y 結構") but the H2s, widgets, opener/closer must be
real. Sample roundup item count and lede stays as-is.

When routine produces real content for the day, the samples get
overwritten (same path). Phase 1's hand-written sample legacy lives only
in git history.

## 11. Phased rollout

### Phase A — Spec + reference docs

- Write this spec
- Split `references/archetypes.md` → `references/archetypes/<name>.md`
  six files (overview stays in `archetypes.md`)
- SKILL.md updates: Steps 4/5/6/7 reflect new domain rule + archetype
  decision tree + reference path
- No changes to archetype-check.mjs, no changes to sample posts, no
  `/archetypes/` page yet

**Exit**: human reviews 6 archetype reference docs, confirms each spec is
clear enough to author against.

### Phase B — `/archetypes/` page + check rule rewrite

- Build `archetype.njk` layout + `archetypes-index.njk` page
- Six SVG silhouettes
- `src/archetypes/*.html` + sidecars rewritten as renderable detail
  content
- `archetype-check.mjs` extended with per-archetype rule set (selected
  by sidecar `deep_archetype`)
- `site.js` nav adds `archetypes` link
- One sample post (narrative) demonstrating correct check pass

**Exit**: `/archetypes/` index + each detail page renders in dev. The
narrative sample passes archetype-check. Cloudflare preview confirms.

### Phase C — Remaining samples + first real routine run

- Write 5 more sample posts (one per other archetype, including freeform)
- Each sample declares correct `deep_archetype` and passes its check
- `/archetypes/<name>/` Real examples sections populate from these samples
- Run daily-news skill once for today's date (UTC+8)
- Skill writes to `src/posts/YYYY/MM/DD/` (overwriting samples for that
  date — sample legacy lives in git history)
- Commit, push, Cloudflare deploys
- Live `vatt-ghern.pages.dev` shows real content + `/archetypes/` catalog

**Exit**: visiting the live URL shows today's actual routine-produced
content + `/archetypes/` catalog populated.

## 12. Open questions deliberately deferred

- **Variant counts within archetypes** (e.g., "narrative-incident" vs
  "narrative-release-week"): not now. The 6 archetypes already cover
  most ground; sub-variants would split the catalog further without
  adding much guidance.
- **Allowing archetype mid-flight switch** (skill picks narrative, then
  while writing realizes it should be investigation): not now. Skill must
  commit at Step 5 and stay. If it discovers wrongness, fall back to
  freeform with the prose already written. Cleaner than mid-write
  re-architecture.
- **Per-archetype color or sigil accent** (sage for investigation, accent
  for narrative, etc.): not now. The 6 archetypes share the same chrome.
  Visual differentiation per-archetype would help catalog scanability but
  is decoration, not structure — defer until catalog has volume.
