#!/usr/bin/env node
// check-svg-coordinate-target.mjs — Headless Playwright check for the
// affordance-icon CTM trap (#6 in vatt-ghern-widget-gotchas).
//
// A widget that converts mouse coords to SVG user-units (getScreenCTM) must
// target its MAIN svg explicitly (svg.vg-w-<name>-main). If the figure holds
// more than one <svg> (e.g. a 24x24 affordance icon as the first svg) and none
// is named *-main, a bare querySelector('svg') grabs the wrong svg and the
// drag handle tracks the cursor at the wrong scale.
//
// This is a STRUCTURAL check (it does not drag): it flags a coord-transforming
// figure with >1 svg and no *-main svg. A bare querySelector('svg') is
// legitimate when the figure has only one svg, so a static grep cannot tell
// the two apart — hence the browser.
//
// See docs/superpowers/specs/2026-06-15-widget-antipattern-gate-design.md.
//
// Usage:
//   node check-svg-coordinate-target.mjs <url> [<url> ...]
// Exit 0 = clean. Exit 1 = at least one unsafe figure. Exit 2 = usage error.

import { fileURLToPath } from "node:url";

// Pure predicate. info = { transformsCoords, svgCount, hasMainSvg }.
export function figureIsUnsafe(info) {
  return info.transformsCoords === true && info.svgCount > 1 && info.hasMainSvg === false;
}

async function run(urls) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  let anyFail = false;
  const findings = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    for (const url of urls) {
      await page.goto(url, { waitUntil: "networkidle" });
      const figs = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('figure[class*="vg-w-"]').forEach((fig) => {
          const figCls = Array.from(fig.classList).find((c) => c.startsWith("vg-w-")) || fig.className;
          const svgs = Array.from(fig.querySelectorAll("svg"));
          const scripts = Array.from(fig.querySelectorAll("script")).map((s) => s.textContent || "").join("\n");
          const transformsCoords = /getScreenCTM/.test(scripts);
          const hasMainSvg = svgs.some((s) =>
            Array.from(s.classList).some((c) => c.startsWith("vg-w-") && c.endsWith("-main"))
          );
          out.push({ figCls, transformsCoords, svgCount: svgs.length, hasMainSvg });
        });
        return out;
      });
      for (const f of figs) {
        // Gate the decision on the exported predicate so there is a single
        // source of truth (f already carries the three fields it needs).
        if (figureIsUnsafe(f)) {
          anyFail = true;
          findings.push({ url, figure: f.figCls, svgCount: f.svgCount });
          process.stderr.write(
            `FAIL ${url} .${f.figCls}: coord-transform widget has ${f.svgCount} svgs and no *-main svg\n`
          );
        }
      }
    }
  } finally {
    await browser.close();
  }
  process.stdout.write(JSON.stringify({ verdict: anyFail ? "FAIL" : "PASS", findings }, null, 2) + "\n");
  process.exit(anyFail ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const urls = process.argv.slice(2);
  if (urls.length === 0) {
    process.stderr.write("usage: check-svg-coordinate-target.mjs <url> [<url> ...]\n");
    process.exit(2);
  }
  run(urls);
}
