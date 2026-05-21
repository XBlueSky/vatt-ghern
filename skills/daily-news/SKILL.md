---
name: daily-news
description: This skill should be used when the user asks to "run daily news", "publish today's news", "draft today's vatt-ghern roundup", "do the daily-news routine", invokes `/vatt-ghern:daily-news`, or asks Claude to author tech-news posts for the vatt-ghern blog. The skill produces one daily-roundup HTML (10 items) plus up to three daily-deep-story HTML posts under `src/posts/YYYY/MM/DD/`, runs anti-duplication checks against the past 7 days, and opens a PR to `main`. Always use this skill (instead of authoring news posts ad-hoc) so output stays consistent with the archetype rules, design system, and dedup conventions.
version: 0.1.0
---

# daily-news

Curate today's tech news for the vatt-ghern blog and publish it as bespoke
HTML posts. Adopt a senior-tech-lead persona, fetch from a priority source
list, score and de-duplicate against the past 7 days, write one roundup and
up to three deep-stories, and open a pull request for human review.

## When this skill runs

Three invocation paths converge here:

- **Daily** — `/vatt-ghern:daily-news` (defined in
  `${CLAUDE_PLUGIN_ROOT}/commands/daily-news.md`). Executes the full
  9-step workflow below.
- **Weekly rollup** — `/vatt-ghern:weekly` (Monday morning). Skips
  Steps 2–6; reads past 7 days via
  `scripts/load-past-roundups.mjs --days=7`; computes week-over-week
  delta via `scripts/decisions/weekly-delta.mjs --end=YYYY-MM-DD`;
  authors one `weekly.html` using the `weekly-rollup` archetype.
- **Monthly rollup** — `/vatt-ghern:monthly` (first of month). Same
  pattern as weekly but `--days=<28..31>` and `monthly-rollup` archetype.
- **Routine fallback**: Claude Routines invoking the repo may load this
  SKILL.md directly when the slash command is unavailable. The routine
  inspects its own schedule to decide daily vs weekly vs monthly.

For weekly/monthly invocations, read the rollup archetype reference
(`references/archetypes/weekly-rollup.md` or
`references/archetypes/monthly-rollup.md`) — it spells out which
workflow steps to skip and what the output looks like.

Do not author daily news posts without this skill. Ad-hoc posts drift from
the archetype rules and break the dedup invariants that future days depend
on.

## Required reading before authoring

Read these references before producing output. They are the single source of
truth — do not re-derive their contents:

- **`references/persona.md`** — Voice (measured, curious, materially-rooted),
  five priority domains, what earns inclusion vs. what doesn't, punctuation
  rules (`：` not `:`; `——` not `—`).
- **`references/sources.md`** — Tier-1 through Tier-5 source list with
  priority order. HackerNoon is the primary signal.
- **`references/archetypes.md`** — Required HTML structure for roundup and
  deep-story, sidecar JSON schema, content rules, scoring rubric.
- **`references/anti-duplication.md`** — Rules for the 7-day window check
  and how to handle near-duplicates.
- **`references/design-system.md`** — Color tokens, font stacks, component
  classes, read-tracking attribute conventions, SVG patterns.
- **`references/widget-isolation.md`** — CSS / ID / JS scoping contract for
  inline SVG widgets.

## Workflow — nine steps

Execute in order. Do not skip steps. If a step fails, report the failure
mode rather than silently producing partial output.

### Step 1: Load context

Run the load-context script and parse its JSON output:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/daily-news/scripts/load-context.mjs
```

Returns: `today` (YYYY-MM-DD, UTC+8), `past_news_ids`, `past_urls`,
`past_roundup_titles`, `past_deep_titles`. Keep this blob — it is the
anti-duplication ground truth for steps 3, 4, and 5.

### Step 2: Fetch sources

Run the dispatcher to pull every registered source:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/daily-news/scripts/fetch-all.mjs
```

It reads `src/_data/sources.yml`, calls the right fetcher per `type`
(arxiv, hf, sitemap, lobsters_json, html_index), updates
`src/_data/web-state.json` for sitemap sources, and prints a summary.

For `html_index` records the script returns them in `deferred[]` —
those still need Claude's `WebFetch` tool for LLM summarisation. Walk
each deferred record in tier order and ask:

> "List the top 8 items from this page that look like original
> engineering blog posts (not job listings, marketing pages, or product
> launches without technical content). For each, give me title, canonical
> link, and a 1-2 sentence summary of the substance."

Merge the WebFetch results with the dispatcher's `candidates[]` array,
de-duplicate by canonical URL across sources, aim for ~50–100 candidates
total. If fewer than 5 sources succeed (concrete + deferred combined),
fail-fast: report which sources failed and abort without writing files.

**Sitemap candidates need a title-resolution pass.** Records from
`sitemap` sources carry `title: <url>` because a `sitemap.xml` has no
human title. Before scoring, batch-WebFetch each sitemap candidate
URL (skip if it scores < 5 on the rubric without fetching). Replace
`title` with the page's `<title>` or `<h1>`; if WebFetch returns a
listing/index page rather than an article, drop the candidate.

The full source catalogue and per-source rationale lives in
`src/_data/sources.yml`. The narrative in `references/sources.md`
documents tier philosophy.

### Step 3: Score and filter

For each candidate, assign a domain (ai / systems / infra / web / backend)
and a subjective score 0–8 covering the rubric's three subjective axes
(`teaches non-obvious` + `actionable` + `substantial original`). The
mechanical +2 domain-coverage bonus is added by the score module below.

