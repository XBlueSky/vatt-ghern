# vatt-ghern Phase 1 — Site Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get `vatt-ghern.pages.dev` live with two hand-written sample posts (1 roundup + 1 deep-story) and a daily-timeline homepage — proving the Eleventy + Cloudflare Pages + design-system pipeline before adding any AI-authored content.

**Architecture:** Eleventy 3.x SSG → Cloudflare Pages build & deploy → static HTML. Design system (OKLCH dual-theme, six-font stack) ported from kaer-morhen but trimmed to only what Phase 1 uses. Client-side read-tracking via localStorage. Cloudflare Web Analytics enabled in dashboard (no per-page code).

**Tech Stack:** Eleventy 3, Nunjucks templates, fontsource (self-host fonts), html-validate (lint), sharp (sigil variant builder), Cloudflare Pages, GitHub Actions, GitHub.

**Spec reference:** `docs/superpowers/specs/2026-05-16-vatt-ghern-design.md` §12 Phase 1.

---

## File Structure

Files this plan creates or modifies:

| Path | Purpose |
|---|---|
| `.gitignore` | Standard Node + Eleventy ignores |
| `.nvmrc` | Pin Node 20 |
| `package.json` | Eleventy + fontsource + html-validate + sharp |
| `eleventy.config.js` | Eleventy config: passthrough, collections, filters |
| `eleventy.config.js` | (single file) |
| `src/_data/site.js` | Site-wide config (name, URL, nav, etc.) |
| `src/_includes/layouts/base.njk` | HTML skeleton, header, footer, theme/read scripts |
| `src/_includes/layouts/post.njk` | Post-trail wrapper for both archetypes |
| `src/_includes/share-buttons.njk` | Reusable per-post share affordances |
| `src/static/site.css` | Full design system CSS (tokens + components) |
| `src/static/fonts.css` | Aggregates @fontsource per-weight imports |
| `src/static/read-tracker.js` | localStorage read state (auto + manual) |
| `src/static/vg-sigil.png` | Sigil source (copied from km wolf, Phase 1 placeholder) |
| `src/static/vg-sigil-{80,160,320,640}.webp` | Sigil variants (built via script) |
| `scripts/build-sigil.mjs` | Sharp pipeline to produce sigil variants |
| `src/index.njk` | Homepage — daily timeline |
| `src/archive.njk` | Full historical archive page |
| `src/tags.njk` | All-tags index |
| `src/topics.njk` | All-topics index |
| `src/feed.xml.njk` | RSS feed |
| `src/404.njk` | Not-found page |
| `src/posts/posts.11tydata.json` | Posts default frontmatter (layout, tag) |
| `src/posts/2026/05/16/roundup.html` | Sample roundup |
| `src/posts/2026/05/16/roundup.11tydata.json` | Sample roundup sidecar |
| `src/posts/2026/05/16/deep-sample.html` | Sample deep-story |
| `src/posts/2026/05/16/deep-sample.11tydata.json` | Sample deep-story sidecar |
| `src/archetypes/daily-roundup.html` | Archetype skeleton (distilled from sample) |
| `src/archetypes/daily-deep-story.html` | Archetype skeleton (distilled from sample) |
| `.github/workflows/quality.yml` | PR-time quality gate (build + html-validate) |
| `README.md` | Setup, run, deploy, license |
| `PRODUCT.md` | What vatt-ghern is, audience, voice |
| `DESIGN.md` | Design system long-form (human-read) |

Total: ~30 files. Most are small (<100 lines). Largest are `site.css` (~600 lines, trimmed from km) and the two sample HTML posts (~300–600 lines).

---

## Task 1: Repo bootstrap (init, package.json, .gitignore, .nvmrc)

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/.gitignore`
- Create: `/Users/bluesky/arsenal/vatt-ghern/.nvmrc`
- Create: `/Users/bluesky/arsenal/vatt-ghern/package.json`

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
_site/
.DS_Store
*.log
.env
.env.local
public/
```

- [ ] **Step 2: Create `.nvmrc`**

```
20
```

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "vatt-ghern",
  "version": "0.1.0",
  "private": true,
  "description": "Public tech blog — daily news authored by Claude routine",
  "type": "module",
  "scripts": {
    "dev": "eleventy --serve --quiet",
    "build": "eleventy",
    "clean": "rm -rf _site",
    "sigil": "node scripts/build-sigil.mjs",
    "lint:html": "html-validate \"_site/**/*.html\"",
    "test": "node --test tests/*.mjs"
  },
  "devDependencies": {
    "@11ty/eleventy": "^3.0.0",
    "@11ty/eleventy-plugin-rss": "^2.0.2",
    "@fontsource/eb-garamond": "^5.2.7",
    "@fontsource/im-fell-english": "^5.2.6",
    "@fontsource/jetbrains-mono": "^5.2.8",
    "@fontsource/lxgw-wenkai-tc": "^5.2.9",
    "@fontsource/manrope": "^5.2.8",
    "@fontsource/spectral": "^5.2.8",
    "html-validate": "^9.0.0",
    "sharp": "^0.34.5"
  }
}
```

- [ ] **Step 4: Install dependencies**

Run from `/Users/bluesky/arsenal/vatt-ghern/`:
```bash
npm install
```

Expected: `node_modules/` created, no errors. ~150 MB.

- [ ] **Step 5: Commit**

```bash
git add .gitignore .nvmrc package.json package-lock.json
git commit -m "chore: scaffold Eleventy + fontsource"
```

---

## Task 2: Eleventy config (passthrough, collections, filters)

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/eleventy.config.js`

This is a trimmed version of kaer-morhen's eleventy.config.js — no pagefind, no archetype catalog, no silhouette glyphs. Only what Phase 1 needs.

- [ ] **Step 1: Create `eleventy.config.js`**

```javascript
import rssPlugin from "@11ty/eleventy-plugin-rss";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(rssPlugin);

  // Asset passthrough inside posts (images, JSON sidecars, etc.).
  eleventyConfig.addPassthroughCopy(
    "src/posts/**/*.{png,jpg,jpeg,gif,svg,webp,avif,mp4,webm,json,csv,pdf}"
  );
  eleventyConfig.addPassthroughCopy({ "src/static": "static" });

  // Self-host fonts via fontsource. Mirror files/ (woff2 + woff) for each
  // family, plus the specific weight-CSS files we actually use.
  for (const [pkg, dest] of [
    ["@fontsource/spectral",        "spectral"],
    ["@fontsource/eb-garamond",     "eb-garamond"],
    ["@fontsource/im-fell-english", "im-fell-english"],
    ["@fontsource/manrope",         "manrope"],
    ["@fontsource/jetbrains-mono",  "jetbrains-mono"],
    ["@fontsource/lxgw-wenkai-tc",  "lxgw-wenkai-tc"],
  ]) {
    eleventyConfig.addPassthroughCopy({
      [`node_modules/${pkg}/files`]: `static/fonts/${dest}/files`,
    });
  }
  for (const [pkg, dest, weights] of [
    ["@fontsource/spectral",        "spectral",        ["400", "400-italic", "500", "500-italic", "600"]],
    ["@fontsource/eb-garamond",     "eb-garamond",     ["400-italic", "500", "500-italic"]],
    ["@fontsource/im-fell-english", "im-fell-english", ["400", "400-italic"]],
    ["@fontsource/manrope",         "manrope",         ["400", "500", "600", "700"]],
    ["@fontsource/jetbrains-mono",  "jetbrains-mono",  ["400", "500"]],
    ["@fontsource/lxgw-wenkai-tc",  "lxgw-wenkai-tc",  ["400", "700"]],
  ]) {
    for (const w of weights) {
      eleventyConfig.addPassthroughCopy({
        [`node_modules/${pkg}/${w}.css`]: `static/fonts/${dest}/${w}.css`,
      });
    }
  }

  // Collection: all published posts, newest first.
  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/posts/**/*.html")
      .filter((p) => p.data.status !== "draft")
      .sort((a, b) => new Date(b.data.date) - new Date(a.data.date))
  );

  // Collection: tag → count map for tags-index.
  eleventyConfig.addCollection("tagList", (api) => {
    const counts = new Map();
    for (const item of api.getFilteredByGlob("src/posts/**/*.html")) {
      if (item.data.status === "draft") continue;
      for (const tag of new Set(item.data.tags || [])) {
        if (tag === "post") continue;
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tag, count]) => ({ tag, count }));
  });

  // Collection: topic → posts map for topics-index.
  eleventyConfig.addCollection("topics", (api) => {
    const byTopic = new Map();
    for (const post of api.getFilteredByGlob("src/posts/**/*.html")) {
      const topic = post.data.topic;
      if (!topic) continue;
      if (!byTopic.has(topic)) byTopic.set(topic, []);
      byTopic.get(topic).push(post);
    }
    return Array.from(byTopic, ([slug, posts]) => ({
      slug,
      title: posts[0].data.topicTitle || slug,
      posts: posts.sort((a, b) => new Date(b.data.date) - new Date(a.data.date)),
    }));
  });

  // Collection: posts grouped by date for daily timeline homepage.
  // Returns [{ date: "2026-05-16", posts: [...] }, ...] newest day first.
  eleventyConfig.addCollection("daysWithPosts", (api) => {
    const byDay = new Map();
    for (const post of api.getFilteredByGlob("src/posts/**/*.html")) {
      if (post.data.status === "draft") continue;
      const d = new Date(post.data.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(post);
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, posts]) => ({
        date,
        posts: posts.sort((a, b) => {
          // roundup first, then deep-stories
          if (a.data.archetype === "daily-roundup") return -1;
          if (b.data.archetype === "daily-roundup") return 1;
          return 0;
        }),
      }));
  });

  // Filters
  eleventyConfig.addFilter("dateISO", (d) => {
    const dt = d ? new Date(d) : new Date();
    return isNaN(dt) ? new Date().toISOString() : dt.toISOString();
  });
  eleventyConfig.addFilter("dateMD", (d) => {
    const dt = d ? new Date(d) : new Date();
    if (isNaN(dt)) return "";
    return `${String(dt.getMonth() + 1).padStart(2, "0")}.${String(dt.getDate()).padStart(2, "0")}`;
  });
  eleventyConfig.addFilter("dateHuman", (d) => {
    const dt = d ? new Date(d) : new Date();
    if (isNaN(dt)) return "";
    return `${dt.getFullYear()} · ${String(dt.getMonth() + 1).padStart(2, "0")} · ${String(dt.getDate()).padStart(2, "0")}`;
  });
  eleventyConfig.addFilter("displayTags", (tags) => {
    if (!Array.isArray(tags)) return [];
    return [...new Set(tags)].filter((t) => t !== "post");
  });
  eleventyConfig.addFilter("take", (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []));

  // Group posts by ISO week for homepage timeline. Returns
  // [{ weekLabel, days: [{ date, posts }] }, ...].
  eleventyConfig.addFilter("groupByWeek", (days) => {
    if (!Array.isArray(days)) return [];
    const out = new Map();
    for (const d of days) {
      const dt = new Date(d.date);
      const onejan = new Date(dt.getFullYear(), 0, 1);
      const week = Math.ceil((((dt - onejan) / 86400000) + onejan.getDay() + 1) / 7);
      const key = `${dt.getFullYear()}-W${String(week).padStart(2, "0")}`;
      if (!out.has(key)) out.set(key, []);
      out.get(key).push(d);
    }
    return [...out.entries()].map(([weekLabel, days]) => ({ weekLabel, days }));
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
```

