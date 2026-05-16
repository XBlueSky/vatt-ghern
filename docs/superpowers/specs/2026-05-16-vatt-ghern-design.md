# vatt-ghern — design spec

**Date**: 2026-05-16
**Status**: design freeze (post-brainstorm, pre-implementation-plan)
**Codename**: vatt-ghern (Elder Speech for "witcher")
**Sibling project**: kaer-morhen (the existing internal wiki, *not* a content source)

---

## 1. What this is

A **public personal tech blog** at `/Users/bluesky/arsenal/vatt-ghern`,
hosted on Cloudflare Pages, whose daily content is authored automatically by
**Claude Code Routines** invoking a co-located `daily-news` skill.

Each day produces **four bespoke HTML posts**:

- **1× `daily-roundup`** — a 10-item index of the day's most worth-engineers'-attention tech news, optimized for 3-minute scan
- **3× `daily-deep-story`** — long-form storytelling explainers drilling into 3 of those 10 items, optimized for 深入淺出 learning

Posts are bespoke HTML (custom layouts, inline SVG widgets), not template
fill-ins. The framework (Eleventy + Cloudflare Pages + custom plugins)
exists to organize and deploy, not to dictate how each piece looks.

## 2. Relationship to kaer-morhen

kaer-morhen is Tony's existing internal Synology-only wiki. vatt-ghern
**mirrors its pattern** (Eleventy + co-located Claude Code plugin/skill,
OKLCH dual-theme design system, bespoke HTML posts) but is a **clean
rebuild**:

- ✅ Sibling architecture, sibling design system
- ❌ Zero content reuse — kaer-morhen contains Synology-internal
  research/perf reports that must not appear in vatt-ghern
- ❌ No git fork — fresh repo, separate history

| Axis | kaer-morhen | vatt-ghern |
|---|---|---|
| Audience | Synology-internal | Public |
| Content cadence | Lifetime accumulation | Daily routine-generated |
| `src/posts/` tree | topic-keyed (`bluesky/`, `webapi/`…) | **date-keyed** (`YYYY/MM/DD/`) |
| Homepage emphasis | topic/year accumulation | **daily timeline** |
| CI/CD | GitLab CI → GitLab Pages | GitHub repo → Cloudflare Pages |
| Plugin count | 3 sigils (igni/aard/quen) | 1 sigil (daily-news), more later |
| Wordmark subtitle | `vatt'ghern's archive` | **`jaskier's ballads`** |
| Sigil | wolf medallion (PNG) | wolf medallion (reused — *no change in v1*) |
| Mirror motif | the witcher's fortress + the poet's archive | the witcher himself + the poet's ballads |

## 3. Audience & voice

**Primary reader**: Engineers. Substance over polish. Content must teach
something, or spark a new idea — no filler, no marketing.

**Voice** (carries over from kaer-morhen, applied to news):

- **Measured** — findings stated plainly, hedges honest, "we don't know
  yet" allowed
- **Curious** — investigative posture; deep-stories open with a question
  or a thing that didn't quite make sense, not a headline hook
- **Materially-rooted** — concrete examples, real RFCs, real CVE numbers,
  real benchmark numbers

**Language**: 純繁體中文 prose, English technical terms preserved (RFC,
io_uring, CRDT, sqe, etc.). CJK 雙破折號 `——` allowed (zh-Hant first
override of brand.md). Latin single em-dash `—` banned **in published
site prose** per kaer-morhen rules; internal engineering docs (this spec,
READMEs, code comments) are exempt.

**Anti-references** (same as kaer-morhen):
- Not a Substack/Medium personal-brand blog (no bio block, no subscribe
  CTA, no follower counts)
- Not a tech-startup blog (no hero metric, no marketing-shaped homepage)
- Not a generic SSG demo (no card grid of identical post tiles)
- Not maximalist editorial magazine
- Not terminal-aesthetic developer blog

## 4. Architecture overview

