---
name: daily-news
description: Author today's vatt-ghern daily news (1 roundup + up to 3 deep-stories) and open a PR.
---

Execute the daily-news skill for the vatt-ghern blog.

Use the `daily-news` skill in this plugin to:

1. Load context from the past 7 days of posts
2. Fetch from the priority source list (HackerNoon first)
3. Score, dedupe, and select today's top 10
4. Pick up to 3 deep-story candidates
5. Author 1 roundup HTML + N deep-story HTML files under `src/posts/YYYY/MM/DD/`
6. Run validation (check-dup, publish, html-validate)
7. Open a PR titled `daily: YYYY-MM-DD news (...)` against `main`

Do not merge — the PR waits for human review and Cloudflare Pages preview.

Full workflow, source list, archetype rules, and persona guidance live in
the `daily-news` skill under `${CLAUDE_PLUGIN_ROOT}/skills/daily-news/`.