- [ ] **Step 2: Verify build runs (will succeed with no output yet)**

Run from `/Users/bluesky/arsenal/vatt-ghern/`:
```bash
npx @11ty/eleventy
```

Expected: exit 0, message like "Wrote 0 files in 0.XX seconds". No errors. The `_site/static/fonts/` tree should contain the fontsource files passthrough'd.

- [ ] **Step 3: Verify font passthrough worked**

```bash
ls _site/static/fonts/spectral/files/ | head -5
```

Expected: Several `.woff2` and `.woff` files listed.

- [ ] **Step 4: Commit**

```bash
git add eleventy.config.js
git commit -m "feat: eleventy config with collections, filters, font passthrough"
```

---

## Task 3: Site-wide data (`src/_data/site.js`)

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/_data/site.js`

- [ ] **Step 1: Create `src/_data/site.js`**

```javascript
// Site-wide data accessible in any template as `site.*`.
export default {
  name: "vatt'ghern",
  subtitle: "jaskier's ballads",
  description: "Daily tech news for engineers — curated and storied by an AI bard.",
  url: "https://vatt-ghern.pages.dev",
  lang: "zh-Hant",
  startedYear: 2026,
  // Navigation items shown in site header.
  nav: [
    { href: "/", label: "今日" },
    { href: "/archive/", label: "歷史" },
    { href: "/topics/", label: "主題" },
    { href: "/tags/", label: "標籤" },
    { href: "/feed.xml", label: "feed" },
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/_data/site.js
git commit -m "feat: site-wide data (name, subtitle, nav)"
```

---

## Task 4: Sigil — copy + build variants

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/static/vg-sigil.png` (binary; copied from km)
- Create: `/Users/bluesky/arsenal/vatt-ghern/scripts/build-sigil.mjs`
- Generated: `/Users/bluesky/arsenal/vatt-ghern/src/static/vg-sigil-{80,160,320,640}.webp`

Phase 1 reuses the kaer-morhen wolf medallion as a placeholder (spec §13 explicit deferral).

- [ ] **Step 1: Copy source PNG**

```bash
cp /Users/bluesky/arsenal/kaer-morhen/src/static/sigil.png \
   /Users/bluesky/arsenal/vatt-ghern/src/static/vg-sigil.png
```

- [ ] **Step 2: Create `scripts/build-sigil.mjs`**

```javascript
// Build webp variants from src/static/vg-sigil.png at 80/160/320/640 px.
// Run after replacing vg-sigil.png with a new design.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "src", "static", "vg-sigil.png");
const sizes = [80, 160, 320, 640];

for (const size of sizes) {
  const out = join(here, "..", "src", "static", `vg-sigil-${size}.webp`);
  await sharp(src)
    .resize(size, size, { fit: "cover", position: "center" })
    .webp({ quality: 92 })
    .toFile(out);
  console.log(`wrote ${out}`);
}
```

- [ ] **Step 3: Run sigil build**

```bash
npm run sigil
```

Expected: 4 lines of output, each "wrote .../vg-sigil-NNN.webp".

- [ ] **Step 4: Verify variants exist**

```bash
ls src/static/vg-sigil-*.webp
```

Expected: 4 files listed.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-sigil.mjs src/static/vg-sigil.png src/static/vg-sigil-*.webp
git commit -m "feat: sigil pipeline (sharp), v1 reuses km wolf placeholder"
```

---

## Task 5: Fonts aggregator CSS

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/static/fonts.css`

- [ ] **Step 1: Create `src/static/fonts.css`**

```css
/* Aggregates per-weight @fontsource CSS into one file the layout can include.
 * Each @import points at the file-passthrough location set up in
 * eleventy.config.js: /static/fonts/<family>/<weight>.css
 */

/* Spectral — Latin body serif */
@import url("/static/fonts/spectral/400.css");
@import url("/static/fonts/spectral/400-italic.css");
@import url("/static/fonts/spectral/500.css");
@import url("/static/fonts/spectral/500-italic.css");
@import url("/static/fonts/spectral/600.css");

/* EB Garamond — display serif (wordmark, drop cap, dates) */
@import url("/static/fonts/eb-garamond/400-italic.css");
@import url("/static/fonts/eb-garamond/500.css");
@import url("/static/fonts/eb-garamond/500-italic.css");

/* IM Fell English — scribed italic (subtitles, asides, marginalia) */
@import url("/static/fonts/im-fell-english/400.css");
@import url("/static/fonts/im-fell-english/400-italic.css");

/* Manrope — sans (labels, nav, metadata) */
@import url("/static/fonts/manrope/400.css");
@import url("/static/fonts/manrope/500.css");
@import url("/static/fonts/manrope/600.css");
@import url("/static/fonts/manrope/700.css");

/* JetBrains Mono — code */
@import url("/static/fonts/jetbrains-mono/400.css");
@import url("/static/fonts/jetbrains-mono/500.css");

/* LXGW WenKai TC — CJK body serif (霞鶩文楷, kaishu) */
@import url("/static/fonts/lxgw-wenkai-tc/400.css");
@import url("/static/fonts/lxgw-wenkai-tc/700.css");
```

- [ ] **Step 2: Commit**

```bash
git add src/static/fonts.css
git commit -m "feat: fonts aggregator css"
```

---

## Task 6: Design system CSS (`src/static/site.css`)

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/static/site.css`

Port from kaer-morhen but **trim aggressively** — only ship Phase 1 needs. Concretely: keep all color/typography/spacing tokens, base reset, header/footer chrome, post-trail, tag/topic chips, blockquote, drop cap, code block. Drop: archetype catalog grid, silhouette glyphs, widget-specific styles, pagefind overrides, related/backlinks panels (deferred to Phase 2 when actual content needs them).

- [ ] **Step 1: Read km site.css as reference**

```bash
wc -l /Users/bluesky/arsenal/kaer-morhen/src/static/site.css
```

Confirm size (expected ~1592 lines).

- [ ] **Step 2: Create `src/static/site.css`**

Use this skeleton — fill in every TOKEN VALUE by reading the corresponding section in `/Users/bluesky/arsenal/kaer-morhen/src/static/site.css`. Do NOT change any color/spacing/font value; do change `--km-*` prefixes to `--vg-*` for any custom property that uses `km` (most should not — most use plain names like `--ink`). Replace any `.km-*` class with `.vg-*`. The class rename is mechanical search-and-replace within this CSS file only.

```css
/* vatt-ghern design system
 * Ported from kaer-morhen (clean rebuild; same tokens, vg-* class prefix).
 * Reference: docs/superpowers/specs/2026-05-16-vatt-ghern-design.md §8
 */

/* ── Tokens ──────────────────────────────────────────────── */
:root {
  color-scheme: light dark;

  /* Color (light defaults; dark overrides below via [data-theme="dark"]) */
  --ink:           oklch(0.20 0.010 65);
  --ink-soft:      oklch(0.35 0.010 65);
  --muted:         oklch(0.48 0.014 65);
  --muted-2:       oklch(0.68 0.010 65);
  --bg:            oklch(0.97 0.012 80);
  --bg-soft:       oklch(0.945 0.014 80);
  --line:          oklch(0.92 0.012 80);
  --accent:        oklch(0.665 0.143 38);
  --accent-text:   oklch(0.50 0.130 38);
  --accent-hover:  oklch(0.40 0.115 38);
  --ink-deep:      oklch(0.36 0.045 245);
  --sage:          oklch(0.45 0.065 150);
  --sage-deep:     oklch(0.34 0.075 150);
  --shadow-warm:   60 38 24;
  --shadow-glow:   217 119 87;
  --accent-shadow: oklch(0.665 0.143 38 / 0.16);

  /* Font stacks */
  --serif:   "Spectral", "LXGW WenKai TC", "PingFang TC", "Noto Sans CJK TC", serif;
  --display: "EB Garamond", "LXGW WenKai TC", serif;
  --scribed: "IM Fell English", "EB Garamond", serif;
  --sans:    "Manrope", system-ui, sans-serif;
  --mono:    "JetBrains Mono", ui-monospace, Menlo, monospace;

  /* Font scale (clamp-fluid) */
  --fs-xs:   clamp(0.80rem, 0.78rem + 0.10vw, 0.86rem);
  --fs-sm:   clamp(0.92rem, 0.88rem + 0.15vw, 0.98rem);
  --fs-base: clamp(1.05rem, 1.00rem + 0.25vw, 1.18rem);
  --fs-md:   clamp(1.20rem, 1.12rem + 0.35vw, 1.38rem);
  --fs-lg:   clamp(1.55rem, 1.38rem + 0.75vw, 2.05rem);
  --fs-xl:   clamp(2.05rem, 1.65rem + 1.60vw, 3.25rem);
  --fs-2xl:  clamp(2.65rem, 2.05rem + 2.50vw, 4.50rem);

  /* Spacing rhythm */
  --s-1: clamp(0.25rem, 0.20rem + 0.20vw, 0.40rem);
  --s-2: clamp(0.50rem, 0.40rem + 0.40vw, 0.80rem);
  --s-3: clamp(0.85rem, 0.70rem + 0.60vw, 1.25rem);
  --s-4: clamp(1.50rem, 1.20rem + 1.20vw, 2.50rem);
  --s-5: clamp(2.50rem, 2.00rem + 2.00vw, 4.50rem);
  --s-6: clamp(4.00rem, 3.00rem + 3.00vw, 7.00rem);

  /* Layout columns */
  --gutter:      clamp(1rem, 2vw, 2rem);
  --col-narrow:  min(64ch, 100% - 2 * var(--gutter));
  --col-wide:    min(78ch, 100% - 2 * var(--gutter));
}

[data-theme="dark"] {
  color-scheme: dark;
  --ink:           oklch(0.92 0.018 80);
  --ink-soft:      oklch(0.78 0.014 80);
  --muted:         oklch(0.62 0.014 80);
  --muted-2:       oklch(0.45 0.010 80);
  --bg:            oklch(0.18 0.020 80);
  --bg-soft:       oklch(0.22 0.024 80);
  --line:          oklch(0.28 0.016 80);
  --accent:        oklch(0.74 0.140 38);
  --accent-text:   oklch(0.74 0.140 38);
  --accent-hover:  oklch(0.84 0.120 38);
  --ink-deep:      oklch(0.78 0.060 245);
  --sage:          oklch(0.72 0.060 150);
  --sage-deep:     oklch(0.82 0.055 150);
  --shadow-warm:   0 0 0;
  --shadow-glow:   232 140 100;
}

/* ── Base reset ──────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
html { font-size: 100%; -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--serif);
  font-size: var(--fs-base);
  line-height: 1.78;
  letter-spacing: 0.002em;
  font-feature-settings: "kern", "liga", "calt";
  font-optical-sizing: auto;
}
img, svg, video { max-width: 100%; height: auto; display: block; }
a { color: var(--accent-text); text-decoration: none; }
a:hover { color: var(--accent-hover); text-decoration: underline; text-underline-offset: 3px; }

/* ── Site header ─────────────────────────────────────────── */
.vg-site-header {
  position: sticky; top: 0; z-index: 50;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--s-3);
  align-items: center;
  padding: var(--s-3) var(--gutter);
  background: color-mix(in oklab, var(--bg) 88%, transparent);
  backdrop-filter: blur(2px);
  border-bottom: 1px solid var(--line);
}
.vg-home { display: flex; gap: var(--s-2); align-items: center; }
.vg-sigil {
  width: 40px; height: 40px;
  border-radius: 50%;
  clip-path: circle(48%);
}
.vg-wordmark { display: flex; flex-direction: column; line-height: 1.1; }
.vg-wordmark-1 {
  font-family: var(--display);
  font-weight: 500;
  font-size: var(--fs-md);
  letter-spacing: 0.01em;
  color: var(--ink);
}
.vg-wordmark-2 {
  font-family: var(--scribed);
  font-style: italic;
  font-size: var(--fs-sm);
  color: var(--ink-deep);
  margin-top: 2px;
}
.vg-spacer { flex: 1; }
.vg-nav {
  display: flex; gap: var(--s-2); align-items: center;
  font-family: var(--sans);
  font-size: var(--fs-sm);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  font-variant: small-caps;
}
.vg-nav a, .vg-nav button {
  color: var(--muted);
  background: none; border: none;
  font: inherit; letter-spacing: inherit; text-transform: inherit;
  cursor: pointer; padding: var(--s-1) 0;
}
.vg-nav a:hover, .vg-nav button:hover { color: var(--accent-text); }
.vg-sep { color: var(--muted-2); }

@media (max-width: 500px) {
  .vg-site-header { grid-template-columns: auto auto; }
  .vg-wordmark-2 { display: none; }
  .vg-sep { display: none; }
  .vg-nav { gap: var(--s-3); }
}

/* ── Main ───────────────────────────────────────────────── */
.vg-main {
  max-width: min(1080px, 100% - 2 * var(--gutter));
  margin: var(--s-5) auto;
  padding: 0;
}
.vg-main > article,
.vg-main > section {
  max-width: var(--col-narrow);
  margin-inline: auto;
}

/* ── Site footer ─────────────────────────────────────────── */
.vg-site-footer {
  margin-top: var(--s-6);
  padding: var(--s-4) var(--gutter);
  border-top: 1px solid var(--line);
  text-align: center;
  font-family: var(--sans);
  font-size: var(--fs-sm);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  font-variant: small-caps;
  color: var(--muted);
}
.vg-site-footer button {
  background: none; border: none; padding: 0;
  font: inherit; letter-spacing: inherit; text-transform: inherit;
  color: var(--muted); cursor: pointer;
}
.vg-site-footer button:hover { color: var(--accent-text); }

/* ── Homepage daily timeline ─────────────────────────────── */
.vg-today-hero {
  margin-bottom: var(--s-5);
}
.vg-today-date {
  font-family: var(--display);
  font-style: italic;
  font-size: var(--fs-2xl);
  line-height: 1;
  color: var(--ink);
  margin-bottom: var(--s-3);
}
.vg-today-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-3);
}
@media (max-width: 640px) { .vg-today-grid { grid-template-columns: 1fr; } }

