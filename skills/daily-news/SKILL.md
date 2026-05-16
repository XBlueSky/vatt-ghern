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

Two invocation paths converge here:

- **Slash command**: `/vatt-ghern:daily-news` (defined in
  `${CLAUDE_PLUGIN_ROOT}/commands/daily-news.md`)
- **Routine fallback**: Claude Routines invoking the repo may load this
  SKILL.md directly when the slash command is unavailable. Both paths execute
  the same 9-step workflow below.

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

Walk `references/sources.md` in tier order (Tier 1 first). For each source,
fetch the home/index page and collect top 5–10 items from the last ~24
hours. Use WebFetch with prompts like:

> "List the top 8 items from this page that look like original engineering
> blog posts (not job listings, marketing pages, or product launches without
> technical content). For each, give me title, canonical link, and a 1-2
> sentence summary of the substance."

De-duplicate by canonical URL across sources. Aim for ~50–100 candidates
total. If fewer than 5 sources succeed, fail-fast: report which sources
failed and abort without writing files.

### Step 3: Score and filter

For each candidate, assign a domain (ai / systems / infra / storage /
industry) and a 0–10 score per the rubric in `references/archetypes.md`.

Drop candidates that:

- Have a canonical URL already in `past_urls`
- Have a title whose Jaccard char-bigram similarity > 0.85 against any
  `past_roundup_titles` (compute this manually — the formal check runs in
  step 8 via `check-dup.mjs`)
- Violate the "what does NOT earn a place" rules in `persona.md`

### Step 4: Pick today's items (domain coverage)

Aim: all 5 priority domains represented (ai / systems / infra / storage /
industry). Hard floor: ≥4 distinct domains. Per-domain cap: ≤6 items.

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

**PR body must list**:
- Domain distribution (e.g., "AI · 3 · SYSTEMS · 3 · INFRA · 2 ·
  STORAGE · 1 · INDUSTRY · 1")
- Any domain skipped (with reason: no qualifying candidates / all
  candidates failed dedup / etc.)
- Any domain that hit the cap and had candidates dropped (e.g.,
  "8 qualifying items in AI today, top 6 selected")

### Step 5: Pick deep-story candidates

From today's 10, select up to 3 deep-story candidates satisfying ALL:

- Score ≥ 8
- Source has drillable depth (long-form, paper, RFC, design doc — not press
  release)
- Different domains where possible

Cross-check against `past_deep_titles` (Jaccard > 0.70 = drop). If fewer
than 3 qualify, write fewer. Never recycle a past deep-story topic to hit 3.

### Step 6: Write roundup HTML + sidecar

Read the archetype skeleton at
`${CLAUDE_PLUGIN_ROOT}/src/archetypes/daily-roundup.html` for structure.
Author the full HTML following `references/archetypes.md` § "Archetype 1".
Write to `src/posts/YYYY/MM/DD/roundup.html` plus matching `.11tydata.json`
sidecar (schema in `references/archetypes.md`).

Required structural attributes (the test suite checks them):

- Each item card has `id="item-NN"` (zero-padded)
- Each item card has `data-vg-readkey-item="{{page.url}}#item-NN"`
- Progress span has `data-vg-progress-of` and `data-vg-progress-total`

### Step 7: Write each deep-story HTML + sidecar (×N where N ≤ 3)

For each deep-story candidate, do additional WebFetch on the canonical
source to gather technical detail (RFC excerpts, code samples, real
numbers). Read the skeleton at
`${CLAUDE_PLUGIN_ROOT}/src/archetypes/daily-deep-story.html`. Author
following `references/archetypes.md` § "Archetype 2".

Each deep-story file:

- Path: `src/posts/YYYY/MM/DD/deep-<kebab-slug>.html`
- Sidecar: `news_ids` references exactly one item from today's roundup;
  `related_roundup` is set to `/YYYY/MM/DD/roundup/`
- Body contains opener → drop-cap intro → three H2 acts → take-away closer
- ≥2 inline SVG widgets (timeline, architecture, comparison, data viz)

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
5. Mobile viewport check: resize to 375px, navigate to roundup once,
   screenshot. Verify no layout collapse, no horizontal scroll, SVG widgets
   scale.

**Look at each screenshot. Classify any issues by severity**:

| Tier | Examples | Loop behavior |
|---|---|---|
| **Blocking** | Element overlap obscuring text; text cut off mid-character; SVG widget completely invisible (white-on-white in light mode, dark-on-dark in dark mode); page renders blank or with browser console errors; layout collapse where one column eats another | Fix the underlying CSS/HTML; rebuild; re-screenshot; re-classify. Up to **5 iterations**. If still blocking after 5 → stop and report BLOCKED status (do NOT open PR). |
| **Important** | Awkward but readable spacing; SVG renders but legend overflows; sticky header overlaps card title on scroll; CJK wrap breaking a code identifier ugly | Fix in current iteration. Up to **3 iterations**. If still present after 3 → note in PR body under `## Visual Concerns` and continue to PR. |
| **Minor** | Drop cap baseline 2-3px off; tag chip vertical alignment imperfect; line-height slightly tight | Record only. Note in PR body, do NOT iterate. |

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

## Output expectations summary

A successful run produces:

- 1 × `roundup.html` + `roundup.11tydata.json` in `src/posts/YYYY/MM/DD/`
- 1-3 × `deep-<slug>.html` + matching `.11tydata.json`
- One git branch `daily/YYYY-MM-DD` pushed to origin
- One PR open against `main` with the body template above filled in

## Why this is split across multiple references

`SKILL.md` stays lean (workflow only) so it loads fast when the skill
triggers. Detailed rules (persona, sources, archetype HTML structures, dedup
math, design tokens, widget contract) live in `references/` files that load
on-demand when authoring decisions actually need them. This is the
"progressive disclosure" pattern: ~150 words always visible, ~1500 words
visible when skill activates, ~5000 words loadable as needed.

If a reference contradicts this SKILL.md, the reference wins for content
decisions (it is the detailed spec); SKILL.md wins for workflow ordering.