Drop candidates that:

- Have a canonical URL already in `past_urls`
- Have a title whose Jaccard char-bigram similarity > 0.85 against any
  `past_roundup_titles` (compute this manually — the formal check runs in
  step 8 via `check-dup.mjs`)
- Violate the "what does NOT earn a place" rules in `persona.md`

**Advisory check**: write the surviving candidates (each carrying
`subjective_score: 0-8`, `domain`, `url`, `title`, `source_id`,
`source_tier`) as a JSON array and pipe through the score module to add
the objective `+2 domain coverage bonus` mechanically:

```bash
cat candidates.json | node skills/daily-news/scripts/decisions/score.mjs > scored.json
```

The module adds `coverage_bonus` and `score` fields. You MAY override the
final `score` if you see a rubric mismatch (e.g., the +2 bonus pushed a
marginal item into the deep-story tier). Record overrides in PR body
under `### Advisory overrides`.

### Step 4: Pick today's items (domain coverage)

Aim: all 5 priority domains represented (ai / systems / infra / web /
backend). Hard floor: ≥4 distinct domains. Per-domain cap: ≤6 items.

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

**Advisory check**: pipe scored candidates through the cover-domains
module:

```bash
cat scored.json | node skills/daily-news/scripts/decisions/cover-domains.mjs > selected.json
```

The module returns `{ selected, skipped_domains, capped_domains }` with
each selected item carrying a `rank_nn` field (`"01"`..`"10"`). Wrap with
the date prefix to produce `news_id` values (`2026-05-19-01`, etc.). You
MAY override the selection (e.g., swap a marginal pick for a higher-
impact candidate the algorithm dropped). Record overrides in PR body
under `### Advisory overrides`.