.vg-week-section { margin-top: var(--s-5); }
.vg-week-label {
  font-family: var(--scribed);
  font-style: italic;
  font-size: var(--fs-md);
  color: var(--sage-deep);
  border-bottom: 1px solid var(--line);
  padding-bottom: var(--s-2);
  margin-bottom: var(--s-3);
}
.vg-day-row {
  display: grid;
  grid-template-columns: 5rem 1fr;
  gap: var(--s-3);
  align-items: baseline;
  padding: var(--s-3) 0;
  border-bottom: 1px dashed var(--line);
}
.vg-day-row:last-child { border-bottom: none; }
.vg-day-date {
  font-family: var(--display);
  font-style: italic;
  font-size: var(--fs-lg);
  color: var(--muted);
}
.vg-day-posts {
  display: flex; flex-wrap: wrap; gap: var(--s-2);
  font-family: var(--sans);
  font-size: var(--fs-sm);
}
.vg-day-posts a { color: var(--ink-soft); }
.vg-day-posts a:hover { color: var(--accent-text); }

/* ── Cards (roundup + deep-story preview) ─────────────────── */
.vg-card {
  display: block;
  padding: var(--s-3);
  text-decoration: none;
  color: inherit;
}
.vg-card-roundup {
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 4px;
  display: grid;
  grid-template-columns: 3rem 1fr;
  gap: var(--s-3);
  align-items: baseline;
}
.vg-card-roundup-num {
  font-family: var(--display);
  font-style: italic;
  font-size: var(--fs-xl);
  color: var(--accent);
  line-height: 0.9;
}
.vg-card-title {
  font-family: var(--serif);
  font-weight: 600;
  font-size: var(--fs-md);
  color: var(--ink);
  margin: 0 0 var(--s-1);
}
.vg-card-lede {
  font-family: var(--scribed);
  font-style: italic;
  font-size: var(--fs-sm);
  color: var(--muted);
  margin: 0;
}
.vg-card-deep {
  border-top: 1px solid var(--accent-text);
  padding-top: var(--s-3);
}
.vg-card-progress {
  font-family: var(--scribed);
  font-style: italic;
  font-size: var(--fs-xs);
  color: var(--muted);
  margin-top: var(--s-1);
}

/* ── Post chrome (post-trail above bespoke post body) ───── */
.vg-post-trail {
  display: flex; flex-wrap: wrap; gap: var(--s-3);
  align-items: baseline;
  padding-bottom: var(--s-2);
  margin-bottom: var(--s-4);
  border-bottom: 1px solid var(--line);
  font-family: var(--sans);
  font-size: var(--fs-sm);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  font-variant: small-caps;
  color: var(--muted);
}
.vg-post-trail-nav { margin-left: auto; display: flex; gap: var(--s-2); }
.vg-post-trail-nav a { color: var(--muted); }
.vg-post-trail-nav a:hover { color: var(--accent-text); }

/* ── Tags / topics chips ─────────────────────────────────── */
.vg-tag {
  font-family: var(--scribed);
  font-style: italic;
  color: var(--accent-text);
  padding: var(--s-1) 0.2rem;
  margin: calc(-1 * var(--s-1)) 0;
  text-decoration: none;
}
.vg-tag::before { content: "#"; }
.vg-tag:hover { color: var(--accent-hover); }
.vg-crumb-link {
  font-family: var(--sans);
  font-size: var(--fs-sm);
  letter-spacing: 0.10em;
  text-transform: uppercase;
  font-variant: small-caps;
  color: var(--ink-deep);
}
.vg-crumb-link:hover { color: var(--accent-text); }

/* ── Prose body inside posts ─────────────────────────────── */
.vg-post-body h1 {
  font-family: var(--serif);
  font-weight: 600;
  font-size: var(--fs-xl);
  line-height: 1.15;
  margin: 0 0 var(--s-3);
}
.vg-post-body h2 {
  font-family: var(--serif);
  font-weight: 600;
  font-size: var(--fs-lg);
  line-height: 1.2;
  margin: var(--s-4) 0 var(--s-2);
  color: var(--ink);
}
.vg-post-body h3 {
  font-family: var(--scribed);
  font-style: italic;
  font-size: var(--fs-md);
  margin: var(--s-3) 0 var(--s-2);
  color: var(--sage-deep);
}
.vg-post-body p { margin: 0 0 var(--s-3); }
.vg-post-body blockquote {
  border-left: 2px solid var(--accent);
  padding-left: var(--s-3);
  margin: var(--s-3) 0;
  font-family: var(--scribed);
  font-style: italic;
  color: var(--ink-soft);
}
.vg-post-body blockquote::before {
  content: "“";
  font-family: var(--display);
  font-size: var(--fs-2xl);
  color: var(--accent);
  line-height: 0;
  vertical-align: -0.4em;
  margin-right: var(--s-1);
}
.vg-post-body .vg-dropcap {
  float: left;
  font-family: var(--display);
  font-size: 4.5rem;
  line-height: 0.85;
  padding: 0.1rem var(--s-2) 0 0;
  color: var(--accent);
}
.vg-post-body code:not(pre code) {
  font-family: var(--mono);
  font-size: 0.92em;
  background: var(--bg-soft);
  padding: 0.05em 0.35em;
  border-radius: 2px;
}
.vg-post-body pre {
  font-family: var(--mono);
  font-size: var(--fs-sm);
  background: var(--bg-soft);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: var(--s-2) var(--s-3);
  overflow-x: auto;
  line-height: 1.55;
}

