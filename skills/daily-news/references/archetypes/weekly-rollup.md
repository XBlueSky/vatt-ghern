# Archetype: weekly-rollup

A synthesised look-back across one week's roundups and deep-stories.
Not a new reporting pass — purely a re-reading of what's already in
`src/posts/YYYY/MM/DD/` for the previous 7 days.

## When this archetype runs

Monday morning, via `/vatt-ghern:weekly` slash command (or the Claude
routine). The skill executes a variant of the daily workflow:

- **Skip** Step 2 (fetch sources): no external candidates needed.
- **Skip** Step 3 (score/filter), Step 4 (pick), Step 5 (deep-story
  selection): the past 7 days already decided what mattered.
- **Skip** Step 6 (roundup): a rollup is itself one essay, not a
  10-item list.
- Author exactly **one** weekly-rollup HTML following this archetype.

## Input

The skill calls:

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/daily-news/scripts/load-past-roundups.mjs --days=7
```

The returned JSON has:

- `range`: `{start, end}` (the 7-day window)
- `roundups[]`: one per day, with `title`, `summary`, `tags`, `news_ids`
- `deep_stories[]`: each with `title`, `summary`, `deep_archetype`

## Required structure (universal contract)

The rollup is a deep-story-style essay, so the universal contract from
`deep-freeform.md` applies:

- `<h1 class="vg-post-title">` with the week's title (see below)
- `<p class="vg-deep-opener">` with a 1-2 sentence opener that frames
  the week — what was the dominant theme? Stand-alone pull-quote shape.
- `<p class="vg-deep-closer">` near the end, containing a `<strong>`
  with a closing label
- ≥1 inline `<svg>` widget — a small tag/topic distribution chart or
  a domain heat-map across the week is ideal

## Title shape

`第 W 週 ——〈主題短句〉` where W is the ISO week number. Example:
`第 20 週 —— LLM 排程的疲態`. Title is ≤ 28 chars including spaces.

## H2 sequence

The H2 count is flexible (4-6 sections), but the *arc* is fixed:

1. **這週的主軸** (1 H2) — one paragraph naming the theme + listing
   the 2-3 daily stories that supported it.
2. **沒被合稱的個別亮點** (1 H2) — 3-5 items, one short paragraph each,
   surfacing posts that didn't fit the main theme but earn mention.
   Link each to its original deep-story or roundup item.
3. **本週劢頭** (1 H2, optional — skipped if last week was empty) — the
   week-over-week comparison H2. See "Delta computation" below.
4. **一週的形狀** (1 H2) — the visualization H2. Contains the inline
   SVG (tag distribution, deep-archetype mix, or domain breakdown).
   The SVG MUST be ID-scoped per `widget-isolation.md`.
5. **下一週可能會展開的線索** (1 H2, optional) — 1-2 paragraphs of
   "what to watch for next week" — RFCs in flight, conferences,
   versions about to drop. Only include if there's something material.

Closer (free phrasing — any label that signals "this is the wrap").

## Delta computation (for 本週劢頭)

Before writing the H2, call the weekly-delta module:

```bash
node skills/daily-news/scripts/decisions/weekly-delta.mjs --end=YYYY-MM-DD > delta.json
```

`end` is the Monday of the rollup week. The module reads 14 days of
sidecars via `load-past-roundups.mjs --days=14` internally, splits into
this-week (days 1-7) and last-week (days 8-14), and emits:

- `range_this`, `range_last` — inclusive date ranges
- `domain_shift[]` — 5 priority domains in fixed order
  (`ai → systems → infra → web → backend`), each with
  `{this_week_count, last_week_count, this_week_pct, last_week_pct,
  delta_pp}`. Legacy `storage`/`industry` topics roll into a `legacy`
  pseudo-domain appended after the 5; prose ignores it unless it's
  > 20% of either week.
- `tag_movement.new_this_week[]` — tags new this week with ≥2 mentions
- `tag_movement.surge[]` — tags up ≥2 vs last week and ≥3 this week
- `tag_movement.faded[]` — tags down ≥2 vs last week and ≥3 last week
- `totals`, optional `note` (`"this_week_empty"` or `"last_week_empty"`)

If `note` is non-null, **skip the 本週劢頭 H2 entirely** for that week.

## 本週劢頭 H2 shape

When the delta JSON is non-empty:

- Heading: `<h2>本週劢頭</h2>`. CJK heading, no English chrome label.
- 1-2 short paragraphs of prose:
  - First sentence: anchor on the most significant domain shift
    (`|delta_pp| ≥ 10`). Cite at least one specific number:
    "ai 從 71% 退到 0%、systems 從 0% 漲到 45%——這週的重心整個搬到
    systems 和 web 上。"
  - Second sentence: pick the most meaningful tag movement (1 new
    arrival OR 1 surge OR 1 faded). Concrete tag name + counts:
    "Vite 連續三日上榜、上週的 vLLM 風潮這週靜了下來。"
- 1 inline `<svg>` widget — the **delta widget**. Pick one visual
  idiom; both work:
  - Two stacked horizontal bars (上週 vs 本週), each showing 5-domain
    breakdown with CJK label below.
  - Arrow chart: 5 dots representing this-week percentages with
    arrows showing direction + magnitude from last-week percentages.

The SVG must be ID-scoped per `widget-isolation.md` (every `id`, every
`url()` reference, every `<defs>` child must carry a unique suffix).

Prose MUST cite at least 1 specific number from the module's output.
No vague "more AI" or "less systems".

## Advisory overrides

The delta module is advisory. If the prose's interpretation diverges
from the raw numbers (e.g., module says ai-share dropped 25pp but
Claude judges the drop irrelevant because last week was a one-off ai
spike), Claude writes the narrative its way and records the override
in the weekly PR body under `## Advisory overrides`. Matches the
routine-wide pattern from PR #17.

## Voice

Persona invariants from `persona.md` still apply. Voice shifts
slightly: **more synthesis, less reporting**. A weekly rollup makes
claims about the *shape* of the week. Concrete examples from the
underlying posts are non-negotiable, but the connective tissue is
opinion. The bard's hand is more visible here than in daily-roundups.

## Sidecar

Path: `src/posts/YYYY/MM/DD/weekly.html` + `.11tydata.json`
(YYYY-MM-DD is the Monday the rollup is published).

Required fields:

- `title` — see Title shape above
- `date` — YYYY-MM-DD (Monday)
- `archetype` — `"weekly-rollup"`
- `summary` — 1 sentence framing the week
- `tags` — union of underlying posts' tags, deduplicated, ≤ 12 items
- `topics` — same
- `range` — `{start, end}` from `load-past-roundups.mjs`
- `referenced_posts[]` — list of `/YYYY/MM/DD/<slug>/` URLs for every
  daily post the rollup cites. Required for backlinking.

`sources[]` and `news_ids` are NOT used — this archetype draws from
internal posts, not external candidates.

## Anti-dedup

Weekly rollups are NOT subject to the 7-day URL/title dedup gate
(`check-dup.mjs`). The script auto-detects `archetype: weekly-rollup`
and skips the dedup check; if it doesn't yet, set
`"override_dup_check": true` in the sidecar with a one-line comment.

## Frequency

One per week. If a week was sparse (≤2 roundups across 7 days), skip
the rollup that week — say so in the PR body's "weekly skipped"
section.
