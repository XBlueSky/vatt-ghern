import rssPlugin from "@11ty/eleventy-plugin-rss";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import Prism from "prismjs";
import loadLanguages from "prismjs/components/index.js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LUCIDE_DIR = join(__dirname, "node_modules", "lucide-static", "icons");
const LUCIDE_CACHE = new Map();

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

  // Inline lucide SVG icon. Usage:
  //   {% lucide "check" %}                      decorative
  //   {% lucide "chevron-left", "vg-mn-arrow", "previous month" %}
  // currentColor stroke so SVG follows surrounding text color in both themes.
  eleventyConfig.addShortcode("lucide", lucideIcon);

  // Asset passthrough inside posts (images, videos, CSVs, PDFs — no JSON sidecars).
  eleventyConfig.addPassthroughCopy(
    "src/posts/**/*.{png,jpg,jpeg,gif,svg,webp,avif,mp4,webm,csv,pdf}"
  );
  eleventyConfig.addPassthroughCopy({ "src/static": "static" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

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
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
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

      // Also reuse the week grouping for the per-month week list
      const weekOut = new Map();
      for (const d of monthDays) {
        const dt = new Date(d.date);
        const onejan = new Date(dt.getFullYear(), 0, 1);
        const week = Math.ceil((((dt - onejan) / 86400000) + onejan.getDay() + 1) / 7);
        const wkey = `${dt.getFullYear()}-W${String(week).padStart(2, "0")}`;
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

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