/* ── Share buttons (per-post footer) ─────────────────────── */
.vg-share {
  display: flex; gap: var(--s-3);
  margin: var(--s-4) 0;
  padding-top: var(--s-3);
  border-top: 1px solid var(--line);
  font-family: var(--scribed);
  font-style: italic;
  font-size: var(--fs-sm);
}
.vg-share a, .vg-share button {
  background: none; border: none; padding: 0;
  font: inherit; color: var(--muted); cursor: pointer;
  text-decoration: none;
}
.vg-share a:hover, .vg-share button:hover {
  color: var(--accent-text);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ── Read-tracking visual states ──────────────────────────── */
.vg-read {
  opacity: 0.55;
}
.vg-read .vg-card-title::before,
.vg-read.vg-post-title::before {
  content: "✓ ";
  font-family: var(--scribed);
  font-style: italic;
  color: var(--accent-text);
}
.vg-read-toggle {
  font-family: var(--scribed);
  font-style: italic;
  font-size: var(--fs-xs);
  color: var(--muted);
  background: none; border: none; padding: 0;
  cursor: pointer;
}
.vg-read-toggle:hover { color: var(--accent-text); }
```

- [ ] **Step 3: Verify CSS file size**

```bash
wc -l src/static/site.css
```

Expected: ~400 lines (significantly trimmed from km's 1592).

- [ ] **Step 4: Commit**

```bash
git add src/static/site.css
git commit -m "feat: design system css (tokens, components, dual-theme)"
```

---

## Task 7: Read-tracker script

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/static/read-tracker.js`

- [ ] **Step 1: Create `src/static/read-tracker.js`**

```javascript
// vatt-ghern read-tracker
// Pure localStorage. No network. No analytics. Per-post + per-roundup-item.
// Spec ref: docs/superpowers/specs/2026-05-16-vatt-ghern-design.md §6.4

(function () {
  const KEY = "vg-read";
  const DWELL_MS = 5000;
  const SCROLL_RATIO = 0.95;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { /* private mode / quota — silently no-op */ }
  }
  function isRead(state, key) { return state[key] === "read"; }
  function mark(state, key, value) {
    if (value) state[key] = "read";
    else delete state[key];
    save(state);
    applyVisuals(state);
  }

  function pathKey() {
    return location.pathname.replace(/\/?$/, "/");
  }

  function applyVisuals(state) {
    // Apply to per-post links / cards on listing pages.
    document.querySelectorAll("[data-vg-readkey]").forEach((el) => {
      const k = el.getAttribute("data-vg-readkey");
      el.classList.toggle("vg-read", isRead(state, k));
    });
    // Apply to current post body if marked.
    if (isRead(state, pathKey())) {
      document.querySelectorAll(".vg-post-title").forEach((el) => el.classList.add("vg-read"));
    }
    // Apply per-item state inside a roundup.
    document.querySelectorAll("[data-vg-readkey-item]").forEach((el) => {
      const k = el.getAttribute("data-vg-readkey-item");
      el.classList.toggle("vg-read", isRead(state, k));
    });
    // Update roundup progress (N / 10).
    document.querySelectorAll("[data-vg-progress-of]").forEach((el) => {
      const prefix = el.getAttribute("data-vg-progress-of");
      const items = Object.keys(state).filter((k) => k.startsWith(prefix) && k.includes("#item-"));
      const total = parseInt(el.getAttribute("data-vg-progress-total") || "10", 10);
      el.textContent = `${items.length} / ${total} 已閱`;
    });
  }

  function bindManualToggles(state) {
    document.querySelectorAll("[data-vg-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const k = btn.getAttribute("data-vg-toggle");
        mark(state, k, !isRead(state, k));
        btn.textContent = isRead(state, k) ? "↶ 標未閱" : "✓ 已閱";
      });
      const k = btn.getAttribute("data-vg-toggle");
      btn.textContent = isRead(state, k) ? "↶ 標未閱" : "✓ 已閱";
    });
  }

  function bindReset(state) {
    const reset = document.getElementById("vg-reset-read");
    if (!reset) return;
    reset.addEventListener("click", () => {
      if (!confirm("重置所有「已閱」狀態？")) return;
      try { localStorage.removeItem(KEY); } catch (e) {}
      Object.keys(state).forEach((k) => delete state[k]);
      applyVisuals(state);
      bindManualToggles(state);
    });
  }

  function bindAutoMark(state) {
    // Only on post pages — detect via meta marker on body.
    if (!document.body.classList.contains("vg-post-page")) return;
    const k = pathKey();
    if (isRead(state, k)) return;
    let dwelled = false;
    let scrolled = false;
    function maybeMark() {
      if (dwelled && scrolled && !isRead(state, k)) mark(state, k, true);
    }
    setTimeout(() => { dwelled = true; maybeMark(); }, DWELL_MS);
    window.addEventListener("scroll", () => {
      const doc = document.documentElement;
      const ratio = (doc.scrollTop + window.innerHeight) / doc.scrollHeight;
      if (ratio >= SCROLL_RATIO) { scrolled = true; maybeMark(); }
    }, { passive: true });
  }

  function bindCopyLink() {
    document.querySelectorAll("[data-vg-copy-link]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(location.href);
          const orig = btn.textContent;
          btn.textContent = "已複製 ✓";
          setTimeout(() => { btn.textContent = orig; }, 1500);
        } catch (e) { /* clipboard denied — no-op */ }
      });
    });
  }

  const state = load();
  document.addEventListener("DOMContentLoaded", () => {
    applyVisuals(state);
    bindManualToggles(state);
    bindReset(state);
    bindAutoMark(state);
    bindCopyLink();
  });
})();
```

- [ ] **Step 2: Commit**

```bash
git add src/static/read-tracker.js
git commit -m "feat: client-side read-tracker (localStorage, auto + manual)"
```

---

## Task 8: Base layout template

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/_includes/layouts/base.njk`

- [ ] **Step 1: Create `src/_includes/layouts/base.njk`**

```html
<!doctype html>
<html lang="{{ site.lang }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{% if title and title != site.name %}{{ title }} · {% endif %}{{ site.name }}</title>
  {% if summary %}<meta name="description" content="{{ summary }}">{% endif %}
  <link rel="alternate" type="application/atom+xml" href="/feed.xml" title="{{ site.name }} feed">
  <link rel="icon" type="image/png" href="/static/vg-sigil.png">
  <link rel="preload" as="image"
        href="/static/vg-sigil-80.webp" type="image/webp"
        imagesrcset="/static/vg-sigil-80.webp 1x, /static/vg-sigil-160.webp 2x">

  <link rel="stylesheet" href="/static/fonts.css">
  <link rel="stylesheet" href="/static/site.css">
  {% block head %}{% endblock %}

  <script>
    // Pre-paint theme — set data-theme before stylesheet computes, no FOUC.
    (function () {
      var stored;
      try { stored = localStorage.getItem("vg-theme"); } catch (e) {}
      var theme = stored ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", theme);
    })();
  </script>
</head>
<body class="{% block bodyClass %}{% endblock %}">
  <header class="vg-site-header">
    <a class="vg-home" href="/" aria-label="{{ site.name }} home">
      <img class="vg-sigil"
           src="/static/vg-sigil-80.webp"
           srcset="/static/vg-sigil-80.webp 1x, /static/vg-sigil-160.webp 2x"
           alt=""
           width="40" height="40"
           decoding="async"
           fetchpriority="high">
      <span class="vg-wordmark">
        <span class="vg-wordmark-1">{{ site.name }}</span>
        <span class="vg-wordmark-2">{{ site.subtitle }}</span>
      </span>
    </a>
    <span class="vg-spacer"></span>
    <nav class="vg-nav" aria-label="Site">
      {% for item in site.nav %}
        <a href="{{ item.href }}">{{ item.label }}</a>
        {% if not loop.last %}<span class="vg-sep" aria-hidden="true">·</span>{% endif %}
      {% endfor %}
      <span class="vg-sep" aria-hidden="true">·</span>
      <button id="vg-theme-toggle" aria-label="Toggle theme" type="button" title="切換 light / dark">
        <span class="vg-theme-icon" aria-hidden="true">◐</span>
      </button>
    </nav>
  </header>

  <main class="vg-main">
    {{ content | safe }}
  </main>

  <footer class="vg-site-footer">
    <span>{{ site.name }}</span>
    <span class="vg-sep" aria-hidden="true">·</span>
    <span>since {{ site.startedYear }}</span>
    <span class="vg-sep" aria-hidden="true">·</span>
    <button id="vg-reset-read">重置已閱狀態</button>
  </footer>

  <script>
    (function () {
      var btn = document.getElementById("vg-theme-toggle");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var cur = document.documentElement.getAttribute("data-theme") || "light";
        var next = cur === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        try { localStorage.setItem("vg-theme", next); } catch (e) {}
      });
    })();
  </script>
  <script src="/static/read-tracker.js" defer></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add src/_includes/layouts/base.njk
