# Sources — Rationale

The authoritative source list lives in `src/_data/sources.yml`. To list
it: `npm run sources:list` (or `--json` for machine output).

This document explains *why* the tiers exist and how to think about
adding a new source.

## Why tier?

The skill needs **≥5 successful fetches** to continue. Tiering lets the
dispatcher fail noisily on Tier 1 outages while shrugging off
lower-tier hiccups. Roughly:

- **Tier 1** — Primary signal. Broadest aggregators, highest reliability.
  HN, Lobsters (HTML + JSON), HackerNoon. Outage here is a real problem.
- **Tier 2** — Secondary aggregators (daily.dev, gslin.org). Bias check.
- **Tier 3** — Big-tech engineering blogs. Slow but high-quality. The
  Anthropic + OpenAI sitemap-diff sources also sit here — they surface
  official quiet updates we'd otherwise miss.
- **Tier 4** — Systems / language community + ArXiv (cs.AI, cs.CL,
  cs.LG, cs.PL, cs.DC) + Hugging Face trending. Depth, not breadth.
- **Tier 5** — Adjacent (Quanta etc.). Occasional cross-pollination.

## Source types

The `type` field on each record dispatches to a fetcher:

- `html_index` — front page / archive page. Handed to Claude's `WebFetch`
  tool for LLM summarisation. Most sources are this.
- `arxiv` — arXiv Atom export. Parsed locally; no LLM needed.
- `hf` — Hugging Face Hub JSON API for models/datasets.
- `sitemap` — `sitemap.xml`. Diffed against `src/_data/web-state.json`
  per-URL `lastmod`. Only changed URLs become candidates.
- `lobsters_json` — Lobsters `hottest.json`. Cleaner than scraping the
  HTML.

## Adding a source

1. Append a record to `src/_data/sources.yml` with a unique `id`.
2. Pick the tier honestly (would you want this to be the reason the
   skill fails-fast today? No → not tier 1).
3. Pick a type. If none fits, you need a new fetcher in
   `skills/daily-news/scripts/fetchers/` — write it with a test first.
4. Run `npm run sources:list` to confirm it loads.
5. Run `npm run sources:dry-run -- --id=<your-id>` to confirm it fetches.

## Fetch rules (unchanged)

- **Per source**: collect top 5–10 items from the last ~24h. If a site
  doesn't expose freshness, take the top-of-page items.
- **Total candidate pool**: aim for ~50–100 items before scoring.
- **De-duplicate URLs** across sources before scoring — the same
  Cloudflare blog post appearing on HN should be one candidate.
- **Failures are not fatal**: skip a failing source, log it in the PR
  body, continue. Only fail-fast if fewer than 5 sources succeed.

## What the skill records per item

For each candidate selected into today's 10:

- `source_url` — the canonical link (publisher's site, not the aggregator)
- `aggregator_url` — if found via HN/lobsters/daily.dev, also record this
- `original_title` — the publisher's headline as-is
- `domain` — one of: ai, systems, infra, storage, industry
- `score` — 0–10 from the scoring rubric in `archetypes.md`
- `news_id` — assigned as `YYYY-MM-DD-NN` in final ranking order
