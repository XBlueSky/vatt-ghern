import rssPlugin from "@11ty/eleventy-plugin-rss";
import MarkdownIt from "markdown-it";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import Prism from "prismjs";
import loadLanguages from "prismjs/components/index.js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { isoWeekKey, isoWeekRange, isoWeekLabel } from "./scripts/iso-week.mjs";
import { injectMobileCards } from "./scripts/mobile-card-transform.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LUCIDE_DIR = join(__dirname, "node_modules", "lucide-static", "icons");
const LUCIDE_CACHE = new Map();

// Build the per-day post buckets used by both daysWithPosts and weeksWithPosts.
// Skips drafts and weekly-rollup posts (weeklies live on weeks, not days).
// Within each day: daily-roundup first, then deep-stories.
function buildDayBuckets(api) {
  const byDay = new Map();
  for (const post of api.getFilteredByGlob("src/posts/**/*.html")) {
    if (post.data.status === "draft") continue;
    if (post.data.archetype === "weekly-rollup") continue;
    const d = new Date(post.data.date);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(post);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a)) // newest day first
    .map(([date, posts]) => ({
      date,
      posts: posts.sort((a, b) => {
        if (a.data.archetype === "daily-roundup") return -1;
        if (b.data.archetype === "daily-roundup") return 1;
        return 0;
      }),
    }));
}

