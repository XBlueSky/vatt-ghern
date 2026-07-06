#!/usr/bin/env node
// check-grid-svgscroll-conflict.mjs — flag any <figure data-svg-scroll="...">
// that is also a multi-column grid on desktop.
//
// Why: data-svg-scroll="N" sets `min-width: N px` on every descendant <svg>
// (site.css §"data-svg-scroll"). When the same <figure> is itself a desktop
// multi-column grid (e.g. SVG on the left, detail panel on the right), the
// SVG's min-width is measured against the left grid track — not the whole
// figure. If the track is narrower than N, the SVG overflows: either it
// pushes through its container, or it triggers the figure's own
// `overflow-x: auto`, producing a horizontal scrollbar on desktop where
// none was intended.
//
// Real case: PR feedback on /2026/05/22/deep-csharp-memory-safety-net11/
// shipped a 1.3fr-1fr grid widget with data-svg-scroll="720". Desktop
// figure was ~880 px wide → left track ~497 px → 720 px SVG overflowed.
// widget-cookbook/anti-examples.md §"Two-column grid + scroll" warns about
// this verbally; this script makes the rule mechanical.
//
// Algorithm:
//   For each <figure class="vg-w-*" data-svg-scroll="N"> on the page:
//     Measure its computed grid-template-columns at desktop width.
//     If it resolves to 2+ tracks, FAIL.
//
// Usage:
//   node skills/daily-news/scripts/check-grid-svgscroll-conflict.mjs <url> [<url> ...]
//
// Exit 0 = clean. Exit 1 = at least one conflict.

import { chromium } from "@playwright/test";

const VIEWPORT_W = 1280;

const urls = process.argv.slice(2);
if (urls.length === 0) {
  process.stderr.write(
    "usage: check-grid-svgscroll-conflict.mjs <url> [<url> ...]\n"
  );
  process.exit(2);
}

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({
  viewport: { width: VIEWPORT_W, height: 900 },
});
const page = await ctx.newPage();

let anyFail = false;
const findings = [];

for (const url of urls) {
  await page.goto(url, { waitUntil: "networkidle" });
  const rows = await page.evaluate(() => {
    const out = [];
    document
      .querySelectorAll('figure[class*="vg-w-"][data-svg-scroll]')
      .forEach((fig) => {
        const figCls =
          Array.from(fig.classList).find((c) => c.startsWith("vg-w-")) ||
          fig.className;
        const scroll = fig.getAttribute("data-svg-scroll");
        const cs = getComputedStyle(fig);
        if (cs.display !== "grid" && cs.display !== "inline-grid") return;
        // grid-template-columns resolves to a space-separated px list when
        // the grid is actually laid out. "none" or a single value = single
        // column.
        const tracks = cs.gridTemplateColumns.trim().split(/\s+/);
        if (tracks.length < 2) return;
        out.push({
          figCls,
          scroll,
          tracks: tracks.length,
          gridTemplateColumns: cs.gridTemplateColumns,
        });
      });
    return out;
  });

  for (const r of rows) {
    anyFail = true;
    const finding = { url, ...r };
    findings.push(finding);
    process.stderr.write(
      `FAIL ${url} .${r.figCls} data-svg-scroll="${r.scroll}" is on a ${r.tracks}-track grid (${r.gridTemplateColumns})\n`
    );
  }
}

await browser.close();

process.stdout.write(
  JSON.stringify(
    {
      verdict: anyFail ? "FAIL" : "PASS",
      findings,
    },
    null,
    2
  ) + "\n"
);

process.exit(anyFail ? 1 : 0);
