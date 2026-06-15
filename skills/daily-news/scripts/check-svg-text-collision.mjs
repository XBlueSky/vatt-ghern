#!/usr/bin/env node
// check-svg-text-collision.mjs — Headless Playwright check for two SVG <text>
// elements that overlap each other (text-vs-text), which the legibility and
// text-overflow scripts cannot see.
//
// See docs/superpowers/specs/2026-06-15-widget-antipattern-gate-design.md
// and the vatt-ghern-widget-gotchas memory (#3).
//
// Overlap predicate (empirically tuned in the memory note): two <text> boxes
// collide iff horizontal overlap ox > 1 px AND vertical overlap oy > 3 px.
// The oy > 3 floor lets through a deliberate two-line description (two <text>
// at the same cx, ~2.5px vertical overlap from normal line spacing).
//
// Usage:
//   node check-svg-text-collision.mjs <url> [<url> ...]
// Exit 0 = clean. Exit 1 = at least one collision. Exit 2 = usage error.

import { fileURLToPath } from "node:url";

const OX_MIN = 1; // px
const OY_MIN = 3; // px

// Pure predicate over two client-px bboxes { left, right, top, bottom }.
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

  for (const url of urls) {
    await page.goto(url, { waitUntil: "networkidle" });
    const groups = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('figure[class*="vg-w-"]').forEach((fig) => {
        const figCls = Array.from(fig.classList).find((c) => c.startsWith("vg-w-")) || fig.className;
        fig.querySelectorAll("svg").forEach((svg, si) => {
          const texts = [];
          svg.querySelectorAll("text").forEach((t) => {
            const r = t.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) return;
            texts.push({
              sample: (t.textContent || "").slice(0, 40),
              left: r.left, right: r.right, top: r.top, bottom: r.bottom,
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
          const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ox > OX_MIN && oy > OY_MIN) {
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

  await browser.close();
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