```
┌──────────────────────────────────────────────────────────┐
│ Claude Code Routine (cloud, daily 07:00 UTC+8)           │
│   ├─ Schedule: nightly                                   │
│   ├─ Prompt: "execute /vatt-ghern:daily-news, fallback   │
│   │           to reading skills/daily-news/SKILL.md"     │
│   └─ Connector: GitHub (repo read + contents write +     │
│                  pull request write)                     │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ Skill: /vatt-ghern:daily-news (9-step workflow)          │
│   1. Load context (last 7 days news_ids + titles)        │
│   2. Fetch sources (priority list, WebFetch)             │
│   3. Score & filter (5 priority domains, 0-10 scale)     │
│   4. Pick today's 10 (ensure ≥3 domains covered)         │
│   5. Pick 3 deepest from the 10                          │
│   6. Write roundup HTML                                  │
│   7. Write 3× deep-story HTML                            │
│   8. Self-check (dup audit, html-validate, archetype)    │
│   9. Open PR (branch: daily/YYYY-MM-DD)                  │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ GitHub                                                   │
│   ├─ PR opened → Actions quality.yml runs                │
│   ├─ Cloudflare Pages detects branch → preview build     │
│   ├─ Cloudflare bot comments PR with preview URL         │
│   └─ Tony reviews preview → squash & merge → main        │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ Cloudflare Pages                                         │
│   ├─ Detect main push → production build & deploy        │
│   └─ Live at vatt-ghern.pages.dev                        │
└──────────────────────────────────────────────────────────┘
```

**Key design decisions**:

- **Skill lives in vatt-ghern repo** (`.claude-plugin/` + `skills/`).
  Same dual-role pattern as kaer-morhen: one clone = (a) the site, (b) a
  Claude Code plugin marketplace. Rules and tooling never drift apart.
- **Routine has two paths to invoke logic** (defense in depth):
  - *Main*: `/vatt-ghern:daily-news` slash command (assumes routine
    auto-loads `.claude-plugin/`)
  - *Fallback*: Read `skills/daily-news/SKILL.md` as a document and
    follow its instructions verbatim
  - Both paths converge on the same SKILL.md as **single source of truth**
- **No GitHub Actions deploy step** — Cloudflare Pages does build+deploy
  automatically on push/PR. Actions is *quality-gate only*.
- **Routine opens PR, never auto-merges** — daily review gives Tony a
  human-eye check before content goes live. Cloudflare preview URL makes
  visual review possible (diff alone is insufficient).
- **All costs $0/month** on top of Tony's existing Claude subscription
  (Cloudflare Pages free, Actions free quota, GitHub free, no
  third-party APIs).

## 5. Repository structure

```
vatt-ghern/
├── .claude-plugin/
│   ├── plugin.json              # vatt-ghern plugin manifest
│   └── marketplace.json         # single-entry catalog, source "./"
├── commands/
│   └── daily-news.md            # thin slash-command wrapper
├── skills/
│   └── daily-news/
│       └── SKILL.md             # 9-step workflow (source of truth)
├── references/                  # rule files, read by skill and fallback
│   ├── sources.md               # 35 priority sources (HackerNoon first)
│   ├── archetypes.md            # roundup + deep-story rules
│   ├── persona.md               # senior tech-lead persona
│   ├── anti-duplication.md      # 7-day window news_id dedup rules
│   ├── design-system.md         # design-system summary for skill
│   └── widget-isolation.md      # widget CSS/JS hygiene
├── scripts/
│   ├── load-context.mjs         # dump last-7-days news_ids/titles
│   ├── publish.mjs              # write HTML + sidecar to correct path
│   ├── check-dup.mjs            # diff today's news_ids vs last 7 days
│   └── build-sigil.mjs          # sharp pipeline for sigil variants
├── src/
│   ├── _includes/               # base.njk, post-trail, panels
│   ├── _data/                   # site config, nav, tags index
│   ├── archetypes/
│   │   ├── daily-roundup.html        # roundup template/example
│   │   ├── daily-roundup.11tydata.json
│   │   ├── daily-deep-story.html     # deep-story template/example
│   │   └── daily-deep-story.11tydata.json
│   ├── posts/
│   │   └── YYYY/MM/DD/
│   │       ├── roundup.html              # 1 per day
│   │       ├── roundup.11tydata.json
│   │       ├── deep-<slug>.html          # 0-3 per day
│   │       └── deep-<slug>.11tydata.json
│   ├── static/                  # fonts, sigil webp variants, CSS, JS
│   ├── index.njk                # daily timeline homepage
│   ├── archive.njk              # full historical timeline
│   ├── tags.njk
│   ├── topics.njk
│   ├── tags-index.njk
│   ├── topics-index.njk
│   ├── feed.xml.njk             # RSS
│   └── 404.njk
├── tests/
│   ├── archetype-check.mjs      # widget count, dark-mode tokens, bans
│   ├── link-check.mjs           # internal href integrity
│   └── html-validate runs via npx html-validate (no wrapper needed)
├── .github/
│   └── workflows/
│       └── quality.yml          # PR-time quality gate
├── docs/
│   └── superpowers/specs/
│       └── 2026-05-16-vatt-ghern-design.md   # this file
├── assets/
│   └── vg-sigil.png             # source sigil PNG (currently same as km)
├── DESIGN.md                    # human-readable design system (long form)
├── PRODUCT.md                   # what vatt-ghern is, audience, voice
├── README.md                    # install, run, contribute
├── eleventy.config.js
├── package.json
├── .nvmrc                       # node 20
└── .gitignore
```

