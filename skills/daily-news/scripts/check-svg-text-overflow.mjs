#!/usr/bin/env node
// check-svg-text-overflow.mjs — Headless Playwright check for SVG <text>
// elements whose bbox exceeds the bbox of the nearest containing <rect>.
//
// Why: SVG <text> doesn't wrap. A long label inside a 180-unit-wide
// labelled rect can spill 70-80 units past the rect's right edge,
// visually colliding with adjacent siblings. PR #30 had 4 such cases
// in the Fides annotated-stack widget where all four box labels
// merged into one illegible strip — visible at screenshot review but
// the human reviewer mistook it for "intentional code annotation".
//
// Algorithm:
//   For each <svg> inside a vg-w-* figure:
//     For each <text> element T:
//       For each preceding sibling <rect> R in the same SVG:
//         If R's bbox horizontally contains T's anchor point (so T is
//         "owned" by R semantically — this is a heuristic, not perfect):
//           Flag if T.bbox.right > R.bbox.right + tolerance
//
// Tolerance: 2 SVG units (anti-aliasing noise budget).
//
// Usage:
//   node skills/daily-news/scripts/check-svg-text-overflow.mjs <url> [<url> ...]
//
// Exit 0 = clean. Exit 1 = at least one overflow.

import { chromium } from "@playwright/test";

const TOLERANCE_SVG_UNITS = 2;
const VIEWPORT_W = 1280; // measure at desktop where SVG renders at full size

const urls = process.argv.slice(2);
if (urls.length === 0) {
  process.stderr.write(
    "usage: check-svg-text-overflow.mjs <url> [<url> ...]\n"
  );
  process.exit(2);
}

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({
  viewport: { width: VIEWPORT_W, height: 900 },
});
const page = await ctx.newPage();

const TOLERANCE = TOLERANCE_SVG_UNITS;

let anyFail = false;
const findings = [];

for (const url of urls) {
  await page.goto(url, { waitUntil: "networkidle" });
  const rows = await page.evaluate(
    ({ TOLERANCE }) => {
      const out = [];
      document.querySelectorAll('figure[class*="vg-w-"]').forEach((fig) => {
        const figCls =
          Array.from(fig.classList).find((c) => c.startsWith("vg-w-")) ||
          fig.className;
        fig.querySelectorAll("svg").forEach((svg) => {
          const texts = Array.from(svg.querySelectorAll("text"));
          const rects = Array.from(svg.querySelectorAll("rect"));
          if (rects.length === 0) return;
          // pre-compute rect bboxes in SVG coordinates
          const rectBoxes = rects
            .map((r) => {
              try {
                const b = r.getBBox();
                return { el: r, x: b.x, y: b.y, right: b.x + b.width, bottom: b.y + b.height };
              } catch {
                return null;
              }
            })
            .filter(Boolean);
          texts.forEach((t) => {
            let tb;
            try {
              tb = t.getBBox();
            } catch {
              return;
            }
            const tx = tb.x;
            const tright = tb.x + tb.width;
            const ty = tb.y + tb.height / 2;
            // find the rect that semantically "owns" this text: the
            // smallest rect whose horizontal center band contains the
            // text's anchor X and whose Y band contains the text's center Y.
            let owner = null;
            for (const r of rectBoxes) {
              if (
                tx + 2 >= r.x &&
                tx + 2 <= r.right &&
                ty >= r.y &&
                ty <= r.bottom
              ) {
                if (!owner || r.right - r.x < owner.right - owner.x) owner = r;
              }
            }
            if (!owner) return; // text isn't inside any rect — skip
            const overflow = tright - owner.right;
            if (overflow > TOLERANCE) {
              out.push({
                figure: figCls,
                text_sample: (t.textContent || "").slice(0, 50),
                text_right: +tright.toFixed(1),
                rect_right: +owner.right.toFixed(1),
                overflow_svg_units: +overflow.toFixed(1),
              });
            }
          });
        });
      });
      return out;
    },
    { TOLERANCE }
  );

  if (rows.length > 0) anyFail = true;
  for (const r of rows) {
    findings.push({ url, ...r });
    process.stderr.write(JSON.stringify({ url, ...r }) + "\n");
  }
}

await browser.close();

process.stdout.write(
  JSON.stringify(
    {
      tolerance_svg_units: TOLERANCE,
      viewport_w: VIEWPORT_W,
      findings,
      pass: !anyFail,
    },
    null,
    2
  ) + "\n"
);

process.exit(anyFail ? 1 : 0);
