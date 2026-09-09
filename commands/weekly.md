---
name: weekly
description: Author a weekly rollup synthesising the ISO week (Mon–Sun) that just ended. Opens a PR.
---

Execute the daily-news skill in **weekly rollup mode** for the vatt-ghern blog.

Use the `daily-news` skill in this plugin to:

1. Skip Step 2 (fetch sources), Step 3 (score/filter), Step 4 (pick),
   Step 5 (deep-story selection), Step 6 (roundup).
2. Run `node ${CLAUDE_PLUGIN_ROOT}/skills/daily-news/scripts/weekly-window.mjs`
   to resolve the covered week. It returns `week_key`, `week_number`,
   `start` (Monday) and `end` (Sunday) for the ISO week that just ended.
   Every date below comes from this output — never from today's date.
3. Run `node ${CLAUDE_PLUGIN_ROOT}/skills/daily-news/scripts/load-past-roundups.mjs --days=7 --end=<end>`
   to gather that week's sidecars.
4. Read the archetype reference at
   `skills/daily-news/references/archetypes/weekly-rollup.md`.
5. Author exactly ONE `src/posts/YYYY/MM/DD/weekly.html` (where
   YYYY-MM-DD is today, the publication day) + matching `.11tydata.json`.
   The sidecar's `range` is `{start, end}` from step 2, and the title uses
   `week_number` — the week being summarised, not the week it is published in.
6. Run validation (`archetype-check`, `html-validate`, `link-check`).
   Anti-dedup gate is bypassed by the `override_dup_check: true` flag
   in the sidecar.
7. Open a PR titled `weekly: <week range> rollup` against `main`.

Do not merge — the PR waits for human review and Cloudflare Pages preview.

If the covered week had fewer than 2 roundups, skip the rollup and
report that to the user. No PR.