function lucideIcon(name, extraClass = "", ariaLabel = "") {
  const cacheKey = `${name}|${extraClass}|${ariaLabel}`;
  if (LUCIDE_CACHE.has(cacheKey)) return LUCIDE_CACHE.get(cacheKey);
  const path = join(LUCIDE_DIR, `${name}.svg`);
  if (!existsSync(path)) {
    throw new Error(`lucide icon not found: ${name} (looked at ${path})`);
  }
  let svg = readFileSync(path, "utf8").trim();
  // Inject vg-icon class + optional extra class; aria-label if given,
  // otherwise mark decorative. Stroke uses currentColor (lucide default).
  const cls = ["vg-icon", `vg-icon-${name}`, extraClass].filter(Boolean).join(" ");
  const a11y = ariaLabel
    ? `role="img" aria-label="${ariaLabel.replace(/"/g, "&quot;")}"`
    : `aria-hidden="true" focusable="false"`;
  // Replace lucide's built-in class with our class set; if no class
  // attr present, inject one. Then add a11y attrs (overwriting any
  // existing aria-hidden/role on the SVG).
  if (/\sclass="[^"]*"/.test(svg)) {
    svg = svg.replace(/\sclass="[^"]*"/, ` class="${cls}"`);
  } else {
    svg = svg.replace(/<svg/, `<svg class="${cls}"`);
  }
  svg = svg.replace(/\s(aria-hidden|aria-label|role|focusable)="[^"]*"/g, "");
  svg = svg.replace(/<svg/, `<svg ${a11y}`);
  LUCIDE_CACHE.set(cacheKey, svg);
  return svg;
}

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(rssPlugin);
  // PrismJS-based syntax highlight. Blocks tagged with class="language-*"
  // (e.g. <pre><code class="language-js">) get tokenised at build time;
  // untagged <pre> blocks pass through unchanged and only pick up the
  // typographic styling in site.css.
  eleventyConfig.addPlugin(syntaxHighlight, {
    preAttributes: { tabindex: 0 },
  });

  // Post-process bespoke HTML posts: any <pre><code class="language-X">
  // gets tokenised by Prism at build time. The plugin alone only adds a
  // {% highlight %} shortcode; vatt-ghern posts are direct HTML, so we
  // walk the output and apply Prism in place.
  //
  // Decoding rule: the authored HTML has & < > already entity-encoded
  // for safety, so we must decode them before handing the source to
  // Prism, then let Prism re-encode whatever needs encoding in tokens.
  function htmlDecode(s) {
    return s
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  }
  eleventyConfig.addTransform("prism-highlight", function (content) {
    if (!this.page.outputPath || !this.page.outputPath.endsWith(".html")) {
      return content;
    }
    return content.replace(
      /<pre([^>]*)><code class="language-([\w-]+)">([\s\S]*?)<\/code><\/pre>/g,
      (match, preAttrs, lang, body) => {
        if (!Prism.languages[lang]) {
          try { loadLanguages([lang]); } catch { /* unknown — fall through */ }
        }
        if (!Prism.languages[lang]) return match; // unknown language, leave alone
        const decoded = htmlDecode(body);
        const highlighted = Prism.highlight(decoded, Prism.languages[lang], lang);
        return `<pre${preAttrs} tabindex="0" class="language-${lang}"><code class="language-${lang}">${highlighted}</code></pre>`;
      }
    );
  });

  // ── Mobile summary cards ──────────────────────────────────────
  // Post pages only (/YYYY/MM/DD/<slug>/index.html). Injects a summary card
  // after each vg-w-* figure and a one-shot notice at the top of
  // .vg-post-body. CSS shows them only on coarse-pointer devices; the widget
  // gallery and cookbook pages are desktop teaching surfaces and are skipped.
  const POST_OUTPUT_RE = /[/\\]\d{4}[/\\]\d{2}[/\\]\d{2}[/\\][^/\\]+[/\\]index\.html$/;
  eleventyConfig.addTransform("mobile-cards", function (content) {
    const out = this.page.outputPath;
    if (!out || !POST_OUTPUT_RE.test(out)) return content;
    const { html, missing } = injectMobileCards(content);
    for (const cls of missing) {
      console.warn(`[mobile-cards] ${out}: ${cls} missing data-mobile-summary (generic card injected)`);
    }
    return html;
  });

  // Inline lucide SVG icon. Usage:
  //   {% lucide "check" %}                      decorative
  //   {% lucide "chevron-left", "vg-mn-arrow", "previous month" %}
  // currentColor stroke so SVG follows surrounding text color in both themes.
  eleventyConfig.addShortcode("lucide", lucideIcon);

  // ── Widget gallery silhouettes ─────────────────────────────────
  // A tiny structural thumbnail per catalog widget / cookbook template, so the
  // /widgets/ gallery cards show what each pattern LOOKS like instead of a bare
  // text list. viewBox 0 0 120 72; stroke-based; `vg-sil-accent`/`-accent-fill`
  // classes pick up terracotta. Keyed by widget/template id; missing id → ''.
  const WIDGET_SILHOUETTES = {
    // ── catalog widgets ──
    "feature-flags": `
      <line x1="12" y1="22" x2="52" y2="22"/>
      <circle cx="62" cy="22" r="3" class="vg-sil-accent"/>
      <line x1="12" y1="36" x2="52" y2="36"/>
      <circle cx="62" cy="36" r="3"/>
      <line x1="12" y1="50" x2="52" y2="50"/>
      <circle cx="62" cy="50" r="3" class="vg-sil-accent"/>
      <rect x="78" y="14" width="30" height="44"/>
      <line x1="84" y1="24" x2="102" y2="24"/>
      <line x1="84" y1="32" x2="98" y2="32"/>
      <line x1="84" y1="40" x2="103" y2="40"/>
      <line x1="84" y1="48" x2="95" y2="48"/>`,

    // ── cookbook hero (tier 1) ──
    "annotated-diagram-walkthrough": `
      <rect x="10" y="22" width="26" height="16"/>
      <line x1="36" y1="30" x2="44" y2="30"/>
      <rect x="44" y="22" width="26" height="16" class="vg-sil-accent"/>
      <line x1="70" y1="30" x2="78" y2="30"/>
      <rect x="78" y="22" width="26" height="16"/>
      <line x1="10" y1="50" x2="80" y2="50"/>
      <line x1="10" y1="58" x2="58" y2="58"/>`,
    "data-driven-chart": `
      <line x1="22" y1="14" x2="22" y2="58"/>
      <line x1="22" y1="58" x2="108" y2="58"/>
      <rect x="22" y="20" width="50" height="8"/>
      <rect x="22" y="32" width="78" height="8" class="vg-sil-accent-fill"/>
      <rect x="22" y="44" width="34" height="8"/>`,
    "interactive-param-demo": `
      <line x1="14" y1="18" x2="62" y2="18"/>
      <circle cx="42" cy="18" r="3" class="vg-sil-accent"/>
      <path d="M14,50 C26,34 34,34 46,50 C58,66 66,66 78,50 C90,34 98,34 106,46" class="vg-sil-accent"/>`,
    "mini-canvas-simulation": `
      <rect x="12" y="12" width="22" height="9"/>
      <rect x="14" y="28" width="92" height="34"/>
      <circle cx="34" cy="40" r="2.5"/>
      <circle cx="52" cy="50" r="2.5" class="vg-sil-accent"/>
      <circle cx="70" cy="36" r="2.5"/>
      <circle cx="88" cy="48" r="2.5" class="vg-sil-accent"/>
      <circle cx="60" cy="44" r="2.5"/>`,

    // ── cookbook snippet (tier 2) ──
    "before-after-slider": `
      <rect x="14" y="16" width="92" height="40"/>
      <line x1="60" y1="12" x2="60" y2="60" class="vg-sil-accent"/>
      <circle cx="60" cy="36" r="4" class="vg-sil-accent-fill"/>`,
    "canvas-2d-loop": `
      <rect x="14" y="10" width="12" height="8"/>
      <rect x="14" y="22" width="92" height="36"/>
      <path d="M20,40 C32,28 44,52 56,40 C68,28 80,52 92,40 C97,35 101,38 104,40" class="vg-sil-accent"/>`,
    "css-3d-transform": `
      <rect x="34" y="30" width="34" height="32"/>
      <line x1="34" y1="30" x2="50" y2="16"/>
      <line x1="68" y1="30" x2="84" y2="16" class="vg-sil-accent"/>
      <line x1="50" y1="16" x2="84" y2="16"/>
      <line x1="68" y1="62" x2="84" y2="48"/>
      <line x1="84" y1="16" x2="84" y2="48" class="vg-sil-accent"/>`,
    "css-container-query": `
      <rect x="12" y="16" width="32" height="40"/>
      <rect x="16" y="22" width="24" height="10" class="vg-sil-accent"/>
      <rect x="16" y="36" width="24" height="6"/>
      <rect x="52" y="16" width="56" height="40"/>
      <rect x="56" y="22" width="48" height="10" class="vg-sil-accent"/>
      <rect x="56" y="36" width="30" height="6"/>`,
    "draggable-svg-handle": `
      <line x1="16" y1="38" x2="104" y2="38" stroke-dasharray="3 3"/>
      <circle cx="46" cy="38" r="6" class="vg-sil-accent-fill"/>
      <circle cx="80" cy="38" r="4"/>`,
    "intersection-observer-reveal": `
      <rect x="20" y="12" width="80" height="14"/>
      <rect x="20" y="30" width="80" height="14" class="vg-sil-accent"/>
      <rect x="20" y="48" width="80" height="14" stroke-dasharray="3 3"/>
      <line x1="10" y1="30" x2="14" y2="30" class="vg-sil-accent"/>
      <line x1="10" y1="44" x2="14" y2="44" class="vg-sil-accent"/>`,
    "matter-of-fact-table": `
      <rect x="12" y="14" width="96" height="44"/>
      <line x1="12" y1="26" x2="108" y2="26"/>
      <line x1="80" y1="14" x2="80" y2="58"/>
      <line x1="18" y1="34" x2="60" y2="34"/>
      <line x1="86" y1="34" x2="102" y2="34" class="vg-sil-accent"/>
      <line x1="18" y1="44" x2="56" y2="44"/>
      <line x1="86" y1="44" x2="102" y2="44" class="vg-sil-accent"/>`,
    "range-input-binding": `
      <line x1="14" y1="34" x2="86" y2="34"/>
      <circle cx="50" cy="34" r="5" class="vg-sil-accent-fill"/>
      <rect x="94" y="27" width="16" height="14"/>`,
    "stack-cards-svg-fallback": `
      <rect x="12" y="16" width="44" height="14"/>
      <rect x="12" y="34" width="44" height="14" class="vg-sil-accent"/>
      <line x1="60" y1="37" x2="68" y2="37"/>
      <rect x="72" y="14" width="36" height="12"/>
      <rect x="72" y="30" width="36" height="12" class="vg-sil-accent"/>
      <rect x="72" y="46" width="36" height="12"/>`,
    "svg-path-morph": `
      <circle cx="34" cy="36" r="16"/>
      <line x1="56" y1="36" x2="70" y2="36"/>
      <rect x="76" y="20" width="32" height="32" class="vg-sil-accent"/>`,
    "tab-switcher-pure-css": `
      <rect x="14" y="16" width="28" height="11" class="vg-sil-accent-fill"/>
      <rect x="44" y="16" width="28" height="11"/>
      <rect x="74" y="16" width="28" height="11"/>
      <rect x="14" y="29" width="88" height="27"/>`,
    "timeline-scrubber": `
      <line x1="14" y1="40" x2="106" y2="40"/>
      <line x1="24" y1="36" x2="24" y2="44"/>
      <line x1="44" y1="36" x2="44" y2="44"/>
      <line x1="64" y1="36" x2="64" y2="44"/>
      <line x1="84" y1="36" x2="84" y2="44"/>
      <circle cx="64" cy="40" r="5" class="vg-sil-accent-fill"/>`,
    "tooltip-popover-anchor": `
      <rect x="32" y="16" width="56" height="18"/>
      <path d="M54,34 l6,6 l6,-6"/>
      <line x1="30" y1="52" x2="90" y2="52"/>
      <line x1="48" y1="52" x2="72" y2="52" class="vg-sil-accent"/>`,
    "view-transition-api": `
      <rect x="12" y="20" width="38" height="32"/>
      <rect x="70" y="20" width="38" height="32" class="vg-sil-accent"/>
      <path d="M54,36 l12,0 m-4,-4 l4,4 l-4,4"/>`,
    "web-animations-api": `
      <rect x="16" y="32" width="14" height="14" class="vg-sil-accent-fill"/>
      <path d="M30,40 C50,40 60,24 80,24 C92,24 98,32 104,36" stroke-dasharray="2 3"/>
      <circle cx="80" cy="24" r="2"/>
      <circle cx="104" cy="36" r="2"/>`,
  };
  eleventyConfig.addFilter("widgetSilhouette", (widget_id) => {
    const body = WIDGET_SILHOUETTES[widget_id];
    if (!body) return "";
    return `<svg class="vg-w-gallery-sil" viewBox="0 0 120 72" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
  });

  // ── Widget shortcode ──────────────────────────────────────────
  // {% widget "name" %}               — auto-increment id
  // {% widget "name", id="board-a" %} — explicit id
  // Emits <figure class="vg-w-<name>" data-widget data-pagefind-ignore> with the
  // partial inlined, plus a deduped <script src="/static/widgets/<name>.js" defer>
  // per page. <figure> (not <div>) so catalog widgets inherit figure CSS and are
  // counted by the vg-w-* enforcer regex in tests/archetype-check.mjs.
  const widgetEmittedScripts = new Map(); // pageInputPath → Set<widgetName>
  const widgetIdCounter = new Map();      // pageInputPath → Map<widgetName, int>

  eleventyConfig.on("eleventy.before", () => {
    widgetEmittedScripts.clear();
    widgetIdCounter.clear();
  });

  eleventyConfig.addShortcode("widget", function (name, opts) {
    opts = opts || {};
    const pageKey = this.page.inputPath;

    if (!widgetIdCounter.has(pageKey)) widgetIdCounter.set(pageKey, new Map());
    const perPage = widgetIdCounter.get(pageKey);
    perPage.set(name, (perPage.get(name) || 0) + 1);
    const autoId = `vg-w-${name}-${perPage.get(name)}`;
    const id = opts.id || autoId;

    if (!widgetEmittedScripts.has(pageKey)) widgetEmittedScripts.set(pageKey, new Set());
    const emitted = widgetEmittedScripts.get(pageKey);
    const scriptTag = emitted.has(name)
      ? ""
      : `<script src="/static/widgets/${name}.js" defer></script>`;
    emitted.add(name);

    const partialPath = join(__dirname, "src", "_includes", "widgets", `${name}.njk`);
    if (!existsSync(partialPath)) {
      throw new Error(`{% widget "${name}" %}: no such catalog widget — expected src/_includes/widgets/${name}.njk`);
    }
    const partial = readFileSync(partialPath, "utf8");

    // Mobile contract: per-instance opts override the catalog defaults from
    // <name>.widget.json (`mobile_summary`, `mobile_tier`). Catalog widgets
    // are interactive by construction, so the tier defaults to "swap"; a
    // widget whose default frame reads statically can set mobile_tier in its
    // widget.json or be overridden per instance with mobile="static"/"keep".
    let meta = {};
    const metaPath = join(__dirname, "src", "_includes", "widgets", `${name}.widget.json`);
    if (existsSync(metaPath)) {
      try {
        meta = JSON.parse(readFileSync(metaPath, "utf8"));
      } catch { /* sidecar unreadable — fall through to defaults */ }
    }
    const mobileSummary = opts.summary || meta.mobile_summary || "";
    const summaryAttr = mobileSummary
      ? ` data-mobile-summary="${mobileSummary.replace(/"/g, "&quot;")}"`
      : "";
    const tier = opts.mobile || meta.mobile_tier || "swap";
    if (!["swap", "keep", "static"].includes(tier)) {
      throw new Error(
        `{% widget "${name}" %}: unknown mobile tier "${tier}" — use swap | keep | static`
      );
    }
    const tierAttr = ` data-mobile="${tier}"`;

    return `<figure class="vg-w-${name}" id="${id}" data-widget="${name}"${tierAttr}${summaryAttr} data-pagefind-ignore>${partial}</figure>${scriptTag}`;
  });

  // Asset passthrough inside posts (images, videos, CSVs, PDFs — no JSON sidecars).
  eleventyConfig.addPassthroughCopy(
    "src/posts/**/*.{png,jpg,jpeg,gif,svg,webp,avif,mp4,webm,csv,pdf}"
  );
  eleventyConfig.addPassthroughCopy({ "src/static": "static" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
  // Cloudflare Pages security headers. See src/_headers for the
  // threat model and CSP rationale.
  eleventyConfig.addPassthroughCopy({ "src/_headers": "_headers" });

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
  eleventyConfig.addCollection("daysWithPosts", (api) => buildDayBuckets(api));

  // Collection: posts grouped by ISO week (Mon–Sun) for past-weeks rendering
  // on the homepage. Weekly-rollup posts attach to the week they summarise,
  // identified by data.range.start (since publish date is the Monday *after*
  // the covered week and would otherwise bucket to the next week).
  eleventyConfig.addCollection("weeksWithPosts", (api) => {
    const dayBuckets = buildDayBuckets(api);

    // Gather weekly-rollup posts and bucket by the ISO week they cover.
    const weeklies = new Map(); // weekKey -> weekly post
    for (const post of api.getFilteredByGlob("src/posts/**/*.html")) {
      if (post.data.status === "draft") continue;
      if (post.data.archetype !== "weekly-rollup") continue;
      const start = post.data.range && post.data.range.start;
      if (!start) continue; // malformed weekly — skip rather than crash build
      weeklies.set(isoWeekKey(start), post);
    }

    // Merge into week buckets keyed by ISO week.
    const byWeek = new Map();
    for (const day of dayBuckets) {
      const wk = isoWeekKey(day.date);
      if (!byWeek.has(wk)) byWeek.set(wk, []);
      byWeek.get(wk).push(day);
    }
    // Also seed weeks that have a weekly but no days (defensive — shouldn't
    // happen in practice).
    for (const wk of weeklies.keys()) {
      if (!byWeek.has(wk)) byWeek.set(wk, []);
    }

    return [...byWeek.entries()]
      .sort(([a], [b]) => b.localeCompare(a)) // newest week first
      .map(([weekKey, days]) => {
        const { start, end } = isoWeekRange(weekKey);
        return {
          weekKey,
          weekLabel: isoWeekLabel(weekKey),
          weekStart: start,
          weekEnd: end,
          weekly: weeklies.get(weekKey) || null,
          days: days.sort((a, b) => b.date.localeCompare(a.date)),
        };
      });
  });

  // Filters
  eleventyConfig.addFilter("dateISO", (d) => {
    const dt = d ? new Date(d) : new Date();
    return isNaN(dt) ? new Date().toISOString() : dt.toISOString();
  });
  eleventyConfig.addFilter("dateYMD", (d) => {
    const dt = d ? new Date(d) : new Date();
    if (isNaN(dt)) return new Date().toISOString().slice(0, 10);
    return dt.toISOString().slice(0, 10);
  });
  eleventyConfig.addFilter("dateMD", (d) => {
    const dt = d ? new Date(d) : new Date();
    if (isNaN(dt)) return "";
    return `${String(dt.getUTCMonth() + 1).padStart(2, "0")}.${String(dt.getUTCDate()).padStart(2, "0")}`;
  });
  eleventyConfig.addFilter("dayNum", (d) => {
    const dt = d ? new Date(d) : new Date();
    if (isNaN(dt)) return "";
    return String(dt.getUTCDate()).padStart(2, "0");
  });
  eleventyConfig.addFilter("isoWeekKey", isoWeekKey);
  eleventyConfig.addFilter("isoWeekLabel", isoWeekLabel);

  // Reading-time estimator for bilingual zh-Hant + English prose.
  // CJK chars at 350/min, Latin words at 250/min, then sum; ceil to int.
  // Strips HTML tags + <style>/<script> blocks + comments before counting.
  eleventyConfig.addFilter("readingMinutes", (html) => {
    if (!html || typeof html !== "string") return 1;
    let text = html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ");
    const cjkMatches = text.match(/[㐀-鿿　-〿＀-￯]/g) || [];
    const latinText = text.replace(/[㐀-鿿　-〿＀-￯]/g, " ");
    const latinWords = (latinText.match(/[A-Za-z0-9][A-Za-z0-9'\-]*/g) || []).length;
    const minutes = cjkMatches.length / 350 + latinWords / 250;
    return Math.max(1, Math.ceil(minutes));
  });
  eleventyConfig.addFilter("dateHuman", (d) => {
    const dt = d ? new Date(d) : new Date();
    if (isNaN(dt)) return "";
    return `${dt.getUTCFullYear()} · ${String(dt.getUTCMonth() + 1).padStart(2, "0")} · ${String(dt.getUTCDate()).padStart(2, "0")}`;
  });
  eleventyConfig.addFilter("displayTags", (tags) => {
    if (!Array.isArray(tags)) return [];
    return [...new Set(tags)].filter((t) => t !== "post");
  });
  eleventyConfig.addFilter("take", (arr, n) => (Array.isArray(arr) ? arr.slice(0, n) : []));

  // Group posts into civic weeks (Sunday-anchored) for homepage timeline.
  // Not ISO-8601 — labels are for visual grouping only, not stable identifiers.
  // Returns [{ weekLabel, days: [{ date, posts }] }, ...].
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

  // Group days by calendar month for the archive page.
  // Returns [{ monthKey: "2026-05", monthLabel: "2026.05", year, month (1-12),
  //            weeks: [{ weekLabel, days: [...] }], calendar: [{ row: [cells…] }],
  //            firstDay, lastDay, postCount }, ...] newest month first.
  //
  // `calendar` is a 6×7 grid of cells for a month-view render. Each cell:
  //   { day: 1..31 | null, iso: "YYYY-MM-DD" | null,
  //     hasPosts: boolean, postsCount: number,
  //     roundupUrl?: string, anchor?: "d-DD" }
  eleventyConfig.addFilter("groupByMonth", (days) => {
    if (!Array.isArray(days)) return [];
    const byMonth = new Map();
    for (const d of days) {
      const dt = new Date(d.date);
      const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key).push(d);
    }
    const monthsAsc = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));
    const out = monthsAsc.map(([monthKey, monthDays]) => {
      const [yStr, mStr] = monthKey.split("-");
      const year = Number(yStr);
      const month = Number(mStr); // 1-12

      // Build 6×7 calendar grid (Sunday-anchored). UTC throughout so day
      // numbers match post dates regardless of server timezone.
      const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
      const lastOfMonth = new Date(Date.UTC(year, month, 0)); // day 0 of next = last day
      const startWeekday = firstOfMonth.getUTCDay(); // 0=Sun
      const daysInMonth = lastOfMonth.getUTCDate();
      const daysByNum = new Map();
      for (const d of monthDays) {
        const dt = new Date(d.date);
        daysByNum.set(dt.getUTCDate(), d);
      }
      const cells = [];
      // Leading blanks
      for (let i = 0; i < startWeekday; i++) cells.push({ day: null });
      // Real days
      for (let d = 1; d <= daysInMonth; d++) {
        const dayData = daysByNum.get(d);
        const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (dayData) {
          const roundup = dayData.posts.find((p) => p.data.archetype === "daily-roundup");
          cells.push({
            day: d,
            iso,
            hasPosts: true,
            postsCount: dayData.posts.length,
            roundupUrl: roundup ? roundup.url : null,
            anchor: `d-${String(d).padStart(2, "0")}`,
          });
        } else {
          cells.push({ day: d, iso, hasPosts: false, postsCount: 0 });
        }
      }
      // Trailing blanks to complete the final week (multiple of 7)
      while (cells.length % 7) cells.push({ day: null });
      // Slice into rows for easier njk iteration
      const rows = [];
      for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

      // Also reuse the week grouping for the per-month week list.
      // Use ISO-8601 week numbering (Monday-Sunday weeks, week 1 contains the
      // first Thursday) so a single ISO week never appears in two month
      // sections — that would emit two <section aria-label="YYYY-WNN">
      // landmarks with the same accessible name, which html-validate's
      // unique-landmark rule treats as an error.
      const weekOut = new Map();
      for (const d of monthDays) {
        const wkey = isoWeekKey(d.date);
        if (!weekOut.has(wkey)) weekOut.set(wkey, []);
        weekOut.get(wkey).push(d);
      }
      const weeks = [...weekOut.entries()]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([weekLabel, days]) => ({
          weekLabel,
          days: days.sort((a, b) => b.date.localeCompare(a.date)),
        }));

      const postCount = monthDays.reduce((acc, d) => acc + d.posts.length, 0);
      return {
        monthKey,
        monthLabel: `${year}.${String(month).padStart(2, "0")}`,
        year,
        month,
        rows,
        weeks,
        firstDay: monthDays[monthDays.length - 1]?.date,
        lastDay: monthDays[0]?.date,
        dayCount: monthDays.length,
        postCount,
      };
    });
    // Newest month first for top-of-page rendering, but keep navigation linear.
    return out.reverse();
  });

  const mdLib = new MarkdownIt({ html: true, linkify: true });
  eleventyConfig.addFilter("md", (s) => (s ? mdLib.render(String(s)) : ""));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