## 6. Content model: the two archetypes

### 6.1 `daily-roundup`

**Purpose**: 3-minute scan of today's tech news. Index page, not press
release.

**Structure**:

```
[Hero]
  Date in EB Garamond italic, --fs-2xl, MM.DD prominent
  Lede: 1-2 sentences naming the day's main thread
[SVG stats dashboard]
  - Domain distribution donut
  - Source distribution bar
  - Top tags cloud
[10 news cards]
  Each card:
    #NN  [domain chip]  [source name]
    一句話標題（中文翻譯/改寫）
    2-3 句說明 "what this is, why engineers should care"
    → 原文連結 · 標籤 · [深入閱讀 ↗] (if a deep-story exists)
[Today's deep stories]
  Preview cards for the 3 deep-stories
[Footer chrome]
  ← previous day · next day → (if exists)
  RSS · archive
```

**Visual density**: medium-high. Cards tighter than deep-story.
**Length**: ~300–500 lines including inline SVG widgets.
**Required widgets**: 1 SVG donut, 1 SVG bar, card hover micro-interaction
(CSS-only).

### 6.2 `daily-deep-story`

**Purpose**: Drill into 1 of today's news items, story-form: background,
why it matters, technical details (淺顯易懂), takeaways. Reader learns
something.

**Structure**:

```
[Opener — hook]
  A scene, a question, or a snatch of dialogue. Pull in, then dive into
  technical content.
[Drop-cap opening paragraph]
  EB Garamond drop cap. Formal entry into the article.
[Act 1: What happened]
  Facts + timeline (SVG timeline widget)
  Key quote / blockquote from source
[Act 2: Why it matters]
  Technical context — diagram, ASCII art, SVG architecture diagram
  Before/after comparison, config examples (code block)
  Analogy that lets non-domain engineers follow
[Act 3: So what]
  Implications, industry context, future direction
  Tony's perspective (a "side note" / margin note)
  Further reading (cross-link to today's roundup item + prior related
  vatt-ghern posts)
[Closer]
  A take-away or open question
  Related / Backlinks panel (if applicable)
```

**Visual density**: low, lots of whitespace, long-form reading.
**Length**: ~600–1200 lines including inline SVG widgets.
**Required widgets** (at least 2 of):
- SVG timeline / sequence diagram
- SVG architecture diagram
- CSS-or-JS interactive widget (before/after slider, hover toggle)
- HTML comparison table (designed, not default-styled)
- Code block with syntax highlighting (Prism or Shiki at build time)
- Inline SVG data viz (bar, line, sparkline)

### 6.3 Shared post conventions

**Sidecar JSON** (every HTML has same-name `.11tydata.json`):

```json
{
  "title": "io_uring CVE-2026-XXXX：當 sqe 變成攻擊面",
  "date": "2026-05-16",
  "archetype": "daily-deep-story",
  "topics": ["systems", "security"],
  "tags": ["io_uring", "linux", "kernel-cve"],
  "sources": ["https://hackernoon.com/...", "https://lwn.net/..."],
  "news_ids": ["2026-05-16-04"],
  "related_roundup": "/2026/05/16/roundup/",
  "summary": "一句話描述",
  "estimated_read_min": 8
}
```

