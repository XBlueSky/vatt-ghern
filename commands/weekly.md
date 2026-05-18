---
name: weekly
description: Author a weekly rollup synthesising the past 7 days of vatt-ghern posts. Opens a PR.
---

Execute the daily-news skill in **weekly rollup mode** for the vatt-ghern blog.

Use the `daily-news` skill in this plugin to:

1. Skip Step 2 (fetch sources), Step 3 (score/filter), Step 4 (pick),
   Step 5 (deep-story selection), Step 6 (roundup).
2. Run `node ${CLAUDE_PLUGIN_ROOT}/skills/daily-news/scripts/load-past-roundups.mjs --days=7`
   to gather past 7 days' sidecars.
3. Read the archetype reference at
   `skills/daily-news/references/archetypes/weekly-rollup.md`.
4. Author exactly ONE `src/posts/YYYY/MM/DD/weekly.html` (where
   YYYY-MM-DD is today, a Monday) + matching `.11tydata.json`.
5. Run validation (`archetype-check`, `html-validate`, `link-check`).
   Anti-dedup gate is bypassed by the `override_dup_check: true` flag
   in the sidecar.
6. Open a PR titled `weekly: <week range> rollup` against `main`.

Do not merge — the PR waits for human review and Cloudflare Pages preview.

If the past 7 days had fewer than 3 roundups, skip the rollup and
report that to the user. No PR.
