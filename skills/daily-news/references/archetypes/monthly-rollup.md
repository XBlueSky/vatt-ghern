# Archetype: monthly-rollup

A synthesised look-back across one month's daily-news output. Longer
breath, broader claims, but the same architecture as the weekly
rollup.

## When this archetype runs

First day of each month, via `/vatt-ghern:monthly` slash command (or
the Claude routine). The skill executes a variant of the daily
workflow with the same skips as the weekly rollup — see
`weekly-rollup.md` § "When this archetype runs".

## Input

```bash
node ${CLAUDE_PLUGIN_ROOT}/skills/daily-news/scripts/load-past-roundups.mjs --days=30
```

Same JSON shape as weekly. For months with 28/29/31 days, pass
`--days=<actual>` so the range matches calendar boundaries.

## Required structure

Same universal contract as `weekly-rollup.md`:

- `<h1 class="vg-post-title">`
- `<p class="vg-deep-opener">` — opener that names the month's arc
- `<p class="vg-deep-closer">` with `<strong>` closer
- ≥2 inline SVG widgets — more visualisation than weekly because the
  scale is larger

## Title shape

`〈YYYY 年 M 月〉—— 主題短句` example: `2026 年 5 月 —— 上下文工程崛起`.

## H2 sequence

5-8 sections; the arc:

1. **這個月的主軸** — 2-3 paragraphs. Name the main theme(s); the month
   may have multiple, but pick a single sentence as the frame.
2. **數字** — bullet list: total roundup items, total deep-stories,
   deep-archetype distribution, top 5 tags, top 5 sources. SVG #1 here
   (tag cloud or domain breakdown).
3. **三條故事線** — 3 H3 subsections, each 1-2 paragraphs, each
   following the spine of a recurring story across multiple days.
4. **獨立深刻文章** — 2-4 items, one paragraph each, surfacing
   deep-stories that stood alone but earned mention.
5. **領域形狀** — the visualisation H2. SVG #2 — heatmap of domain
   coverage across the 4-5 weeks, or a time-series of deep-story count.
6. **下個月可能會展開的線索** (optional, only if substantial).

Closer is free-phrasing.

## Voice

**Synthesis over reporting.** A monthly rollup makes opinion claims
about the *direction* of the month: where the conversation moved,
what stayed quiet, what changed. Persona invariants still apply.
Hedge with care — month-scale claims need more material backing than
daily ones.

## Sidecar

Path: `src/posts/YYYY/MM/01/monthly.html` + `.11tydata.json`.

Required:

- `title`, `date` (the 1st), `archetype: "monthly-rollup"`
- `summary` — 1 sentence
- `tags` — union of underlying posts' tags, top 12 by frequency
- `topics` — same
- `range` — `{start, end}` from load-past-roundups
- `referenced_posts[]` — every cited post URL
- `override_dup_check: true` (anti-dedup, same reason as weekly)

## Frequency

One per calendar month. If a month had ≤8 roundups (e.g. blog just
launched), skip the rollup that month and say so in the PR body.
