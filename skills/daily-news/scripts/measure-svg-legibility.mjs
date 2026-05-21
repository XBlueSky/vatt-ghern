#!/usr/bin/env node
// measure-svg-legibility.mjs — Headless Playwright check that every SVG
// <text> inside a `vg-w-*` figure renders at ≥ MIN_EFFECTIVE_PX on a
// MOBILE_WIDTH viewport. Fails CI (exit 1) if any figure breaks the floor.
//
// Why: PR #30 (2026-05-21) shipped 7 SVG figures whose smallest text
// rendered between 3.5 and 5.4 device px on a 375 px viewport. They
// looked OK in screenshots because the screenshot tool downsamples;
// only direct measurement of effective px exposes the problem.
//
// Usage:
//   node skills/daily-news/scripts/measure-svg-legibility.mjs <url1> [url2 ...]
//
// Requires: `npm run dev` already running on http://localhost:8080,
// and `@playwright/test` already installed (it's a devDep in repo).
//
// Output: per-figure JSON line on stderr; aggregate verdict on stdout.
//   Exit 0 = all ≥ floor.  Exit 1 = at least one figure below floor.

import { chromium } from "@playwright/test";

const MOBILE_WIDTH = 375;
const MOBILE_HEIGHT = 812;
const MIN_EFFECTIVE_PX = 11;
// Tolerance: anything ≥ 10.0 is acceptable (allows borderline cases like
// 10.1 px after deliberate `data-svg-scroll="640"` calibration).
const SOFT_FLOOR_PX = 10.0;

const urls = process.argv.slice(2);
if (urls.length === 0) {
  process.stderr.write("usage: measure-svg-legibility.mjs <url> [<url> ...]\n");
  process.exit(2);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: MOBILE_WIDTH, height: MOBILE_HEIGHT },
});
const page = await ctx.newPage();

let anyFail = false;
const allRows = [];

for (const url of urls) {
  await page.goto(url, { waitUntil: "networkidle" });
  const rows = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('figure[class*="vg-w-"]').forEach((fig) => {
      const cls =
        Array.from(fig.classList).find((c) => c.startsWith("vg-w-")) ||
        fig.className;
      fig.querySelectorAll("svg").forEach((svg) => {
        const vb = svg.getAttribute("viewBox");
        if (!vb) return;
        const parts = vb.split(/\s+/).map(Number);
        if (parts.length < 4) return;
        const vbW = parts[2];
        const svgW = svg.getBoundingClientRect().width;
        if (!svgW) return;
        const scale = svgW / vbW;
        let minFs = Infinity;
        let minSample = "";
        svg.querySelectorAll("text").forEach((t) => {
          const fs = parseFloat(getComputedStyle(t).fontSize);
          if (fs > 0 && fs < minFs) {
            minFs = fs;
            minSample = (t.textContent || "").slice(0, 40);
          }
        });
        if (minFs === Infinity) return;
        out.push({
          figure: cls,
          viewBox_w: vbW,
          svg_w: +svgW.toFixed(0),
          scale: +scale.toFixed(3),
          min_font_svg_unit: minFs,
          min_effective_px: +(minFs * scale).toFixed(2),
          sample_text: minSample,
          data_svg_scroll: fig.getAttribute("data-svg-scroll") || null,
        });
      });
    });
    return out;
  });

  for (const r of rows) {
    const status =
      r.min_effective_px >= MIN_EFFECTIVE_PX
        ? "PASS"
        : r.min_effective_px >= SOFT_FLOOR_PX
          ? "SOFT-PASS"
          : "FAIL";
    if (status === "FAIL") anyFail = true;
    allRows.push({ url, ...r, status });
    process.stderr.write(JSON.stringify({ url, ...r, status }) + "\n");
  }
}

await browser.close();

process.stdout.write(
  JSON.stringify(
    {
      mobile_width: MOBILE_WIDTH,
      min_effective_px_floor: MIN_EFFECTIVE_PX,
      soft_floor_px: SOFT_FLOOR_PX,
      rows: allRows,
      pass: !anyFail,
    },
    null,
    2
  ) + "\n"
);

process.exit(anyFail ? 1 : 0);