git commit -m "feat: base layout (header, footer, theme toggle, read-tracker)"
```

---

## Task 9: Post layout + share buttons partial

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/_includes/layouts/post.njk`
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/_includes/share-buttons.njk`

- [ ] **Step 1: Create `src/_includes/share-buttons.njk`**

```html
{# Share buttons partial. Usage:
   {% include "share-buttons.njk" %}
   Reads `title` and `page.url` from the calling page's context. #}
{% set shareUrl = site.url + page.url %}
{% set shareText = title %}
<aside class="vg-share" aria-label="分享這篇">
  <button type="button" data-vg-copy-link>複製連結</button>
  <a href="https://twitter.com/intent/tweet?text={{ shareText | urlencode }}&url={{ shareUrl | urlencode }}"
     target="_blank" rel="noopener">分享到 Twitter</a>
  <a href="https://www.threads.net/intent/post?text={{ shareText | urlencode }}%20{{ shareUrl | urlencode }}"
     target="_blank" rel="noopener">分享到 Threads</a>
</aside>
```

- [ ] **Step 2: Create `src/_includes/layouts/post.njk`**

```html
---
layout: layouts/base.njk
bodyClass: "vg-post-page"
---
<article class="vg-post"
         data-vg-readkey="{{ page.url }}">
  <nav class="vg-post-trail" aria-label="Post chrome">
    {% if topic %}<a class="vg-crumb-link" href="/topics/{{ topic }}/">{{ topicTitle or topic }}</a>{% endif %}
    <time datetime="{{ date | dateISO }}">{{ date | dateHuman }}</time>
    {% for tag in (tags | displayTags) %}
      <a class="vg-tag" href="/tags/{{ tag }}/">{{ tag }}</a>
    {% endfor %}
    <span class="vg-post-trail-nav">
      <button type="button" class="vg-read-toggle" data-vg-toggle="{{ page.url }}">✓ 已閱</button>
    </span>
  </nav>

  <div class="vg-post-body">
    {{ content | safe }}
  </div>

  {% include "share-buttons.njk" %}
</article>
```

- [ ] **Step 3: Commit**

```bash
git add src/_includes/layouts/post.njk src/_includes/share-buttons.njk
git commit -m "feat: post layout + share-buttons partial"
```

---

## Task 10: Posts directory defaults

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/posts/posts.11tydata.json`

- [ ] **Step 1: Create posts directory data file**

```bash
mkdir -p /Users/bluesky/arsenal/vatt-ghern/src/posts
```

Then create `src/posts/posts.11tydata.json`:

```json
{
  "layout": "layouts/post.njk",
  "tags": ["post"]
}
```

This applies `layout: layouts/post.njk` to all `src/posts/**/*.html` by default, and tags them `post` so collections filter works.

- [ ] **Step 2: Commit**

```bash
git add src/posts/posts.11tydata.json
git commit -m "feat: posts default frontmatter (layout, tag)"
```

---

## Task 11: Sample roundup post

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/posts/2026/05/16/roundup.html`
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/posts/2026/05/16/roundup.11tydata.json`

Note: HTML uses Latin em-dash `—` in §6.3 of spec is **banned in site prose** — use CJK 雙破折號 `——` or 中文標點 instead.

- [ ] **Step 1: Create directories**

```bash
mkdir -p /Users/bluesky/arsenal/vatt-ghern/src/posts/2026/05/16
```

- [ ] **Step 2: Create sidecar `roundup.11tydata.json`**

```json
{
  "title": "2026.05.16 — 今日 10 則（範例）",
  "date": "2026-05-16",
  "archetype": "daily-roundup",
  "topics": ["roundup"],
  "tags": ["sample", "roundup"],
  "sources": ["https://example.com/sample-source"],
  "news_ids": [
    "2026-05-16-01","2026-05-16-02","2026-05-16-03","2026-05-16-04","2026-05-16-05",
    "2026-05-16-06","2026-05-16-07","2026-05-16-08","2026-05-16-09","2026-05-16-10"
  ],
  "summary": "Phase 1 sample — 10 fictional items to validate the roundup archetype design.",
  "estimated_read_min": 3
}
```

- [ ] **Step 3: Create `roundup.html`**

```html
<header class="vg-roundup-hero">
  <h1 class="vg-post-title">{{ title }}</h1>
  <p class="vg-roundup-lede">今日主旋律：這是一篇 Phase 1 範例文，用 10 則虛構新聞驗證 roundup archetype 的設計、間距與深色 / 淺色雙模渲染。</p>
</header>

<section class="vg-roundup-stats" aria-label="今日統計">
  <svg viewBox="0 0 240 120" role="img" aria-label="領域分布" style="max-width: 240px;">
    <!-- Simple donut placeholder using currentColor; replace with real data later. -->
    <circle cx="60" cy="60" r="40" fill="none" stroke="var(--muted-2)" stroke-width="14"/>
    <circle cx="60" cy="60" r="40" fill="none" stroke="var(--accent)" stroke-width="14"
            stroke-dasharray="100 251" transform="rotate(-90 60 60)"/>
    <text x="60" y="65" text-anchor="middle" font-family="EB Garamond, serif"
          font-style="italic" font-size="14" fill="var(--ink)">10</text>
    <text x="130" y="40" font-family="Manrope, sans-serif" font-size="9"
          fill="var(--muted)" letter-spacing="0.1em">AI · 3</text>
    <text x="130" y="56" font-family="Manrope, sans-serif" font-size="9"
          fill="var(--muted)" letter-spacing="0.1em">SYSTEMS · 3</text>
    <text x="130" y="72" font-family="Manrope, sans-serif" font-size="9"
          fill="var(--muted)" letter-spacing="0.1em">INFRA · 2</text>
    <text x="130" y="88" font-family="Manrope, sans-serif" font-size="9"
          fill="var(--muted)" letter-spacing="0.1em">STORAGE · 1</text>
    <text x="130" y="104" font-family="Manrope, sans-serif" font-size="9"
          fill="var(--muted)" letter-spacing="0.1em">INDUSTRY · 1</text>
  </svg>
</section>

<section class="vg-roundup-list" aria-label="今日 10 則">
  <span data-vg-progress-of="{{ page.url }}#item-" data-vg-progress-total="10"
        class="vg-card-progress">0 / 10 已閱</span>

  <article class="vg-card vg-card-roundup" id="item-01"
           data-vg-readkey-item="{{ page.url }}#item-01">
    <span class="vg-card-roundup-num">#01</span>
    <div>
      <h2 class="vg-card-title">範例新聞一：AI 領域虛構大事</h2>
      <p class="vg-card-lede">這是一則範例新聞的兩三句說明，描述發生了什麼、為什麼工程師該看。實際 routine 寫的內容會替換掉這段。</p>
      <p><a href="https://example.com">原文 →</a> · <a class="vg-tag" href="/tags/sample/">sample</a></p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-02"
           data-vg-readkey-item="{{ page.url }}#item-02">
    <span class="vg-card-roundup-num">#02</span>
    <div>
      <h2 class="vg-card-title">範例新聞二：系統語言 RFC 提案</h2>
      <p class="vg-card-lede">這則用來示意 Systems 領域的條目樣式，搭配深入閱讀的 cross-link。</p>
      <p><a href="https://example.com">原文 →</a> · <a href="/2026/05/16/deep-sample/">深入閱讀 ↗</a></p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-03"
           data-vg-readkey-item="{{ page.url }}#item-03">
    <span class="vg-card-roundup-num">#03</span>
    <div>
      <h2 class="vg-card-title">範例新聞三：分散式系統演進</h2>
      <p class="vg-card-lede">Infra / 分散式案例。</p>
      <p><a href="https://example.com">原文 →</a></p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-04"
           data-vg-readkey-item="{{ page.url }}#item-04">
    <span class="vg-card-roundup-num">#04</span>
    <div>
      <h2 class="vg-card-title">範例新聞四:儲存架構新進展</h2>
      <p class="vg-card-lede">Storage 案例。</p>
      <p><a href="https://example.com">原文 →</a></p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-05"
           data-vg-readkey-item="{{ page.url }}#item-05">
    <span class="vg-card-roundup-num">#05</span>
    <div>
      <h2 class="vg-card-title">範例新聞五:業界大事</h2>
      <p class="vg-card-lede">Industry 案例。</p>
      <p><a href="https://example.com">原文 →</a></p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-06"
           data-vg-readkey-item="{{ page.url }}#item-06">
    <span class="vg-card-roundup-num">#06</span>
    <div>
      <h2 class="vg-card-title">範例新聞六:AI 應用</h2>
      <p class="vg-card-lede">AI 案例。</p>
      <p><a href="https://example.com">原文 →</a></p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-07"
           data-vg-readkey-item="{{ page.url }}#item-07">
    <span class="vg-card-roundup-num">#07</span>
    <div>
      <h2 class="vg-card-title">範例新聞七:Systems 案例</h2>
      <p class="vg-card-lede">系統案例。</p>
      <p><a href="https://example.com">原文 →</a></p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-08"
           data-vg-readkey-item="{{ page.url }}#item-08">
    <span class="vg-card-roundup-num">#08</span>
    <div>
      <h2 class="vg-card-title">範例新聞八:AI</h2>
      <p class="vg-card-lede">案例。</p>
      <p><a href="https://example.com">原文 →</a></p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-09"
           data-vg-readkey-item="{{ page.url }}#item-09">
    <span class="vg-card-roundup-num">#09</span>
    <div>
      <h2 class="vg-card-title">範例新聞九:Infra</h2>
      <p class="vg-card-lede">案例。</p>
      <p><a href="https://example.com">原文 →</a></p>
    </div>
  </article>

  <article class="vg-card vg-card-roundup" id="item-10"
           data-vg-readkey-item="{{ page.url }}#item-10">
    <span class="vg-card-roundup-num">#10</span>
    <div>
      <h2 class="vg-card-title">範例新聞十:Systems</h2>
      <p class="vg-card-lede">案例。</p>
      <p><a href="https://example.com">原文 →</a></p>
    </div>
  </article>
</section>

<section class="vg-roundup-deep" aria-label="今日深入文章">
  <h2>今日深入文章</h2>
  <a class="vg-card vg-card-deep" href="/2026/05/16/deep-sample/"
     data-vg-readkey="/2026/05/16/deep-sample/">
    <h3 class="vg-card-title">範例深度文：把第二則新聞挖深</h3>
    <p class="vg-card-lede">opener → 三幕 → closer 結構的示範。</p>
  </a>
</section>
```

- [ ] **Step 4: Commit**

```bash
git add src/posts/2026/05/16/roundup.html src/posts/2026/05/16/roundup.11tydata.json
git commit -m "content: sample roundup post (2026-05-16)"
```

---

## Task 12: Sample deep-story post

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/posts/2026/05/16/deep-sample.html`
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/posts/2026/05/16/deep-sample.11tydata.json`

- [ ] **Step 1: Create sidecar `deep-sample.11tydata.json`**

```json
{
  "title": "範例深度文：把第二則挖深（Phase 1 sample）",
  "date": "2026-05-16",
  "archetype": "daily-deep-story",
  "topics": ["systems"],
  "tags": ["sample", "deep-story"],
  "sources": ["https://example.com/deep-source"],
  "news_ids": ["2026-05-16-02"],
  "related_roundup": "/2026/05/16/roundup/",
  "summary": "opener → 三幕 → closer 範例，用來驗證 deep-story archetype 的視覺密度與 widget 整合。",
  "estimated_read_min": 6
}
```

- [ ] **Step 2: Create `deep-sample.html`**

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">凌晨三點。值班工程師接到通知，畫面上只有六個字——「no upstream available」。但 upstream 明明在那裡。</p>
  <h1 class="vg-post-title">{{ title }}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">這</span>是一篇 Phase 1 範例 deep-story，用來驗證 archetype 的視覺密度、SVG widget 的暗深淺雙模渲染、與閱讀節奏。實際 routine 寫的內容會替換掉這段，但結構維持 opener → 三幕 → closer。</p>

  <h2>幕一:發生了什麼</h2>

  <p>第二則新聞的事實陳述，配合一個簡單的 SVG timeline 視覺化。下方時間軸示意三個關鍵時刻——T0 commit、T1 deploy、T2 incident。</p>

  <figure aria-label="事件時序">
    <svg viewBox="0 0 480 80" role="img" style="width: 100%; height: auto;">
      <line x1="20" y1="40" x2="460" y2="40" stroke="var(--muted-2)" stroke-width="1"/>
      <g font-family="EB Garamond, serif" font-style="italic" font-size="11" fill="var(--ink)">
        <circle cx="60" cy="40" r="5" fill="var(--accent)"/>
        <text x="60" y="65" text-anchor="middle">T0 commit</text>
        <circle cx="240" cy="40" r="5" fill="var(--accent)"/>
        <text x="240" y="65" text-anchor="middle">T1 deploy</text>
        <circle cx="420" cy="40" r="5" fill="var(--accent)"/>
        <text x="420" y="65" text-anchor="middle">T2 incident</text>
      </g>
      <g font-family="Manrope, sans-serif" font-size="9" fill="var(--muted)" letter-spacing="0.08em">
        <text x="150" y="32" text-anchor="middle">3 小時</text>
        <text x="330" y="32" text-anchor="middle">14 分鐘</text>
      </g>
    </svg>
  </figure>

  <blockquote>
    「我們以為 health-check 會抓到，但 health-check 只看 TCP 通不通——不看 upstream 是不是回 500。」
  </blockquote>

  <h2>幕二:為什麼重要</h2>

  <p>技術背景。配上第二個 SVG widget——這次是一個架構示意，顯示 reverse proxy → health-check → upstream pool 的關係。</p>

  <figure aria-label="架構示意">
    <svg viewBox="0 0 480 200" role="img" style="width: 100%; height: auto;">
      <g fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="20" y="80" width="100" height="40" rx="4"/>
        <rect x="180" y="20" width="120" height="40" rx="4"/>
        <rect x="180" y="140" width="120" height="40" rx="4" stroke="var(--accent)"/>
        <rect x="360" y="80" width="100" height="40" rx="4"/>
        <line x1="120" y1="100" x2="180" y2="40"/>
        <line x1="120" y1="100" x2="180" y2="160"/>
        <line x1="300" y1="40" x2="360" y2="100"/>
        <line x1="300" y1="160" x2="360" y2="100"/>
      </g>
      <g font-family="Manrope, sans-serif" font-size="11" fill="var(--ink)" text-anchor="middle">
        <text x="70" y="105">client</text>
        <text x="240" y="45">healthy upstream</text>
        <text x="240" y="165" fill="var(--accent-text)">misbehaving upstream</text>
        <text x="410" y="105">backend pool</text>
      </g>
    </svg>
  </figure>

  <p>一段配置範例:</p>

  <pre><code>upstream backend {
  server 10.0.0.1:8080;
  server 10.0.0.2:8080;  # 這台 TCP 通，但回 500
}
location / {
  proxy_pass http://backend;
  # 只看 connect/timeout，沒檢查狀態碼
  proxy_next_upstream error timeout;
}</code></pre>

  <p>關鍵在那一行 <code>proxy_next_upstream</code>——預設只 retry connect 錯誤和 timeout，不會 retry 500。對應到生產上，那台 misbehaving upstream 就會無止盡地接到流量。</p>

  <h2>幕三:延伸與思考</h2>

  <p>影響範圍、產業脈動、延伸閱讀。這是把單一事件拉到 industry pattern 的環節。</p>

  <p>這類「health-check 在錯的層級」的問題，並不是哪家公司獨有——只要你的 reverse proxy 預設行為被信任、又沒人去看細項配置，就會撞到。</p>

  <p>延伸閱讀：</p>
  <ul>
    <li>對應今日 roundup：<a href="/2026/05/16/roundup/#item-02">#02 範例新聞二</a></li>
  </ul>

  <p class="vg-deep-closer"><strong>Take-away</strong>：當 health-check 通過但服務還是掛——問題在「通過」的定義太鬆。下次 review reverse proxy 配置時，把 <code>proxy_next_upstream</code> 拉出來看一眼。</p>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/posts/2026/05/16/deep-sample.html src/posts/2026/05/16/deep-sample.11tydata.json
git commit -m "content: sample deep-story post (2026-05-16)"
```

---

## Task 13: Homepage (daily timeline)

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/index.njk`

- [ ] **Step 1: Create `src/index.njk`**

```njk
---
layout: layouts/base.njk
title: vatt'ghern
permalink: /
---
{% set days = collections.daysWithPosts %}
{% if days.length > 0 %}
  {% set today = days[0] %}
  {% set past = days.slice(1) %}

  <section class="vg-today-hero">
    <div class="vg-today-date">{{ today.date | dateMD }}</div>
    <div class="vg-today-grid">
      {% for post in today.posts %}
        {% if post.data.archetype == "daily-roundup" %}
          <a class="vg-card vg-card-roundup"
             href="{{ post.url }}"
             data-vg-readkey="{{ post.url }}">
            <span class="vg-card-roundup-num">總覽</span>
            <div>
              <h2 class="vg-card-title">{{ post.data.title }}</h2>
              <p class="vg-card-lede">{{ post.data.summary }}</p>
              <p class="vg-card-progress"
                 data-vg-progress-of="{{ post.url }}#item-"
                 data-vg-progress-total="{{ post.data.news_ids.length }}">0 / {{ post.data.news_ids.length }} 已閱</p>
            </div>
          </a>
        {% else %}
          <a class="vg-card vg-card-deep"
             href="{{ post.url }}"
             data-vg-readkey="{{ post.url }}">
            <h3 class="vg-card-title">{{ post.data.title }}</h3>
            <p class="vg-card-lede">{{ post.data.summary }}</p>
          </a>
        {% endif %}
      {% endfor %}
    </div>
  </section>

  {% if past.length > 0 %}
    {% set weeks = past | groupByWeek %}
    {% for week in weeks %}
      <section class="vg-week-section">
        <h2 class="vg-week-label">{{ week.weekLabel }}</h2>
        {% for day in week.days %}
          <div class="vg-day-row">
            <span class="vg-day-date">{{ day.date | dateMD }}</span>
            <div class="vg-day-posts">
              {% for p in day.posts %}
                <a href="{{ p.url }}" data-vg-readkey="{{ p.url }}">{{ p.data.title }}</a>
                {% if not loop.last %} · {% endif %}
              {% endfor %}
            </div>
          </div>
        {% endfor %}
      </section>
    {% endfor %}
  {% endif %}
{% else %}
  <section class="vg-empty">
    <p>還沒有任何 daily news。</p>
  </section>
{% endif %}
```

- [ ] **Step 2: Build and inspect output**

```bash
npx @11ty/eleventy
```

Expected: exit 0. Check `_site/index.html` exists and has the today hero + sample post links.

```bash
ls _site/
```

Expected files include: `index.html`, `static/`, `posts/`.

- [ ] **Step 3: Commit**

```bash
git add src/index.njk
git commit -m "feat: homepage daily timeline"
```

---

## Task 14: Archive, tags, topics, 404, feed pages

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/archive.njk`
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/tags.njk`
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/topics.njk`
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/404.njk`
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/feed.xml.njk`

- [ ] **Step 1: Create `src/archive.njk`**

```njk
---
layout: layouts/base.njk
title: 歷史
permalink: /archive/
---
<section>
  <h1>歷史</h1>
  <p>所有 daily news，依日期排序。</p>
  {% for day in collections.daysWithPosts %}
    <div class="vg-day-row">
      <span class="vg-day-date">{{ day.date | dateMD }}</span>
      <div class="vg-day-posts">
        {% for p in day.posts %}
          <a href="{{ p.url }}" data-vg-readkey="{{ p.url }}">{{ p.data.title }}</a>
          {% if not loop.last %} · {% endif %}
        {% endfor %}
      </div>
    </div>
  {% endfor %}
</section>
```

- [ ] **Step 2: Create `src/tags.njk`**

```njk
---
layout: layouts/base.njk
title: 標籤
permalink: /tags/
---
<section>
  <h1>標籤</h1>
  <ul>
    {% for entry in collections.tagList %}
      <li><a class="vg-tag" href="/tags/{{ entry.tag }}/">{{ entry.tag }}</a> <span>({{ entry.count }})</span></li>
    {% endfor %}
  </ul>
</section>
```

- [ ] **Step 3: Create `src/topics.njk`**

```njk
---
layout: layouts/base.njk
title: 主題
permalink: /topics/
---
<section>
  <h1>主題</h1>
  <ul>
    {% for t in collections.topics %}
      <li><a class="vg-crumb-link" href="/topics/{{ t.slug }}/">{{ t.title }}</a> <span>({{ t.posts.length }})</span></li>
    {% endfor %}
  </ul>
</section>
```

- [ ] **Step 4: Create `src/404.njk`**

```njk
---
layout: layouts/base.njk
title: 找不到
permalink: /404.html
eleventyExcludeFromCollections: true
---
<section>
  <h1>找不到。</h1>
  <p>這條路徑不存在。回 <a href="/">今日</a>看看。</p>
</section>
```

- [ ] **Step 5: Create `src/feed.xml.njk`**

```njk
---
permalink: /feed.xml
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>{{ site.name }}</title>
  <subtitle>{{ site.subtitle }}</subtitle>
  <link href="{{ site.url }}/feed.xml" rel="self"/>
  <link href="{{ site.url }}/"/>
  <updated>{{ collections.posts | getNewestCollectionItemDate | dateToRfc3339 }}</updated>
  <id>{{ site.url }}/</id>
  {% for post in collections.posts | take(20) %}
    <entry>
      <title>{{ post.data.title }}</title>
      <link href="{{ site.url }}{{ post.url }}"/>
      <updated>{{ post.data.date | dateToRfc3339 }}</updated>
      <id>{{ site.url }}{{ post.url }}</id>
      <summary>{{ post.data.summary }}</summary>
    </entry>
  {% endfor %}
</feed>
```

- [ ] **Step 6: Build and verify**

```bash
npx @11ty/eleventy
```

Expected: exit 0. Verify outputs:

```bash
ls _site/archive/ _site/tags/ _site/topics/ _site/404.html _site/feed.xml
```

All should exist.

- [ ] **Step 7: Commit**

```bash
git add src/archive.njk src/tags.njk src/topics.njk src/404.njk src/feed.xml.njk
git commit -m "feat: archive, tags, topics, 404, RSS feed pages"
```

---

## Task 15: Archetype skeletons (for Phase 2 skill reference)

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/archetypes/daily-roundup.html`
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/archetypes/daily-roundup.11tydata.json`
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/archetypes/daily-deep-story.html`
- Create: `/Users/bluesky/arsenal/vatt-ghern/src/archetypes/daily-deep-story.11tydata.json`

These are skeleton templates with placeholder markers that the Phase 2 skill will fill in. They're excluded from the published site.

- [ ] **Step 1: Create archetype directory data**

```bash
mkdir -p /Users/bluesky/arsenal/vatt-ghern/src/archetypes
```

Create `src/archetypes/archetypes.11tydata.json`:

```json
{
  "eleventyExcludeFromCollections": true,
  "permalink": false
}
```

- [ ] **Step 2: Create `src/archetypes/daily-roundup.html`**

Copy from the sample roundup but replace the 10 items with a single template-comment-marked example item the skill can replicate, and replace lede/title with `{{ TODO_TITLE }}` / `{{ TODO_LEDE }}` markers:

```html
<!-- ARCHETYPE: daily-roundup
     Skill: fill in TITLE, LEDE, STATS_WIDGET (SVG), 10 ITEM cards,
     and deep-story PREVIEW cards. Each item must have id="item-NN"
     and data-vg-readkey-item attribute.
-->
<header class="vg-roundup-hero">
  <h1 class="vg-post-title">{{ TODO_TITLE }}</h1>
  <p class="vg-roundup-lede">{{ TODO_LEDE }}</p>
</header>

<section class="vg-roundup-stats" aria-label="今日統計">
  <!-- TODO_STATS_SVG: inline SVG donut (domain distribution) -->
</section>

<section class="vg-roundup-list" aria-label="今日新聞">
  <span data-vg-progress-of="{{ page.url }}#item-" data-vg-progress-total="{{ TODO_TOTAL }}"
        class="vg-card-progress">0 / {{ TODO_TOTAL }} 已閱</span>

  <!-- TODO_ITEMS: repeat the following article block for each news item.
       Use id="item-NN" (zero-padded), data-vg-readkey-item, and stable structure. -->
  <article class="vg-card vg-card-roundup" id="item-NN"
           data-vg-readkey-item="{{ page.url }}#item-NN">
    <span class="vg-card-roundup-num">#NN</span>
    <div>
      <h2 class="vg-card-title">TODO_ITEM_TITLE</h2>
      <p class="vg-card-lede">TODO_ITEM_LEDE</p>
      <p><a href="TODO_SOURCE_URL">原文 →</a></p>
    </div>
  </article>
</section>

<section class="vg-roundup-deep" aria-label="今日深入文章">
  <h2>今日深入文章</h2>
  <!-- TODO_DEEP_PREVIEWS: one vg-card-deep anchor per deep-story -->
</section>
```

- [ ] **Step 3: Create `src/archetypes/daily-roundup.11tydata.json`**

```json
{
  "title": "ARCHETYPE: daily-roundup (template)",
  "archetype_template": true
}
```

- [ ] **Step 4: Create `src/archetypes/daily-deep-story.html`**

```html
<!-- ARCHETYPE: daily-deep-story
     Structure: opener → drop-cap intro → Act 1/2/3 → closer
     Required: ≥2 inline SVG widgets, dark-mode tokens only.
-->
<header class="vg-deep-hero">
  <p class="vg-deep-opener">TODO_OPENER_HOOK</p>
  <h1 class="vg-post-title">{{ TODO_TITLE }}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">TODO_FIRST_CHAR</span>TODO_DROPCAP_PARAGRAPH</p>

  <h2>幕一:發生了什麼</h2>
  <!-- TODO_ACT1_PROSE -->
  <!-- TODO_TIMELINE_OR_SEQUENCE_SVG (widget #1) -->
  <!-- TODO_OPTIONAL_BLOCKQUOTE -->

  <h2>幕二:為什麼重要</h2>
  <!-- TODO_ACT2_PROSE -->
  <!-- TODO_ARCHITECTURE_OR_DATA_SVG (widget #2) -->
  <!-- TODO_OPTIONAL_CODE_BLOCK -->

  <h2>幕三:延伸與思考</h2>
  <!-- TODO_ACT3_PROSE -->
  <!-- TODO_RELATED_READING_LIST -->

  <p class="vg-deep-closer"><strong>Take-away</strong>:TODO_TAKEAWAY</p>
</div>
```

- [ ] **Step 5: Create `src/archetypes/daily-deep-story.11tydata.json`**

```json
{
  "title": "ARCHETYPE: daily-deep-story (template)",
  "archetype_template": true
}
```

- [ ] **Step 6: Verify archetypes excluded from site output**

```bash
npx @11ty/eleventy
ls _site/archetypes 2>&1
```

Expected: `ls: ... No such file or directory` — confirming archetypes are not written to `_site/`.

- [ ] **Step 7: Commit**

```bash
git add src/archetypes/
git commit -m "feat: archetype skeleton templates (for Phase 2 skill reference)"
```

---

## Task 16: GitHub Actions quality gate

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/.github/workflows/quality.yml`

- [ ] **Step 1: Create workflow directory**

```bash
mkdir -p /Users/bluesky/arsenal/vatt-ghern/.github/workflows
```

- [ ] **Step 2: Create `.github/workflows/quality.yml`**

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
```

Phase 1 ships only these two checks. `link-check.mjs` and `archetype-check.mjs` ship in Phase 2.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/quality.yml
git commit -m "ci: github actions quality gate (build + html-validate)"
```

---

## Task 17: html-validate config

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/.htmlvalidate.json`

- [ ] **Step 1: Create `.htmlvalidate.json`**

```json
{
  "extends": ["html-validate:recommended"],
  "rules": {
    "no-inline-style": "off",
    "wcag/h32": "off",
    "no-trailing-whitespace": "off"
  }
}
```

Inline `style="..."` is allowed on SVG widgets (sizing). WCAG `h32` (form submit) doesn't apply to a no-form blog. Trailing whitespace is too noisy for hand-edited posts.

- [ ] **Step 2: Run html-validate**

```bash
npm run build && npm run lint:html
```

Expected: exit 0, no errors. If errors appear, fix the offending HTML in the relevant template/post and re-run.

- [ ] **Step 3: Commit**

```bash
git add .htmlvalidate.json
git commit -m "ci: html-validate config"
```

---

## Task 18: README + PRODUCT + DESIGN docs

**Files:**
- Create: `/Users/bluesky/arsenal/vatt-ghern/README.md`
- Create: `/Users/bluesky/arsenal/vatt-ghern/PRODUCT.md`
- Create: `/Users/bluesky/arsenal/vatt-ghern/DESIGN.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# vatt-ghern

Public personal tech blog. Daily news authored by Claude routine. Hosted on
Cloudflare Pages.

- Live: https://vatt-ghern.pages.dev
- Codename: vatt'ghern (Elder Speech for "witcher")
- Sibling project: kaer-morhen (internal wiki; not a content source)

## Setup

```shell
nvm use            # node 20 per .nvmrc
npm install
npm run dev        # http://localhost:8080
```

## Build

```shell
npm run build      # writes _site/
npm run lint:html  # validates _site/**/*.html
```

## Deploy

Cloudflare Pages auto-builds:
- `main` → production at vatt-ghern.pages.dev
- PR / non-main branch → preview build, URL posted as PR comment

GitHub Actions runs `quality.yml` (build + html-validate) on PR.

## Sigil

Source PNG: `src/static/vg-sigil.png`. To regenerate webp variants:

```shell
npm run sigil
```

## Phase

This is Phase 1 (site shell). Phase 2 adds the daily-news skill. Phase 3
adds Claude Routine automation. See
`docs/superpowers/specs/2026-05-16-vatt-ghern-design.md` for the full plan.

## License

Personal project. © 2026 tonyhu. No broader license granted.
```

- [ ] **Step 2: Create `PRODUCT.md`**

```markdown
# vatt-ghern — product context

## What this is

A public personal tech blog where daily news for engineers is curated and
storied by a Claude routine. Each day publishes:

- **1× daily-roundup** — a 10-item index for 3-minute scan.
- **3× daily-deep-story** — long-form storytelling drilling into three of
  those 10 items, with inline SVG widgets, designed for engineers to read
  and *learn from*.

Content is bespoke HTML (custom layouts, inline visualizations), not
template fill-ins. The framework exists to organize and deploy.

## Users

**Primary**: Tony — daily tech news from a single trusted source,
filtered through a senior-tech-lead lens, with depth where the depth is
warranted.

**Secondary**: Engineers who find the site through links. They arrive
for the topic, not for the brand.

## Voice

- **Measured** — findings stated plainly, hedges honest.
- **Curious** — investigative posture; deep-stories open with a question
  or an anomaly, not a marketing hook.
- **Materially-rooted** — concrete examples, real RFCs, real CVE numbers.

## Language

純繁體中文 prose. English technical terms preserved unchanged. CJK
雙破折號 `——` allowed; Latin single em-dash `—` banned in site prose
(see DESIGN.md punctuation rule).

## Anti-references

- Not a Substack/Medium personal-brand blog.
- Not a tech-startup blog.
- Not a generic SSG demo.
- Not maximalist editorial magazine.
- Not terminal-aesthetic developer blog.
```

- [ ] **Step 3: Create `DESIGN.md`**

```markdown
# vatt-ghern — design system

Mirrors kaer-morhen's design system (Anthropic-aligned editorial). This
doc covers vatt-ghern's specifics; for the deep design rationale, see
kaer-morhen's DESIGN.md.

## Color (OKLCH, dual-theme)

See `src/static/site.css` for token values. Same hues as kaer-morhen:
warm neutrals (65–80), terracotta accent (38), ink-deep blue (245),
sage green (150). Only lightness swaps between light and dark.

## Theme system

`<html data-theme="light|dark">` set pre-paint by inline script reading
`localStorage["vg-theme"]` or `prefers-color-scheme`. Toggle button in
nav.

## Typography

| Role | Family |
|---|---|
| Body Latin | Spectral |
| Body CJK | LXGW WenKai TC (霞鶩文楷) |
| Display | EB Garamond |
| Scribed | IM Fell English Italic |
| Sans (labels/nav) | Manrope |
| Code | JetBrains Mono |

## Wordmark

`vatt'ghern` (display) + `jaskier's ballads` (scribed italic, ink-deep).
Mirrors kaer-morhen's `vatt'ghern's archive`: the fortress + the poet's
archive there; the witcher + the poet's ballads here.

## Sigil

Phase 1: reuses km wolf medallion as placeholder. Future: dedicated
witcher sigil. Build pipeline: `scripts/build-sigil.mjs` produces
`vg-sigil-{80,160,320,640}.webp` from `vg-sigil.png`.

## Punctuation

- CJK 雙破折號 `——` allowed (zh-Hant first override of brand.md).
- Latin single em-dash `—` **banned in site prose** (use `：`, `，`,
  `；`, or `（…）`). Engineering docs, code comments, and READMEs are
  exempt.

## Read-tracking

Per-post and per-roundup-item read state in `localStorage["vg-read"]`.
Auto-mark on scroll-to-bottom + ≥5s dwell. Manual toggle on each post.
Footer "重置已閱狀態" clears all.

Implementation: `src/static/read-tracker.js`.

## Layout

- `--col-narrow: min(64ch, 100% - 2 * var(--gutter))` for prose.
- `--col-wide: min(78ch, ...)` for listings.
- Main: `min(1080px, ...)` so bespoke posts can stretch.

## Components

- Site header: sigil + double-line wordmark + nav (`今日 · 歷史 · 主題 · 標籤 · feed · theme`).
- Site footer: one-line metadata + "重置已閱狀態" link.
- Roundup card: large `#NN` numeral + title + lede + meta.
- Deep-story card: top hairline + title + lede.
- Post-trail: chrome strip with topic crumb, date, tags, read-toggle.
- Share buttons: copy link + Twitter + Threads, IM Fell italic text links.
```

- [ ] **Step 4: Commit**

```bash
git add README.md PRODUCT.md DESIGN.md
git commit -m "docs: README, PRODUCT, DESIGN (v1)"
```

---

## Task 19: End-to-end local verification

This is a manual exit-criteria check before push.

- [ ] **Step 1: Clean rebuild**

```bash
npm run clean && npm run build
```

Expected: exit 0.

- [ ] **Step 2: Run html-validate**

```bash
npm run lint:html
```

Expected: 0 errors.

- [ ] **Step 3: Start dev server**

```bash
npm run dev
```

Expected: server listens on http://localhost:8080.

- [ ] **Step 4: Manually verify in browser**

Open http://localhost:8080 and check:
- Homepage shows today (2026-05-16) hero with 2 cards (roundup + deep-sample)
- Roundup card shows "0 / 10 已閱" progress indicator
- Click into roundup — 10 items render with #NN numerals
- Click "✓ 已閱" on item #03 — opacity drops, `✓ ` marker appears before title
- Refresh page — state persists (item #03 still marked)
- Navigate back to homepage — roundup progress shows "1 / 10 已閱"
- Open deep-sample — scroll to bottom, wait 5+ seconds — top-of-page title gains `✓` marker (verify in localStorage devtools)
- Toggle theme (◐ button in nav) — colors swap, no FOUC on reload
- Click footer "重置已閱狀態" — confirm dialog, then all states clear
- Visit /archive/, /tags/, /topics/, /feed.xml — all render
- Visit /nonexistent-page → 404 page renders correctly (note: 404 only triggers under Cloudflare, locally Eleventy may not serve it)

- [ ] **Step 5: Stop dev server (Ctrl-C)**

- [ ] **Step 6: Verify final build size is reasonable**

```bash
du -sh _site/
```

Expected: <50MB (mostly fonts).

---

## Task 20: Push to GitHub, connect Cloudflare Pages, verify live URL

This task involves external services — Tony executes the dashboard parts.

- [ ] **Step 1: Create GitHub repo (Tony, manual)**

In GitHub web UI: create new public repo named `vatt-ghern`. Do NOT add README/license (we have them locally). Note the SSH/HTTPS URL.

- [ ] **Step 2: Add remote and push**

```bash
git remote add origin git@github.com:<your-username>/vatt-ghern.git
git branch -M main
git push -u origin main
```

Expected: push succeeds. GitHub Actions `Quality Gate` workflow appears in the Actions tab and runs (should pass — same build verified locally).

- [ ] **Step 3: Set repo to auto-delete head branches on merge (Tony, manual)**

In GitHub repo Settings → General → "Automatically delete head branches" → enable. Prepares Phase 3's `daily/YYYY-MM-DD` cleanup.

- [ ] **Step 4: Connect Cloudflare Pages (Tony, manual)**

In Cloudflare dashboard:
1. Workers & Pages → Create → Pages → Connect to Git
2. Authorize GitHub, pick `vatt-ghern` repo
3. Setup build:
   - Production branch: `main`
   - Build command: `npm ci && npx @11ty/eleventy`
   - Build output directory: `_site`
   - Root directory: `/`
   - Environment variables: `NODE_VERSION=20`
4. Save and deploy

Expected: first build runs, takes ~2 minutes, succeeds. URL appears in dashboard (something like `https://vatt-ghern.pages.dev`).

- [ ] **Step 5: Enable Cloudflare Web Analytics (Tony, manual)**

In Cloudflare dashboard for this Pages project:
- Settings → Analytics → enable Web Analytics
- Confirm "Don't show banner" for cookieless analytics

No code changes needed. Analytics inject automatically.

- [ ] **Step 6: Visit live URL and verify**

Open `https://vatt-ghern.pages.dev` (or whatever URL Cloudflare assigned) and re-run Task 19 Step 4 checks. Especially confirm:
- Fonts load (no FOUT)
- Sigil image loads
- Dark/light toggle works
- Reading-tracking persists across refresh

- [ ] **Step 7: Test PR preview pipeline**

```bash
git checkout -b test/preview-verify
# Edit src/index.njk: add a comment line at top
git commit -am "test: verify preview pipeline"
git push -u origin test/preview-verify
gh pr create --title "test: preview pipeline" --body "Verifying Cloudflare PR preview deploy"
```

Expected:
- GitHub Actions runs (passes)
- Cloudflare bot comments PR with preview URL (something like `https://<hash>.vatt-ghern.pages.dev`)
- Preview URL loads correctly

After verification:
```bash
gh pr close --delete-branch test/preview-verify
```

- [ ] **Step 8: Phase 1 done — commit final state**

If anything was tweaked during verification, commit those fixes. Otherwise nothing to commit.

```bash
git log --oneline | head -25
```

Expected: ~20 commits representing the tasks above, ending at the Phase 1 deliverable state.

---

## Self-Review

Spec coverage walk-through against `2026-05-16-vatt-ghern-design.md`:

- §1 What this is → Task 11+12 (sample posts validate the dual-archetype model) ✓
- §2 Relationship to km → Tasks 4, 6 (sigil reuse, css port) ✓
- §3 Voice/language → PRODUCT.md (Task 18) ✓
- §4 Architecture diagram → All tasks together realize the static-site half; Phase 2 will add the routine→skill half ✓
- §5 Repository structure → Tasks 1, 2 establish; sample posts follow `src/posts/YYYY/MM/DD/` ✓
- §6.1 daily-roundup archetype → Tasks 11, 15 ✓
- §6.2 daily-deep-story archetype → Tasks 12, 15 ✓
- §6.3 Shared conventions (sidecar JSON, news_id, dark-mode, no tracking) → Tasks 11, 12 demonstrate; CF Analytics in Task 20 step 5 ✓
- §6.4 Read-tracking → Tasks 7, 8 (script + footer hook), 11 (per-item ids), 13 (homepage progress display) ✓
- §7 Skill workflow → out of Phase 1 scope (Phase 2)
- §8.1 Inherited design tokens → Task 6 ✓
- §8.2 vg-specific (wordmark, sigil, nav, etc.) → Tasks 3, 4, 6, 8 ✓
- §8.3 Homepage layout → Task 13 ✓
- §9.1 Cloudflare setup → Task 20 ✓
- §9.2 GH Actions quality → Tasks 16, 17 (Phase 1 subset) ✓
- §9.3 Branch lifecycle → Task 20 step 3 ✓
- §10.1 Automated tests → Tasks 16, 17 (build + html-validate only in Phase 1) ✓
- §10.2 Skill self-check → out of Phase 1 scope (Phase 2)
- §10.3 Visual review → Task 19, 20 step 6 ✓
- §11 Documentation → Task 18 ✓
- §12 Phase 1 deliverables 1–10 → all tasks ✓

Type consistency check: `data-vg-readkey`, `data-vg-readkey-item`, `data-vg-toggle`, `data-vg-progress-of`, `data-vg-progress-total`, `data-vg-copy-link` — used consistently between `read-tracker.js` (Task 7) and the templates / sample posts (Tasks 8, 11, 12, 13, 15). `localStorage` key `vg-theme` and `vg-read` are stable across the codebase.

Placeholder scan: archetype skeleton files (Task 15) intentionally contain `TODO_*` markers — these are *content placeholders for Phase 2's skill to fill*, not unfinished plan steps. No "implement later" / "TBD" / "fill in details" in any task instruction.

Spec gap: spec §6.3 mentions Mastodon/Bluesky in share buttons as "may be added later" — Phase 1 ships only Twitter/Threads/Copy. Aligned.
