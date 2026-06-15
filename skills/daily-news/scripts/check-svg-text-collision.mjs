#!/usr/bin/env node
// check-svg-text-collision.mjs — Headless Playwright check for two SVG <text>
// elements that overlap each other (text-vs-text), which the legibility and
// text-overflow scripts cannot see.
//
// See docs/superpowers/specs/2026-06-15-widget-antipattern-gate-design.md
// and the vatt-ghern-widget-gotchas memory (#3).
//
// Overlap predicate (empirically tuned in the memory note): two <text> boxes
// collide iff horizontal overlap ox > 1 AND vertical overlap oy > 3, measured
// in SVG viewBox user-units via getBBox() (NOT client px). Measuring in
// viewBox space matches the coordinate space the threshold was tuned in and is
// viewport-independent (no scaling sensitivity across different viewBox widths).
// The oy > 3 floor lets through a deliberate two-line description (two <text>
// at the same cx, ~2.5 viewBox-unit vertical overlap from normal line spacing).
//
// Usage:
//   node check-svg-text-collision.mjs <url> [<url> ...]
// Exit 0 = clean. Exit 1 = at least one collision. Exit 2 = usage error.

import { fileURLToPath } from "node:url";

const OX_MIN = 1; // viewBox user-units (see header)
const OY_MIN = 3; // viewBox user-units (see header)

// Pure predicate over two viewBox-unit bboxes { left, right, top, bottom }.
export function pairOverlaps(a, b) {
  const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return ox > OX_MIN && oy > OY_MIN;
}

async function run(urls) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  let anyFail = false;
  const findings = [];

  try {
    for (const url of urls) {
      await page.goto(url, { waitUntil: "networkidle" });
      const groups = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('figure[class*="vg-w-"]').forEach((fig) => {
          const figCls = Array.from(fig.classList).find((c) => c.startsWith("vg-w-")) || fig.className;
          fig.querySelectorAll("svg").forEach((svg, si) => {
            const texts = [];
            svg.querySelectorAll("text").forEach((t) => {
              let bb;
              try {
                bb = t.getBBox();
              } catch {
                return;
              }
              if (bb.width === 0 && bb.height === 0) return;
              texts.push({
                sample: (t.textContent || "").slice(0, 40),
                left: bb.x, right: bb.x + bb.width, top: bb.y, bottom: bb.y + bb.height,
              });
            });
            if (texts.length >= 2) out.push({ figCls, svgIndex: si, texts });
          });
        });
        return out;
      });

      for (const g of groups) {
        for (let i = 0; i < g.texts.length; i++) {
          for (let j = i + 1; j < g.texts.length; j++) {
            const a = g.texts[i], b = g.texts[j];
            // Compute ox/oy for the report; gate the decision on the exported
            // predicate so there is a single source of truth for the threshold.
            const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (pairOverlaps(a, b)) {
              anyFail = true;
              const finding = {
                url, figure: g.figCls, svgIndex: g.svgIndex,
                a: a.sample, b: b.sample,
                overlap_px: { ox: +ox.toFixed(1), oy: +oy.toFixed(1) },
              };
              findings.push(finding);
              process.stderr.write(JSON.stringify(finding) + "\n");
            }
          }
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
    process.stderr.write("usage: check-svg-text-collision.mjs <url> [<url> ...]\n");
    process.exit(2);
  }
  run(urls);
}
