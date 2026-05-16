import rssPlugin from "@11ty/eleventy-plugin-rss";

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(rssPlugin);

  // Asset passthrough inside posts (images, videos, CSVs, PDFs — no JSON sidecars).
  eleventyConfig.addPassthroughCopy(
    "src/posts/**/*.{png,jpg,jpeg,gif,svg,webp,avif,mp4,webm,csv,pdf}"
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
  eleventyConfig.addFilter("dateMD", (d) => {
    const dt = d ? new Date(d) : new Date();
    if (isNaN(dt)) return "";
    return `${String(dt.getUTCMonth() + 1).padStart(2, "0")}.${String(dt.getUTCDate()).padStart(2, "0")}`;
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

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
