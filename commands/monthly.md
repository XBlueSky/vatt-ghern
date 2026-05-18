---
name: monthly
description: Author a monthly rollup synthesising the past month of vatt-ghern posts. Opens a PR.
---

Execute the daily-news skill in **monthly rollup mode** for the vatt-ghern blog.

Use the `daily-news` skill in this plugin to:

1. Skip Step 2 (fetch sources) through Step 6 (roundup).
2. Determine the calendar-month length (28-31 days) of the month
   that just ended.
3. Run `node ${CLAUDE_PLUGIN_ROOT}/skills/daily-news/scripts/load-past-roundups.mjs --days=<N> --end=<last day of last month>`
   to gather the past month's sidecars.
4. Read the archetype reference at
   `skills/daily-news/references/archetypes/monthly-rollup.md`.
5. Author exactly ONE `src/posts/YYYY/MM/01/monthly.html` (where
   YYYY-MM-01 is the first day of the new month) + matching
   `.11tydata.json` with `override_dup_check: true`.
6. Run validation (`archetype-check`, `html-validate`, `link-check`).
7. Open a PR titled `monthly: <YYYY-MM> rollup` against `main`.

Do not merge — the PR waits for human review and Cloudflare Pages preview.

If the prior month had fewer than 8 roundups, skip the rollup and
report that. No PR.