**PR body must list**:
- Domain distribution (e.g., "AI · 3 · SYSTEMS · 3 · INFRA · 2 ·
  WEB · 1 · BACKEND · 1")
- Any domain skipped (with reason: no qualifying candidates / all
  candidates failed dedup / etc.)
- Any domain that hit the cap and had candidates dropped (e.g.,
  "8 qualifying items in AI today, top 6 selected")

### Step 5.0: Cluster candidates across sources

Before deciding which candidates earn a deep-story, cluster them so the
same story spotted on multiple sources gets one combined brief rather
than competing briefs. Pipe the merged `candidates[]` (Step 2's
dispatcher + WebFetch results) through the clustering helper:

```bash
cat candidates.json | node skills/daily-news/scripts/decisions/cluster.mjs > clusters.json
# (npm run sources:cluster still works via the cluster-candidates.mjs shim)
```

Or in-process:

```js
import { clusterCandidates } from "./skills/daily-news/scripts/decisions/cluster.mjs";
const clusters = clusterCandidates(candidates);
```

Each cluster has shape:

```js
{ primary: { ... }, variants: [ { ... }, ... ] }
```

Two candidates cluster when their canonical URLs match (modulo
`utm_*`, hash, trailing slash) OR their title token-Jaccard ≥ 0.6.
Clustering is transitive (union-find). `primary` is the highest-tier
variant in the cluster (lowest `source_tier` number; ties broken by
longest summary then lowest `source_id`). Singletons (candidates that
didn't cluster with anything) still appear, with
`primary === variants[0]`.

Use these clusters as the unit of decision in the rest of Step 5: one
deep-story per cluster, not per candidate. A cluster's score = its
`primary`'s score; do not aggregate scores across variants.

When a deep-story is written from a multi-variant cluster, the
sidecar's `sources[]` array must list every variant's canonical URL,
not just the primary. That is the data-layer signature of
cross-source synthesis — the post visibly draws from multiple upstream
signals.

### Step 5: Pick deep-story candidates + choose archetype

For each **cluster** whose `primary` scored ≥8 from Step 4, decide:

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

**Advisory check**: for each ≥8 cluster, extract the 6 archetype signals
(`time_ordered`, `structural_exposition`, `puzzle_with_hypotheses`,
`multiple_options`, `concept_unknown`, `hybrid_or_unclear` — all booleans
based on what the source URL reads like) and pipe through the archetype
module:

```bash
echo '{"signals":{"time_ordered":true,"structural_exposition":false,"puzzle_with_hypotheses":false,"multiple_options":false,"concept_unknown":false,"hybrid_or_unclear":false}}' \
  | node skills/daily-news/scripts/decisions/pick-archetype.mjs
```

The module returns `{ archetype, matched_signal }`. You MAY override
(e.g., module said `narrative` but the post is structural exposition with
a timeline framing, so `technical-deep-dive` fits better). Record
overrides in PR body under `### Advisory overrides`.

**Phrasing freedom**: archetype reference files describe the *arc*
(e.g., setup → mechanism → consequence for narrative), not the exact
H2 text. Name each H2 after the actual topic — generic phrasing
(`what happened` / `why it matters` / `so what`) makes every post in
an archetype feel like the same post. The test suite checks H2
*counts*, not strings. Closer labels are also free; pick one that
fits the post's voice.

**c. Selection constraints when writing up to 3**:

- All 3 must score ≥8
- ≥2 distinct domains required if writing 3 (≥1 if writing 2)
- ≥2 distinct archetypes required if writing 3 (avoid "3 narratives in
  a row"); `freeform` counts as its own archetype for diversity
- If candidates cannot satisfy domain + archetype diversity, write
  fewer (2 or 1). Do not force.

**d. Pre-dispatch URL dedup (added 2026-05-21 after PR #30)**:

Before finalising the deep-story picks for Step 7a, run the URL-dedup
helper to catch any pick whose URL already appears in the past 7 days.
This must happen *here*, not at Step 8 — otherwise a sub-agent will
write an entire deep-story (DONE) only to have it dropped during the
formal `check-dup.mjs` run, leaving an empty deep-story slot with no
refill path.

```bash
echo '{"candidates":[{"news_id":"...","url":"...","title":"...",...}, ...],
       "past_urls":[ ...from load-context.mjs... ]}' \
  | node skills/daily-news/scripts/decisions/dedup-urls.mjs
```

The module returns `{ kept, dropped }`. Any candidate in `dropped`:

1. Is NOT dispatched in Step 7b.
2. MUST be replaced by the next-best deep-story candidate from Step 5b
   that satisfies the same constraints (≥8 score, domain + archetype
   diversity). If no qualifying replacement exists, reduce N by 1 and
   note `Domains skipped today` accordingly. Do NOT leave deep-story
   N silently below target without refilling first.
3. The `roundup` separately must also drop or swap that URL — handle
   the roundup-side dedup before writing roundup HTML in Step 6.

Record any dedup-driven swap or refill in PR body under
`### Advisory overrides`. Example: "`deep[01] = GitHub eBPF` dropped on
URL collision with 2026-05-16 roundup; refilled with cluster #07 (Slack
HTTP/3, score 8, infra domain)".

**Invariant**: `N_deep_dispatched_in_step_7b == N_deep_final_in_PR`. If
not, the routine has a bug in this step. Recording a "dropped, not
refilled" deep-story in the PR body is acceptable ONLY when Step 5d
truthfully reports `replacement_pool_exhausted: true` — never as a
silent N reduction.

After picking each archetype, read the corresponding detail file for the
structure rules to follow when writing:

- `${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/archetypes/deep-narrative.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/archetypes/deep-technical-deep-dive.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/archetypes/deep-investigation.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/archetypes/deep-comparison.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/archetypes/deep-explainer.md`
- `${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/archetypes/deep-freeform.md`

### Step 6: Write roundup HTML + sidecar

Read the archetype skeleton at
`${CLAUDE_PLUGIN_ROOT}/src/archetypes/daily-roundup.html` for structure
reference. Author the full HTML following
`references/archetypes.md` § "Roundup spec".

Write to `src/posts/YYYY/MM/DD/roundup.html` plus matching
`.11tydata.json` sidecar.

**Required structural attributes** (the test suite checks them):

- Each item card has `id="item-NN"` (zero-padded), corresponding to
  the score-order `news_id`
- Each item card has `data-vg-readkey-item="{{page.url}}#item-NN"`
- Each item card wraps its `<h2>` + `<p class="vg-card-lede">` +
  `<p class="vg-card-meta">` content in a `<div class="vg-card-roundup-body">`
- Progress span has `data-vg-progress-of` and `data-vg-progress-total`

**Required emit order** (NOT score order):

Items render grouped by domain in this fixed order:
`ai → systems → infra → web → backend`. Within each domain, sort
by score descending. Each non-empty domain emits exactly ONE section
label header at the top of its group (with `<span class="vg-roundup-section-count">N 篇</span>`).
Empty domains emit no section.

**Lede length**: 2-3 Chinese sentences. First = what happened, second =
why an engineer cares, optional third = a concrete number / quote /
consequence. Lint allows up to 4 `。` periods (covers 2-3 sentences
plus inline references like `ClickHouse 25.11.`).

**Lede typography**: render as `<p class="vg-card-lede">` — CSS handles
the rest (Spectral 400 normal at `--fs-sm`). Do not add inline
`style=""` or italic markup.

**Hero lede chrome label**: the hero `<p class="vg-roundup-lede">` MUST
begin with an inline `<span class="vg-roundup-lede-label">TODAY'S THREAD</span>`
prefix (uppercase English, no trailing colon) followed by a space and
the CJK summary sentence. Do NOT prefix the CJK summary with
"今日主旋律：" — the English label has replaced that role.

**Do NOT hardcode read-state buttons in HTML**. The read-tracker
(`src/static/read-tracker.js`) injects all of these at page load:

- `↶ unread` button inside each `.vg-card-roundup-body`
- `✓ mark read` button (with separator) appended into each `.vg-card-meta`
- `mark all read` link appended next to the progress span

Emit only source link, optional deep link, optional tag chip in the meta
row. The button surface is owned by JS so it can evolve without
re-emitting historical roundup HTML.

### Step 7a: Prepare deep-story briefs

For each cluster picked in Step 5 (≤3 briefs total), construct a
deep-story brief following the contract in
`references/deep-story-brief.md`. Each brief is fully self-contained
— it knows its cluster, its archetype, its output path, and all the
reference files it needs.

Each brief carries these fields:

- `news_id` — the YYYY-MM-DD-NN from the roundup
- `primary_url` and `variant_urls[]` — every variant from the cluster
- `title`, `domain`, `archetype` — set in Step 5
- `summary` — 2-3 sentences telling the sub-agent what to cover
- `output_path` — `src/posts/YYYY/MM/DD/deep-<kebab-slug>.html`
- `sidecar_path` — same path with `.11tydata.json`
- `related_roundup` — `/YYYY/MM/DD/roundup/`

Briefs must be finalised before any dispatch in Step 7b — the parent
agent is the only place that knows the cluster→archetype mapping and
the dedup state. Each sub-agent sees only its own brief.

The sidecar contract is unchanged:

- `archetype` is `"daily-deep-story"`
- `deep_archetype` is the value picked in Step 5
- `sources[]` MUST include every variant_url, not just the primary
  (cross-source synthesis contract from Step 5.0)

### Step 7b: Dispatch parallel deep-story sub-agents

Issue all ≤3 dispatches in ONE response (single message containing
multiple `Agent` tool blocks). Each dispatch uses
`subagent_type: general-purpose` with **`model: "opus"` required** —
author writing is a design-grade judgment task (archetype selection,
H2 structuring, opener/closer crafting, material density), not
mechanical pattern-matching. Default sub-agent model selection
(cheap) is wrong here. If Opus is not available at dispatch time,
report BLOCKED rather than fall back to a cheaper model — the routine
should produce no PR rather than a PR of unknown calibration. The
brief from Step 7a is passed as the prompt — see
`references/deep-story-brief.md` for the exact markdown template
each sub-agent receives.

Sub-agents run concurrently; the parent waits for all to return before
proceeding to Step 7c.

Each sub-agent is constrained per the brief:

- Tools allowed: WebFetch, Read, Write only.
- No nested `Agent` dispatch, no Bash, no Edit on other days' posts,
  no git operations.
- Writes ONE HTML to `output_path` + ONE sidecar to `sidecar_path`,
  reports back with `{status, char_count, archetype, archetype_deviations}`.

If a sub-agent reports `BLOCKED` or `DONE_WITH_CONCERNS`:

- `DONE_WITH_CONCERNS` with a documented deviation → accept and
  proceed; note the deviation in the PR body.
- `BLOCKED` → re-dispatch that one brief with additional context, or
  drop the deep-story (reducing N to N-1). Do NOT skip QA — the
  routine remains correct with fewer deep-stories.

### Step 7c: Verify deep-story outputs

After all sub-agents return:

1. Read each output HTML + sidecar back to confirm the files exist and
   the sidecar parses as JSON.
2. Verify per-file invariants the sub-agent was told to honour:
   - Prose ≥ 500 lines (HTML lines excluding inside `<script>`,
     `<style>`, `<svg>`, `<canvas>` blocks).
   - `<p class="vg-deep-opener">` and `<p class="vg-deep-closer"><strong>`.
   - ≥ 3 widgets total (count of elements with `class="vg-w-*"`).
   - ≥ 1 widget is interactive (contains `<script>` OR `<input>`
     OR `<canvas>` OR `animation-timeline: scroll()` in inline CSS).
   - Universal contract from `deep-freeform.md` applies to all archetypes.
   - Body matches the picked archetype's H2 *count range* (phrasing free).
   - Sidecar contains `widget_count`, `widget_questions`,
     `widget_templates` arrays; lengths agree.
3. **Count-conservation invariant** (added 2026-05-21 after PR #30):
   `N_deep_dispatched_in_step_7b == N_deep_written_files`. If a
   sub-agent BLOCKED or its output got dropped, refer to Step 5d's
   refill loop — do NOT silently let N drop. The PR body must
   explicitly account for every dispatched brief (DONE,
   DONE_WITH_CONCERNS, BLOCKED, or refilled-after-drop).
4. **BA-slider pane invariant** (added 2026-05-21 after PR #30): if
   any deep-story contains a before/after slider widget
   (`.vg-w-ba-*`), inspect both `.before` and `.after` panes via
   Playwright DevTools and confirm both contain visible, sensical
   content at the default 50/50 position. The PR #30 Rust BA widget
   inverted DOM order + clip-path; the right pane was authored
   correctly but never painted. Spot-check via:

   ```js
   document.querySelectorAll('.vg-w-ba-* .before, .vg-w-ba-* .after')
     .forEach(el => console.log({ cls: el.className, h: el.scrollHeight, text: el.textContent.slice(0,60) }));
   ```

   Both panes must report nonzero `scrollHeight` and non-empty
   `textContent`. See `widget-cookbook/tier-2-snippets/before-after-slider.md`
   for the canonical pattern.
5. **Banned widget templates invariant** (added 2026-05-21 after PR #30):
   the deep-story sidecar's `widget_templates` array MUST NOT include
   any of the banned ids. Current ban list:
   - `scroll-driven-explanation` (sticky figure leaves viewport
     before stages change; fragile observer margins; mobile sticky
     covers the prose)
   - `css-scroll-timeline` (same scroll-position fragility, no
     reliable fallback)

   If a sub-agent returned a deep-story whose sidecar references a
   banned id, REJECT the output and re-dispatch the brief with an
   explicit instruction to pick a non-banned alternative
   (typically `tab-switcher-pure-css` for staged narratives, or
   `annotated-diagram-walkthrough` for architecture exposition).
   The canonical reference implementation is the Meta migration
   tabs widget `vg-w-tabs-meta-ingest-migration` in
   `src/posts/2026/05/21/deep-meta-data-ingestion-migration.html`.
6. The mechanical QA gate in Step 8 (`archetype-check`, `check-dup`,
   `html-validate`, `link-check`) is the formal validation. Step 7c is
   the first-pass sanity check before that.

PR body must list:

- One line per deep-story: news_id, archetype, slug, char count,
  archetype-deviations (if any).
- "Parallel dispatch summary": which N briefs were dispatched, how
  many returned DONE / DONE_WITH_CONCERNS / BLOCKED, and any
  re-dispatches needed.
- Explicit `N_deep_dispatched == N_deep_final` reconciliation. Any
  drop must point at a Step 5d refill attempt (success or "pool
  exhausted").

### Step 7.5: Content quality gate

After Step 7c verifies structure, run the content-quality reviewer pass on
the roundup + each deep-story. This is the only step that judges
whether the prose is actually good — Step 8 catches HTML / dedup /
archetype-count failures, Step 8.5 catches visual issues, but neither
looks at story arc, hook strength, or whether H2s are template-shaped.

**Wallclock is NOT capped** in this step. Quality trumps speed.

#### Step 7.5a: Dispatch dual reviewers (parallel)

For each post produced in Steps 6 + 7 (1 roundup + N deep-stories,
max 3), dispatch **2 independent reviewer sub-agents** with
`subagent_type: general-purpose` and **`model: "opus"` required**.
Reviewer quality judgment (Axis 2 structural coherence, Axis 4 depth
vs. paraphrase, Axis 6 anti-template) is a design-grade task. Running
reviewer on the same model family as author also produces LLM-judging-LLM
bias — using Opus widens the judgment-power gap when author defaults
to Sonnet, and preserves judgment depth when author is also Opus. If
Opus is unavailable at dispatch time, report BLOCKED rather than fall
back. Each reviewer's brief follows the template in
`${CLAUDE_PLUGIN_ROOT}/skills/daily-news/references/content-reviewer-brief.md`
with the per-post values substituted.

Total batch size: 2 × (1 + N) reviewer sub-agents, all dispatched in
ONE response (single message with multiple `Agent` tool blocks).

Each reviewer:
- Tools: Read only
- Reads: post HTML + sidecar + rubric file + archetype reference (if
  deep-story) + persona file
- Does NOT read: other posts, exemplars, other reviewer's output
- Emits: ONE JSON object per the rubric's "Reviewer output format"
  schema

#### Step 7.5b: Consolidate dual-reviewer findings

For each post, parent receives 2 reviewer outputs. For each axis:
- `consensus_score = min(reviewer_A.score, reviewer_B.score)` (lower
  = stricter gate)
- `disagreement = |reviewer_A.score - reviewer_B.score|`

If `disagreement >= 2` on any axis, record for PR body:
`<output_path> Axis <name>: reviewer-A=<A>, reviewer-B=<B>`.

Derive per-post `overall` from consensus scores using the rubric's
band semantics:
- Any consensus axis <= 3 → BLOCKING
- Otherwise any consensus axis 4-6 → IMPORTANT
- Otherwise any consensus axis 7-8 → PASS-with-notes
- All consensus >= 9 → PASS

#### Step 7.5c: Per-post retry loop

For each post with `overall` BLOCKING or IMPORTANT, construct a retry
brief for the author sub-agent. The retry brief is the post's
original brief (from Step 7a — held by parent) PLUS:

- The current `output_path` (existing draft is the starting point)
- The reviewer findings: each weak axis, its consensus score, both
  reviewers' justifications
- Explicit instruction on the target level (axis must reach >= 7 to
  exit BLOCKING; >= 7 to exit IMPORTANT)
- Permission to keep widgets unchanged unless reviewer findings cite
  widget content (most prose findings should not touch widgets)

Parent dispatches retry author sub-agents in parallel (one per post
needing retry) — **same `model: "opus"` requirement as Step 7b**.
After all retries return, re-dispatch the dual reviewers (Step 7.5a,
also Opus) for each retried post; consolidate again (Step 7.5b).

Iteration budget per post:
- **BLOCKING**: up to 5 retry rounds. If still BLOCKING after 5 →
  drop this post (N → N-1). Log to PR body under
  `## Step 7.5 Blocking drops`.
- **IMPORTANT**: up to 3 retry rounds. If still IMPORTANT after 3 →
  accept the current draft, log to PR body under
  `## Content Quality Concerns`.
- **PASS-with-notes / PASS**: no retry; logged for transparency only.

If a reviewer emits malformed JSON: re-dispatch that reviewer up to 2
extra times. If still malformed, treat as a vote of BLOCKING on that
post (drop the post).

If the roundup itself reaches BLOCKING and exhausts retries: this is
a routine failure. Do NOT open PR. Report BLOCKED status with the
roundup's blocking axes.

#### Step 7.5d: Inter-post diversity check (only when N_final >= 2)

After all per-post retries settle, count the number of deep-stories
still in the batch (`N_final`). If `N_final >= 2`, dispatch ONE
inter-post reviewer sub-agent (**`model: "opus"` required**, same
rationale as Step 7.5a) with the inter-post brief variant from
`content-reviewer-brief.md`. It scores Axis 7 only.

If `batch_score < 7`:
1. Identify `most_similar_post` from the reviewer output.
2. Construct a retry brief: original brief + "find another angle"
   instruction + the inter-post reviewer's justification on what
   makes this post too-similar-to-others.
3. Dispatch one retry author sub-agent for that post (Opus, per
   Step 7b).
4. Re-dispatch the inter-post reviewer (Opus, per above).
5. Up to 2 inter-post retry rounds. If still `batch_score < 7`
   after round 2, accept and log to
   `## Inter-post diversity concerns`.

`N_final = 1` → skip Step 7.5d entirely.

#### Step 7.5e: Collate findings for PR body

Parent now has, for each surviving post:
- Final per-axis consensus scores
- Final overall status
- Retry rounds run
- Reviewer disagreement notes (if any axis disagreed by >= 2)

And, if N_final >= 2:
- Final batch_score
- Inter-post retries run

These populate the PR body sections defined in Step 9's template
(see Step 9 prose).

#### Failure modes for Step 7.5

| Scenario | Handling |
|---|---|
| One reviewer emits malformed JSON | Re-dispatch that reviewer (up to 2 retries). Still malformed → treat as BLOCKING vote on that post. |
| Both reviewers crash on one post | Treat as BLOCKING for that post. Drop the post if it's a deep-story; abort routine if it's the roundup. |
| All N deep-stories blocking-drop | Routine continues with roundup-only PR; PR title says "(0 deep stories)" and PR body documents the drops. |
| Roundup blocking-drops | BLOCKED — do NOT open PR. Report status with roundup's blocking axes. |
| Reviewer dispatch returns no output (network / tool failure) | Re-dispatch that reviewer once. Still nothing → treat as BLOCKING vote. |

### Step 8: Self-check (mechanical)

Run the validation scripts:

```bash
# Dedup check (catches anything missed in step 3)
node ${CLAUDE_PLUGIN_ROOT}/skills/daily-news/scripts/check-dup.mjs src/posts/YYYY/MM/DD/

# Schema/structure check
node ${CLAUDE_PLUGIN_ROOT}/skills/daily-news/scripts/publish.mjs src/posts/YYYY/MM/DD/

# HTML validity + archetype + link check
npx @11ty/eleventy
npx html-validate "_site/**/*.html"
node ${CLAUDE_PLUGIN_ROOT}/tests/archetype-check.mjs _site/
node ${CLAUDE_PLUGIN_ROOT}/tests/link-check.mjs
```

If any step fails: fix the underlying content, re-run. Do not commit while
checks fail.

### Step 8.5: Visual self-review (Playwright + multimodal)

Mechanical checks (Step 8) catch broken HTML and missing structure; they
do NOT catch visual regressions like SVG widgets invisible in dark mode,
text overflow, layout collapse, or unreadable contrast. Step 8.5 closes
that gap by having Claude open each rendered page in Playwright, take a
screenshot, and look at it.

**Setup**:

```bash
npm run dev > /tmp/vg-dev-selfreview.log 2>&1 &
sleep 2 && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/
# ^ expect 200; otherwise tear down and BLOCK
```

**For each published post** (roundup + each deep-story):

1. Navigate Playwright to `http://localhost:8080/YYYY/MM/DD/<slug>/`
2. Initial viewport screenshot in light mode (default)
3. Switch to dark via **both** `localStorage` AND `data-theme` attribute —
   the site reads `localStorage` only on page load and then applies
   `data-theme` to `<html>`, so post-load `localStorage` change alone does
   nothing. Use:
   ```js
   localStorage.setItem("vg-theme", "dark");
   document.documentElement.setAttribute("data-theme", "dark");
   ```
   Then take initial viewport screenshot.
4. For widgets below the fold (deep-stories often have widgets 800–1500px
   down): use `document.querySelector('.vg-w-...').scrollIntoView()` then
   screenshot the **viewport**, not the element. Element-level screenshots
   (`target=` in playwright) are unreliable when multiple `<figure>` or
   `<svg>` elements exist on the page (strict-mode selector violation).
5. **Mobile audit — every deep-story, every widget** (added 2026-05-20
   after PR #23/#24/#25 surfaced widespread mobile issues):

   a. Resize browser to **375×812** (iPhone SE / small phone).

   b. For each deep-story, navigate to the post URL.

   c. For each widget inside `.vg-post-body figure[class*="vg-w-"]`:
      - `widget.scrollIntoView({ block: 'center' })`
      - Wait ~300ms for any sticky / IntersectionObserver to settle.
      - Take a viewport screenshot.
      - **Look at the screenshot**. Check:
        - Is every SVG label / axis / chart annotation readable?
          (Wide-aspect viewBox ≥4:1 widgets crush at 375px to ~80px
          tall — labels collide. See tier-3 §12.1.D-pre for fix
          patterns.)
        - Are tap targets ≥ 32px? (range thumbs, buttons, divider
          handles, SVG clickable rects.)
        - Does the widget overflow horizontally? (any `bb.right > 400`)
        - For scroll-driven widgets: does the sticky figure stay
          visible below the site header (not hidden behind chrome)?
          Site header is `position: sticky; top: 0; z-index: 50` ~100px
          tall — sticky widget figures must use `top: var(--vg-header-h)`
          per tier-3 §12.1.B.

   d. Also scroll past each scroll-driven widget's stages and verify
      the active stage class actually changes as the reader scrolls
      (IntersectionObserver mobile rootMargin per §12.1.E).

   e. **Semantic invariants — mechanical** (added 2026-05-21 after PR #30):
      run the two semantic-invariant scripts against every published
      page. These catch classes of failure that visual screenshot
      review systematically misses (because screenshots are
      downsampled and human reviewers pattern-match on "looks roughly
      right" rather than measuring).

      **(i) SVG legibility floor**: smallest text inside every
      `vg-w-*` SVG must render at ≥ 11 effective px on a 375 viewport.

      ```bash
      node ${CLAUDE_PLUGIN_ROOT}/skills/daily-news/scripts/measure-svg-legibility.mjs \
        http://localhost:8080/YYYY/MM/DD/<roundup-slug>/ \
        http://localhost:8080/YYYY/MM/DD/<deep-slug-1>/ \
        http://localhost:8080/YYYY/MM/DD/<deep-slug-2>/ \
        > /tmp/vg-legibility.json
      # exit 1 = at least one figure below the 11 px hard floor
      ```

      The script emits one JSON line per figure on stderr and an
      aggregate verdict on stdout. PASS = ≥ 11 effective px (target);
      SOFT-PASS = 10.0–11.0 (acceptable for deliberate calibration);
      FAIL = < 10 px. Fix by adding or bumping `data-svg-scroll="<min-px>"`
      on the `<figure>` per `references/design-system.md` § Mobile
      legibility floor. Treat any FAIL as a Blocking-tier issue.

      **(ii) SVG text overflow**: no `<text>` inside a `vg-w-*` figure
      may extend more than 2 SVG units past the right edge of the
      `<rect>` that semantically contains it.

      ```bash
      node ${CLAUDE_PLUGIN_ROOT}/skills/daily-news/scripts/check-svg-text-overflow.mjs \
        http://localhost:8080/YYYY/MM/DD/<deep-slug-1>/ \
        http://localhost:8080/YYYY/MM/DD/<deep-slug-2>/ \
        > /tmp/vg-overflow.json
      # exit 1 = at least one text overflows its owning rect
      ```

      Fix per `widget-cookbook/tier-3-principles.md` §12.1.D-bis:
      shorten the label, drop font-size (within legibility floor),
      move outside the rect, or split into stacked `<text>` lines.

   f. Record findings for the post in the issue list (see severity
      tiering below).

6. **Roundup mobile check**: navigate to roundup at 375px, screenshot
   the donut + top 3 item cards. Verify section labels render,
   read-tracker buttons inject correctly, no horizontal scroll.

**Look at each screenshot. Classify any issues by severity**:

| Tier | Examples | Loop behavior |
|---|---|---|
| **Blocking** | Element overlap obscuring text; text cut off mid-character; SVG widget completely invisible (white-on-white in light mode, dark-on-dark in dark mode); page renders blank or with browser console errors; layout collapse where one column eats another | Fix the underlying CSS/HTML; rebuild; re-screenshot; re-classify. Up to **5 iterations**. If still blocking after 5 → stop and report BLOCKED status (do NOT open PR). |
| **Important** | Awkward but readable spacing; SVG renders but legend overflows; sticky header overlaps card title on scroll; CJK wrap breaking a code identifier ugly | Fix in current iteration. Up to **3 iterations**. If still present after 3 → note in PR body under `## Visual Concerns` and continue to PR. |
| **Minor** | Drop cap baseline 2-3px off; tag chip vertical alignment imperfect; line-height slightly tight | Record only. Note in PR body, do NOT iterate. |

**When retrofitting / fixing existing posts (not just authoring new ones)**:
the Step 8.5 audit MUST be re-run on every post that was modified. This
applies to bulk widget retrofits, prose trims, density refactors, mobile
fixes — any change that touches a post's HTML. Mechanical checks alone
(Step 8) are insufficient because they do not look at the rendered page.

PRs #23/#24/#25 each surfaced issues that would have been caught by a
proper Step 8.5 audit but weren't because retrofits skipped Step 8.5:
- Wide viewBox widgets crushed on mobile
- Sticky figure hidden behind site header
- Range thumbs untappable

Rule: if you modify N posts, you run Step 8.5 on N posts. No exceptions.

**Iteration budget rationale**: 5 blocking-tier iterations covers real-world
fix cycles (a wrong CSS selector → rebuild → re-screenshot → still wrong →
another CSS attempt → success usually fits in 2-3 rounds; 5 is the hard
ceiling so the routine doesn't infinite-loop on an unfixable case). 3
important-tier iterations keeps quality bar without spending all run-time
on polish. Minor issues never iterate — they belong in human review.

**Inter-iteration discipline**: each fix must be a deliberate, named change
("changed `.vg-card-roundup` grid columns from 3rem 1fr to 4rem 1fr to fix
overlap of #NN numeral with title at narrow viewports"). Do NOT change
multiple unrelated things in one iteration — if fix doesn't work, you won't
know which change was wrong.

**Tear down**:

```bash
kill $(lsof -ti:8080) 2>/dev/null
```

**Record findings**: keep a list of any Important + Minor issues to write
into the PR body. Blocking issues should be all-fixed before reaching
Step 9 (or the run should have BLOCKED out).

### Step 9: Open PR

```bash
git checkout -b daily/YYYY-MM-DD
git add src/posts/YYYY/MM/DD/
git commit -m "daily: YYYY-MM-DD news (1 roundup + N deep stories)"
git push -u origin daily/YYYY-MM-DD
gh pr create --base main --title "daily: YYYY-MM-DD news (1 roundup + N deep stories)" --body "<see body template below>"
```

**PR body template** — include all sections:

```markdown
## 今日 10 則 (roundup)

01. {{title}} — {{source_url}}
02. ...
...

## 深入文章 (deep-stories)

### {{deep_title_1}}

Lede: {{deep_lede_1}}

### {{deep_title_2}}

Lede: {{deep_lede_2}}

## 跳過 (dup with last 7 days)

- {{skipped_url}} — title similarity 0.91 vs "{{past_title}}"
- (none) if no skips

## Domain distribution

AI · 3 · SYSTEMS · 3 · INFRA · 2 · WEB · 1 · BACKEND · 1

## Domains skipped today

- (none) — or list each: e.g., "WEB: no qualifying candidates"

## Domains capped (≤6 rule)

- (none) — or list e.g., "AI: 8 qualifying, top 6 selected"

## 來源使用

- HackerNoon: 18 candidates → 4 selected
- Hacker News: 12 candidates → 2 selected
- Cloudflare blog: 5 candidates → 1 selected
- ...
- Failed: (none) or list of failed-fetch sources

## Visual Concerns (from Step 8.5 self-review)

- (none) — or list each issue found at Important/Minor tier with affected
  page URL + brief description. Example:
- `/2026/05/16/deep-quic-cubic/` (dark mode): timeline SVG legend label
  "T2 incident" overlaps with arrowhead at 480px viewport. Important; 3
  fix attempts in Step 8.5 (tried wider viewBox, label nudge, font shrink)
  did not fully resolve.
- `/2026/05/16/roundup/`: drop cap baseline 2px below following line. Minor.

## Content Quality Review

For each post (roundup + deep-stories):
- `<output_path>` — final status: PASS / PASS-with-notes / IMPORTANT-accepted / BLOCKED-dropped
  - Axis 1 (Hook): <score> — "<short justification>"
  - Axis 2 (Structural, <archetype>): <score> — "<short justification>"
  - Axis 3 (Material): <score>
  - Axis 4 (Depth): <score>
  - Axis 5 (Relevance, <dimension>): <score>
  - Axis 6 (Anti-template): <score>
  - (Axis 7 inter-post diversity: see § Inter-post diversity concerns below)
  - Retry rounds: <N>

## Step 7.5 Blocking drops

- (none) — or list: `<output_path>` (archetype), blocking axes, final scores, attempted retries

## Content Quality Concerns

- (none) — or list each post with axes still 4-6 after retry budget exhausted

## Reviewer disagreements

- (none) — or list: `<output_path>` Axis <name>: reviewer-A=<A>, reviewer-B=<B>. Human reviewer should look closely.

## Inter-post diversity concerns

- (none) — or batch_score=<N>, attempted retries=<M>, final state notes.

## Deep-story archetypes used today

- {{deep_title_1}} — `narrative`
- {{deep_title_2}} — `technical-deep-dive`
- {{deep_title_3}} — `freeform` (hybrid topic, no structured archetype fit cleanly)

## Advisory overrides

Records every place where Claude overrode a `scripts/decisions/*.mjs`
module's output. Empty section = pure advisory consensus.

- (none) — or list each:
  - `score(2026-05-19-04)`: module said 9, kept 7. Reason: paraphrase, not
    original.
  - `cover-domains`: module dropped `2026-05-19-09` (backend, score 7); kept
    in selection. Reason: novel architectural pattern worth higher signal.
  - `archetype(deep-foo)`: 選了 `freeform` 而非 `narrative`,
    因為該題目沒有清晰時間線,強套 setup→mechanism→consequence 會讓 prose
    變成「凡是事件都套同一個 H2 序列」的模板感。

## Preview

Cloudflare Pages will post a preview URL once build completes. Please review
visual rendering (light + dark mode) before merging.
```

Do not merge. Wait for human review.

## Failure modes — explicit handling

| Scenario | Handling |
|---|---|
| Some sources fetch-fail | Skip them; log in PR body; require ≥5 successes overall |
| Fewer than 10 candidates pass scoring | Write actual N ("今日 7 則"); don't pad |
| Fewer than 3 deep-story candidates pass | Write 2 or 1; don't force |
| All sources fail | Fail-fast: no PR, no commit; report status |
| Dup filter excludes everything in a domain | Note in PR body; pick from other domains |
| html-validate fails | Self-fix one round; if still failing, open PR but flag `⚠ HTML validation failed` in title |
| Step 8.5 visual: blocking issue still present after 5 iterations | Stop. Do NOT open PR. Report BLOCKED status with the offending screenshot path so a human can inspect. |
| Step 8.5 visual: important issue still present after 3 iterations | Continue to Step 9. Write the issue into `## Visual Concerns` so reviewer knows. |
| Step 8.5 visual: dev server fails to start | BLOCKED — likely a build break; cannot self-review without a live server. |
| Step 7.5 content: all reviewer instances crash on one post | BLOCKED for that post. Drop that post if it's a deep-story; abort routine if it's the roundup. |
| Step 7.5 content: post fails 5 BLOCKING retries | Drop the post (N → N-1). Log to PR body. Routine continues. |
| Step 7.5 content: roundup fails 5 BLOCKING retries | Abort routine. Do NOT open PR. Report BLOCKED status. |
| Step 7.5 content: inter-post diversity fails 2 retries | Accept and log to PR body. Routine continues. |

## Output expectations summary

A successful run produces:

- 1 × `roundup.html` + `roundup.11tydata.json` in `src/posts/YYYY/MM/DD/`
- 0-3 × `deep-<slug>.html` + matching `.11tydata.json` (count may be
  reduced from intended N by Step 7.5 Blocking drops)
- One git branch `daily/YYYY-MM-DD` pushed to origin
- One PR open against `main` with the body template above filled in,
  including the five Step 7.5 content-quality sections

## Why this is split across multiple references

`SKILL.md` stays lean (workflow only) so it loads fast when the skill
triggers. Detailed rules (persona, sources, archetype HTML structures, dedup
math, design tokens, widget contract) live in `references/` files that load
on-demand when authoring decisions actually need them. This is the
"progressive disclosure" pattern: ~150 words always visible, ~1500 words
visible when skill activates, ~5000 words loadable as needed.

If a reference contradicts this SKILL.md, the reference wins for content
decisions (it is the detailed spec); SKILL.md wins for workflow ordering.
