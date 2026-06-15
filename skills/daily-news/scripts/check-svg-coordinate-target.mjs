#!/usr/bin/env node
// check-svg-coordinate-target.mjs — Headless Playwright check for the
// affordance-icon CTM trap (#6 in vatt-ghern-widget-gotchas).
//
// A widget that converts mouse coords to SVG user-units (getScreenCTM) must
// target its MAIN svg explicitly with a qualified selector (e.g.
// querySelector('svg.track') or querySelector('svg.vg-w-<name>-main')). If the
// figure holds more than one <svg> (e.g. a 24x24 affordance icon as the first
// svg) and the drag code grabs the svg with a BARE querySelector('svg') — no
// class/id/attribute selector — it can grab the wrong svg and the drag handle
// tracks the cursor at the wrong scale.
//
// This is a STRUCTURAL check (it does not drag): it flags a coord-transforming
// figure with >1 svg whose scripts use a bare querySelector('svg'). The exact
// class convention (-main vs .track vs anything else) does not matter — any
// qualified selector clears the gate. A bare querySelector('svg') is
// legitimate when the figure has only one svg, so a static grep cannot tell
// the two apart — hence the browser.
//
// See docs/superpowers/specs/2026-06-15-widget-antipattern-gate-design.md.
//
// Usage:
//   node check-svg-coordinate-target.mjs <url> [<url> ...]
// Exit 0 = clean. Exit 1 = at least one unsafe figure. Exit 2 = usage error.

import { fileURLToPath } from "node:url";

// Pure predicate. info = { transformsCoords, svgCount, usesBareSvgQuery }.
export function figureIsUnsafe(info) {
  return info.transformsCoords === true && info.svgCount > 1 && info.usesBareSvgQuery === true;
}

// A "bare" svg query is querySelector('svg') / querySelector("svg") with the
// closing paren right after the tag — NOT querySelector('svg.track') etc.
// NOTE: this regex literal is the single source of truth. It is passed into
// page.evaluate() below (as a string via .source) so the browser-side check and
// this exported helper can never drift apart.
const BARE_SVG_QUERY_RE = /querySelector\((['"])svg\1\)/;
export function hasBareSvgQuery(scriptText) {
  return BARE_SVG_QUERY_RE.test(scriptText);
}

async function run(urls) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  let anyFail = false;
  let figuresInspected = 0;
  let loadErrors = 0;
  const findings = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    for (const url of urls) {
      // A throwing page.goto/evaluate (bad host, 404, nav failure) must not
      // abort the whole batch nor masquerade as a clean PASS. Wrap each url:
      // on failure, log it, count it, and move on to the next url. Use a FRESH
      // page per url: a failed goto leaves Chromium mid-navigation to
      // chrome-error://, which would otherwise interrupt the next url's goto
      // ("interrupted by another navigation"). A new page fully isolates that.
      let figs;
      const page = await ctx.newPage();
      try {
        // Detection needs only the static DOM (script textContent + svg classes,
        // no layout). domcontentloaded avoids the silent false PASS where
        // networkidle settles on an empty/partial DOM (0 figures => PASS).
        await page.goto(url, { waitUntil: "domcontentloaded" });
        // Pass the bare-svg-query regex source into the browser context so the
        // browser-side check and the exported hasBareSvgQuery() helper stay in
        // sync (one source of truth — see BARE_SVG_QUERY_RE above).
        figs = await page.evaluate((bareReSrc) => {
          const bareRe = new RegExp(bareReSrc);
          const out = [];
          document.querySelectorAll('figure[class*="vg-w-"]').forEach((fig) => {
            const figCls = Array.from(fig.classList).find((c) => c.startsWith("vg-w-")) || fig.className;
            const svgs = Array.from(fig.querySelectorAll("svg"));
            const scripts = Array.from(fig.querySelectorAll("script")).map((s) => s.textContent || "").join("\n");
            const transformsCoords = /getScreenCTM/.test(scripts);
            // The real bug signal: the drag code grabs the svg without saying
            // which one (bare querySelector('svg')). Any qualified selector
            // (svg.track, svg.vg-w-x-main, ...) clears the gate.
            const usesBareSvgQuery = bareRe.test(scripts);
            out.push({ figCls, transformsCoords, svgCount: svgs.length, usesBareSvgQuery });
          });
          return out;
        }, BARE_SVG_QUERY_RE.source);
      } catch (err) {
        process.stderr.write(`ERROR loading ${url}: ${err.message}\n`);
        loadErrors += 1;
        continue;
      } finally {
        await page.close().catch(() => {});
      }
      figuresInspected += figs.length;
      for (const f of figs) {
        // Gate the decision on the exported predicate so there is a single
        // source of truth (f already carries the three fields it needs).
        if (figureIsUnsafe(f)) {
          anyFail = true;
          findings.push({ url, figure: f.figCls, svgCount: f.svgCount });
          process.stderr.write(
            `FAIL ${url} .${f.figCls}: coord-transform widget has ${f.svgCount} svgs and a bare querySelector('svg')\n`
          );
        }
      }
    }
  } finally {
    await browser.close();
  }
  // A zero-inspection run is legitimate (a page may have no widgets) but is
  // also exactly what a silent load failure looks like — surface it instead of
  // letting it masquerade as a clean PASS.
  if (figuresInspected === 0 && urls.length > 0) {
    process.stderr.write(
      `WARNING: inspected 0 vg-w-* figures across ${urls.length} url(s) — possible load failure\n`
    );
  }
  // Exit-code policy: real findings win (exit 1); otherwise a load failure is an
  // operational error (exit 2), distinct from a genuinely clean PASS (exit 0).
  // A load error makes the verdict ERROR so the JSON is never an ambiguous PASS.
  const verdict = anyFail ? "FAIL" : loadErrors > 0 ? "ERROR" : "PASS";
  if (loadErrors > 0) {
    process.stderr.write(
      `FAILED to load ${loadErrors} of ${urls.length} url(s) — treat as gate failure, not PASS\n`
    );
  }
  process.stdout.write(
    JSON.stringify(
      { verdict, figures_inspected: figuresInspected, load_errors: loadErrors, findings },
      null,
      2
    ) + "\n"
  );
  process.exit(anyFail ? 1 : loadErrors > 0 ? 2 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const urls = process.argv.slice(2);
  if (urls.length === 0) {
    process.stderr.write("usage: check-svg-coordinate-target.mjs <url> [<url> ...]\n");
    process.exit(2);
  }
  // Backstop: per-url failures are handled inside run() now, but await/catch any
  // truly unexpected throw so it exits non-zero cleanly instead of becoming an
  // unhandled rejection (stack dump + possible exit 0).
  run(urls).catch((err) => {
    process.stderr.write(`FATAL: ${err && err.message ? err.message : err}\n`);
    process.exit(2);
  });
}
