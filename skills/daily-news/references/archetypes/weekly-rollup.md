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

The H2 count is flexible (3-6 sections), but the *arc* is fixed:

1. **這週的主軸** (1 H2) — one paragraph naming the theme + listing
   the 2-3 daily stories that supported it.
2. **沒被合稱的個別亮點** (1 H2) — 3-5 items, one short paragraph each,
   surfacing posts that didn't fit the main theme but earn mention.
   Link each to its original deep-story or roundup item.
3. **一週的形狀** (1 H2) — the visualization H2. Contains the inline
   SVG (tag distribution, deep-archetype mix, or domain breakdown).
   The SVG MUST be ID-scoped per `widget-isolation.md`.
4. **下一週可能會展開的線索** (1 H2, optional) — 1-2 paragraphs of
   "what to watch for next week" — RFCs in flight, conferences,
   versions about to drop. Only include if there's something material.

Closer (free phrasing — any label that signals "this is the wrap").

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