**`news_ids`** is the anti-duplication key. Format: `YYYY-MM-DD-NN` where
NN is the position in that day's roundup (01-10). Deep-stories reference
the corresponding roundup item's ID.

**Widget isolation** (same rules as kaer-morhen's `aard`): per-widget CSS
class prefix, JS in IIFE, no global pollution.

**Dark mode**: all inline SVG uses `currentColor` or `light-dark()` token,
never hardcoded hex/rgb.

**No tracking, no analytics, no newsletter signup, no social-share
buttons.**

## 7. Daily-news skill workflow

The 9 steps in `skills/daily-news/SKILL.md`:

1. **Load context** — `node scripts/load-context.mjs` returns today's date
   (UTC+8), last 7 days' news_ids, last 7 days' deep-story titles.
2. **Fetch sources** — iterate `references/sources.md` priority list,
   WebFetch top 5-10 items per source from last 24h. Build candidate pool
   (~50-100 items).
3. **Score & filter** — classify into 5 priority domains per
   `references/persona.md`. Score 0-10 (technical depth + engineer
   learning value + recency). Drop items whose news_id already exists in
   last 7 days. Drop items whose titles too similar to last 7 days'
   deep-stories.
4. **Pick today's 10** — top-10 by score, with constraint "covers at
   least 3 domains" (no single-domain days).
5. **Pick 3 to deepen** — from the 10, choose 3 such that: score ≥8,
   source has drillable material (long original, technical details), and
   the 3 cover different domains where possible. If candidates
   insufficient, drop to 2 (don't force).
6. **Write roundup HTML** — read `src/archetypes/daily-roundup.html`,
   fill in 10 cards + SVG dashboards, write to
   `src/posts/YYYY/MM/DD/roundup.html` + sidecar.
7. **Write each deep-story HTML** (×3) — read
   `src/archetypes/daily-deep-story.html`, do deeper WebFetch on the
   source, write opener→3-act→closer structure, at least 2 SVG widgets,
   sidecar with `news_ids` referencing roundup.
8. **Self-check** — run `node scripts/check-dup.mjs
   src/posts/YYYY/MM/DD/`, `npx html-validate src/posts/YYYY/MM/DD/`,
   `node tests/archetype-check.mjs src/posts/YYYY/MM/DD/`.
9. **Open PR** — `git checkout -b daily/YYYY-MM-DD`, commit, push, `gh
   pr create` with title `daily: YYYY-MM-DD news (1 roundup + N deep
   stories)`, body listing 10 roundup titles, deep-story titles+ledes,
   any news_ids skipped for dup, and sources used.

### 7.1 Failure modes

| Scenario | Handling |
|---|---|
| Some sources fetch-fail | Skip, log in PR description; ≥5 successful sources required to continue |
| <10 candidate items | Write actual count ("today's 7 items"), don't pad |
| <3 deep-story candidates | Write 2 or 1, don't force |
| All sources fail | Fail-fast: no PR, no commit; routine retries next day |
| Dup-filter excludes everything | Rare; lower similarity threshold once, retry |
| html-validate fails | Self-fix once; if still failing, open PR with `⚠ HTML validation failed` in description |

### 7.2 Routine prompt (canonical text)

```
請對 vatt-ghern repo 執行今天的 daily-news 工作。

主要路徑：執行 slash command `/vatt-ghern:daily-news`。

Fallback 路徑：若該 slash command 不可用，請：
1. 讀取 skills/daily-news/SKILL.md
2. 嚴格依照其中指示執行
3. 該 SKILL.md 會引導你讀取 references/ 下的 persona、sources、
   archetypes、anti-duplication 規則

完成後：
- 建立 branch: daily/YYYY-MM-DD（請用今日 UTC+8 日期）
- Commit message: "daily: YYYY-MM-DD news (1 roundup + 3 deep stories)"
- 開 PR 到 main，PR title 同 commit message
- PR description 須包含：
  * 今日 10 則新聞的標題清單
  * 3 篇 deep-story 的標題與 lede
  * 哪些 news_ids 與過去 7 天衝突（如有，已自動跳過該則）
  * 用了哪些來源站

不要直接 merge。等待人工 review。
```

## 8. Design system

### 8.1 Inherited from kaer-morhen verbatim

- **Color tokens**: OKLCH dual-theme, `light-dark()` composable. All
  tokens identical: `--ink`, `--ink-soft`, `--muted`, `--muted-2`,
  `--bg`, `--bg-soft`, `--line`, `--accent` (terracotta hue 38),
  `--accent-text`, `--accent-hover`, `--ink-deep` (hue 245), `--sage`
  (hue 150), `--sage-deep`, `--shadow-warm`, `--shadow-glow`,
  `--accent-shadow`.
- **Theme system**: `<html data-theme="light|dark">` + inline pre-paint
  script + `prefers-color-scheme` fallback. *Only change*: localStorage
  key from `km-theme` to **`vg-theme`** (avoid collision when both sites
  open in same browser).
- **Typography stack**: Spectral (Latin body) + LXGW WenKai TC (CJK body)
  + EB Garamond (display) + IM Fell English Italic (scribed) + Manrope
  (labels/nav) + JetBrains Mono (code). Scale `--fs-xs` through
  `--fs-2xl` unchanged.
- **Spacing rhythm**: `--s-1` through `--s-6` unchanged.
- **Layout columns**: `--col-narrow`, `--col-wide` unchanged.
- **Components**: tag chip, topic crumb, blockquote (terracotta curly
  mark), drop cap, code block, related/backlinks panels — CSS sources
  verbatim.

### 8.2 vatt-ghern–specific

| Element | Spec |
|---|---|
| **Sigil** | v1: reuse kaer-morhen wolf medallion PNG (placeholder, identifiable inheritance). Future: dedicated witcher sigil. Filename `assets/vg-sigil.png`, variants `vg-sigil-{80,160,320,640}.webp` via `scripts/build-sigil.mjs` (same sharp pipeline). |
| **Wordmark** | Main: `vatt'ghern`. Subtitle: `jaskier's ballads` (IM Fell English Italic). Mirror motif: km = the fortress + the poet's archive; vg = the witcher + the poet's ballads. |
| **Nav items** | `今日 · 歷史 · 主題 · 標籤 · feed · search · theme toggle`. "今日" = homepage (latest day's roundup). "歷史" = full timeline archive. |
| **Homepage layout** | **Daily timeline**, not topic-keyed. See §8.3. |
| **Date marker** (chronological listings) | `MM.DD` two-digit, EB Garamond italic in left margin (replaces km's year-marker, which makes no sense for daily cadence). Week-grouping divider via hairline. |
| **Roundup card** | Left: `#NN` large numeral (EB Garamond italic, `--accent`). Right: title + lede. Background `--bg-soft`, hairline border. |
| **Deep-story card** | Top: thin hairline in `--accent-text`. Below: title (Spectral 600) + lede (IM Fell italic) + preview icon. Transparent background, typography-carried hierarchy. |
| **Post-trail** | Inherit km structure + add `← yesterday │ today │ tomorrow →` daily navigation when post is roundup or deep-story. |
| **Search panel** | Inherit km's Pagefind setup verbatim (including the 51 `!important` overrides). |

### 8.3 Homepage layout

```
[Hero — today]
  Date in --fs-2xl EB Garamond italic
  Today's 4 cards in 2×2 grid (desktop) / stack (mobile):
    ┌───────────────┬───────────────┐
    │  roundup      │  deep #1       │
    │  (wide card)  │               │
    ├───────────────┼───────────────┤
    │  deep #2      │  deep #3       │
    └───────────────┴───────────────┘

[Timeline — past days]
  Grouped by week:
    〈this week's other days〉
      MM.DD — 4 篇 [horizontal small cards]
      MM.DD — 4 篇 [horizontal small cards]
      ...
    〈last week〉
      ...

[Footer]
  accumulated N days · accumulated N posts · since YYYY-MM-DD
```

## 9. CI/CD

### 9.1 Cloudflare Pages (production + preview)

One-time setup in Cloudflare dashboard:

| Field | Value |
|---|---|
| Project name | `vatt-ghern` |
| Production branch | `main` |
| Build command | `npm ci && npx @11ty/eleventy` |
| Build output directory | `_site` |
| Root directory | `/` |
| Node version | `20` (via `NODE_VERSION=20` env or `.nvmrc`) |

**Automatic behavior** (no deploy workflow needed):
- Push to `main` → production build & deploy to `vatt-ghern.pages.dev`
  (or custom domain when bound)
- Push to non-main branch / open PR → preview build, Cloudflare bot
  comments PR with preview URL

### 9.2 GitHub Actions quality gate

`.github/workflows/quality.yml`:

```yaml
name: Quality Gate

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install
        run: npm ci
      - name: Build sanity
        run: npx @11ty/eleventy
      - name: HTML validate
        run: npx html-validate "_site/**/*.html"
      - name: Internal link check
        run: node tests/link-check.mjs
      - name: Archetype self-check
        run: node tests/archetype-check.mjs _site/posts/
      - name: Anti-duplication audit
        if: github.event_name == 'pull_request'
        run: node scripts/check-dup.mjs --against=main
```

External link checking deliberately **not done** (external sites churn,
false positives waste attention; internal-link + dup are the real risks).

### 9.3 Branch lifecycle

| Branch | Created | Deleted |
|---|---|---|
| `main` | once | never |
| `daily/YYYY-MM-DD` | by routine, daily | auto-deleted on merge (GitHub setting) |
| `feature/*` | manually | auto-deleted on merge |

### 9.4 Connector permissions (Claude Routine → GitHub)

- Repository read (clone)
- Repository contents write (push branch)
- Pull request write (open PR)

Explicitly **not** granted: admin, actions, deployments, packages.

### 9.5 Cost

| Service | Usage | Monthly cost |
|---|---|---|
| Cloudflare Pages builds | ~1/day = ~30/month (free limit 500) | $0 |
| Cloudflare Pages bandwidth | Unlimited free | $0 |
| GitHub Actions | ~60 min/month (free quota 2000) | $0 |
| Claude Routine | 1/day (within Pro 5/day or Max 15/day) | included in subscription |

## 10. Testing strategy

Lean, by design. Personal blog, not SaaS.

### 10.1 Automated (PR-time)

| Check | Tool | Pass criteria |
|---|---|---|
| Eleventy build | `npx @11ty/eleventy` | exit 0 |
| HTML validity | `html-validate` | 0 errors (warnings ok) |
| Internal links | `tests/link-check.mjs` | 0 broken |
| Archetype compliance | `tests/archetype-check.mjs` | 0 violations |
| Anti-duplication | `scripts/check-dup.mjs` | 0 duplicate `news_id` |

### 10.2 Skill self-check (pre-commit)

- Each deep-story's `news_ids` resolves to a roundup item
- Each deep-story has ≥2 inline SVG widgets
- No hardcoded colors (hex/rgb); only tokens
- Sidecar JSON schema satisfied
- No forbidden patterns: Latin em-dash, subscribe CTA, social-share buttons

### 10.3 Visual review (Tony, per PR)

- Roundup readable in 30-sec scan? (Cloudflare preview)
- Each deep-story has at least one functional SVG?
- Dark + light both render? (toggle in preview)
- Mobile readable?

### 10.4 Explicitly not done (YAGNI)

- Visual regression / screenshot diff
- E2E (Playwright walk-through)
- a11y automated scanning (handled by writing semantic HTML + dark-mode
  contrast tokens)
- Performance budgets (Cloudflare CDN + SSG already fast)
- Coverage metrics (too few tests for the metric to be meaningful)

## 11. Documentation responsibilities

| File | Audience | Update trigger |
|---|---|---|
| `README.md` | External visitors, future contributors | Behavior change |
| `PRODUCT.md` | Future Tony + AI agent | Direction change |
| `DESIGN.md` | Future Tony + AI agent + visual collaborator | Token/archetype change |
| `references/*.md` | **Skill at runtime** | Behavior tuning |
| `skills/daily-news/SKILL.md` | Skill itself + routine fallback | Workflow change |
| `commands/daily-news.md` | Claude Code plugin loader | Rare |
| `docs/superpowers/specs/*` | Future Tony tracing design rationale | Never (frozen) |

**Single source of truth for skill behavior**: `references/` (skill-facing
short summaries). `DESIGN.md` is the long human-readable form;
`references/design-system.md` is its skill-facing extract. The two must
stay in sync — a manual review responsibility.

## 12. Phased delivery plan

### Phase 1 — Site shell live (no daily news yet)

**Goal**: `vatt-ghern.pages.dev` publicly reachable, homepage + 2
hand-written sample posts visible.

**Deliverables**:
1. Repo init (`.gitignore`, `package.json`, `eleventy.config.js`,
   `.nvmrc`)
2. Design-system port: `src/static/site.css`, fontsource packages, theme
   toggle script, sigil PNG (reused km wolf)
3. Wordmark = `vatt'ghern` / `jaskier's ballads`
4. Layouts: `base.njk`, `index.njk`, `archive.njk`, `tags.njk`,
   `topics.njk`, `feed.xml.njk`, `404.njk`
5. 2 hand-written sample posts in `src/posts/2026/05/16/`:
   - sample roundup (10 fictional items)
   - sample deep-story (any topic)
6. Archetypes distilled into `src/archetypes/daily-roundup.html` +
   `src/archetypes/daily-deep-story.html`
7. Cloudflare Pages connected, build green,
   `vatt-ghern.pages.dev` live
8. `quality.yml` first cut (build + html-validate only)
9. `README.md` + `PRODUCT.md` + `DESIGN.md` v1

**Exit criteria**: live URL renders homepage + 2 samples; dark/light
toggle works; PR preview verified once.

### Phase 2 — Daily-news skill (manual trigger)

**Goal**: `/vatt-ghern:daily-news` runs locally, produces 4 HTML, opens
PR. Routine not yet enabled.

**Deliverables**:
1. `.claude-plugin/plugin.json` + `marketplace.json`
2. `commands/daily-news.md`
3. `skills/daily-news/SKILL.md` (9-step workflow)
4. `references/sources.md` (35 sources, HackerNoon first)
5. `references/persona.md`
6. `references/archetypes.md`
7. `references/anti-duplication.md`
8. `references/design-system.md`
9. `references/widget-isolation.md`
10. `scripts/load-context.mjs`, `check-dup.mjs`, `publish.mjs`
11. `tests/archetype-check.mjs`, `link-check.mjs`
12. `quality.yml` extended with remaining 3 checks
13. Local run `claude -p "/vatt-ghern:daily-news"` produces 4 HTML,
    opens PR, preview verified

**Exit criteria**: two consecutive manual runs (separate days), second
run correctly skips first run's `news_ids`.

### Phase 3 — Routine automation

**Goal**: Claude Routine daily 07:00 UTC+8 runs end-to-end, opens PR,
Tony merges.

**Deliverables**:
1. Routine configured at claude.ai/code (schedule + canonical prompt
   from §7.2 + GitHub connector with §9.4 permissions)
2. Day-1 manual observation through the full pipeline
3. After 3 days: review dedup behavior, news quality, PR description
   completeness, Cloudflare preview link appearance
4. Tuning PRs as needed to `SKILL.md` or `references/persona.md`

**Exit criteria**: 7 consecutive days of routine success; ≥5 merged
(skipped days allowed).

### Phase 4 — Future (out of scope for this spec)

Candidates, not committed:
- `/vatt-ghern:audit` (km `quen` analogue) — quality audit of existing
  posts
- `/vatt-ghern:aard` analogue — widget catalog for reuse across posts
- Custom domain (e.g., `vatt-ghern.tonyhu.dev`)
- Email subscription via RSS (Buttondown or self-host)
- In-site search (Pagefind) — defer until ≥30 posts accumulated

### Effort estimate

| Phase | Rough effort |
|---|---|
| Phase 1 | One focused afternoon to one evening |
| Phase 2 | One weekend |
| Phase 3 | One afternoon (mostly routine setup + observation) |

**MVP (phases 1-3)** completable within a week.

## 13. Open questions intentionally deferred

- **Sigil redesign**: deferred to a future phase. v1 reuses km wolf
  medallion. When Tony commissions / draws a witcher-specific sigil,
  swap is mechanical (replace `assets/vg-sigil.png`, rerun
  `scripts/build-sigil.mjs`).
- **Custom domain**: optional, post-MVP.
- **Search**: defer until content volume justifies the chrome.
- **Translation/i18n**: not planned. Site is zh-Hant only.
