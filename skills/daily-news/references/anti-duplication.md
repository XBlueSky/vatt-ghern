# Anti-Duplication Rules

Prevent today's roundup from re-running stories that already appeared in
prior coverage.

## Two lookback windows

Dedup runs on two different windows, by design:

- **Exact identifiers — full archive.** A canonical source URL or `news_id`
  that appeared on *any* prior day is a duplicate, no matter how old. A story
  covered once is covered forever; a genuine follow-up gets a *different* URL
  (see edge cases), and intentional re-coverage uses `override_dup_check`.
- **Fuzzy title similarity — past 7 days only.** Char-bigram title matching
  is windowed because topics legitimately recur; a long fuzzy window would
  over-suppress genuinely evolving coverage.

This split exists because of a real escape: the 2026-05-24 run re-published
the 2026-05-16 QUIC death-spiral and ClickHouse query-planner deep-stories —
identical source URLs, 8 days apart. The Cloudflare blog is an `html_index`
source with no per-URL fetch memory, so it re-surfaces prominent posts as
candidates every day. The old uniform 7-day window sat one day short of 5/16,
so neither the baseline nor the gate caught it. Exact-URL matching now spans
the full archive.

## What counts as a duplicate

Two duplicate axes:

### Axis 1: News item duplicate (within roundup)

A candidate item is a duplicate of a past item if **any** of:

- Same canonical URL across the **full archive** (after stripping `?utm_*`,
  `#fragment`, trailing `/`)
- Same `news_id` across the full archive (impossible by construction since
  news_ids embed the date, but check defensively)
- Title cosine similarity > 0.85 against the **past 7 days'** roundup item
  titles (case-insensitive, after stripping common stopwords)

Drop duplicates *before* the final top-10 selection.

### Axis 2: Deep-story topic overlap

A candidate deep-story topic is too similar to a past deep-story if:

- Same source URL anywhere in the **full archive**
- Same primary `news_id` across the full archive (impossible — different days
  have different ids)
- Title cosine similarity > 0.70 against the **past 7 days'** deep-story titles

When deep-story candidates fail this check, pick the next candidate from
today's 10. If all candidates fail, fall back to writing fewer deep-stories
(2 or 1) — do NOT recycle a topic just to hit "3".

## Window definitions

- **Full archive** = every `src/posts/YYYY/MM/DD/` directory strictly before
  today (today never matches itself).
- **Past 7 days** = the 7 most recent calendar days *before* today (UTC+8).
  For 2026-05-24, the fuzzy window is 2026-05-17 through 2026-05-23 inclusive.

If past data is missing (e.g., this is day 1, day 2 of operation), check
whatever exists and proceed.

## Implementation

Both scripts share `scripts/dedup-context.mjs`, which collects
`past_news_ids` + `past_urls` from the full archive and
`past_roundup_titles` + `past_deep_titles` from the recent 7-day window.

### `scripts/load-context.mjs`

The script returns a JSON blob like:

```json
{
  "today": "2026-05-16",
  "past_news_ids": ["2026-05-15-01", "2026-05-15-02", ...],
  "past_urls": ["https://...", ...],
  "past_roundup_titles": ["string", ...],
  "past_deep_titles": ["string", ...]
}
```

`past_news_ids` / `past_urls` span the full archive; the title pools span
the last 7 days. The skill uses this blob to filter candidates before
scoring (Step 3) and at the pre-dispatch URL dedup (Step 5d).

### `scripts/check-dup.mjs`

Run **after** writing today's HTML, to catch escapes:

```bash
node skills/daily-news/scripts/check-dup.mjs src/posts/2026/05/16/
```

Exit 0 = no duplicates found. Exit 1 + stderr listing offenders = abort.

## Edge cases

- **Same incident, new development** (e.g., follow-up CVE patch): NOT a
  duplicate as long as the source URL and title differ. Cover it as a
  separate news item. Optionally cross-link to the prior day's coverage in
  the lede.
- **Source URL changed but same story** (publisher republished): The
  cosine-similarity title check catches this; drop as duplicate.
- **Self-link rot**: If a prior `news_id` no longer resolves, do not block —
  the past blob is read from local repo, so its presence is what matters,
  not its remote URL liveness.

## Reset / override

To force a manual override (e.g., manual re-coverage of a previously skipped
story), add `"override_dup_check": true` to the sidecar JSON. The check
script honors this flag and does not flag the item.
