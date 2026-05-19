#!/usr/bin/env node
// archetype-check.mjs — Validate built post HTML against archetype rules.
//
// Usage: node tests/archetype-check.mjs _site/posts/
//
// Walks all *.html files under the given dir and checks:
//   - Roundup HTML (path matches **/roundup/index.html):
//       * Has at least one .vg-card-roundup with id="item-NN"
//       * id values are zero-padded and unique
//       * Each item card has data-vg-readkey-item attr
//       * Progress span has data-vg-progress-of and data-vg-progress-total
//   - Deep-story HTML (path matches **/deep-*/index.html):
//       * Universal contract: opener (required), closer with <strong> (required),
//         ≥1 <svg> (required), dropcap (recommended → warning), ≥2 <svg> (recommended → warning)
//       * Per-archetype rules: H2 *count range* enforced, H2 *phrasing* free
//         (the agent picks words that fit each story instead of repeating
//         "what happened / why it matters / so what" eight times across three
//         days). Closer label is free.
//       * Special structural requirements still enforced: comparison needs
//         a <table> or vg-w-comparison-* SVG; explainer body needs <pre><code>
//         or <svg> somewhere (the worked example must materialise concretely).
//   - Universal:
//       * No `:` (half-width) inside .vg-card-title or H1/H2 text content
//       * No Latin em-dash `—` inside .vg-post-body or .vg-post-title
//
// Exits 0 on success, 1 on any violation.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, "..");

// Date gate: posts dated before WIDGET_CONTRACT_EFFECTIVE_DATE are
// grandfathered to the pre-widget-cookbook contract. Update this
// constant at PR merge time to the actual merge date.
const WIDGET_CONTRACT_EFFECTIVE_DATE = "2026-06-01"; // YYYY-MM-DD

function postDateFromPath(htmlPath) {
  const m = htmlPath.match(/[/\\](\d{4})[/\\](\d{2})[/\\](\d{2})[/\\]/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function isWidgetContractActive(htmlPath) {
  const d = postDateFromPath(htmlPath);
  if (!d) return false;
  return d >= WIDGET_CONTRACT_EFFECTIVE_DATE;
}

const root = process.argv[2];
if (!root) {
  process.stderr.write("Usage: archetype-check.mjs <dir>\n");
  process.exit(2);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (entry.endsWith(".html")) out.push(p);
  }
  return out;
}

const violations = [];
const warnings = [];

function checkRoundup(path, html) {
  const itemMatches = [...html.matchAll(/<article[^>]+class="[^"]*vg-card-roundup[^"]*"[^>]*id="item-(\d+)"/g)];
  if (itemMatches.length === 0) {
    violations.push(`${path}: roundup has no item cards`);
    return;
  }
  const ids = itemMatches.map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (!/^\d{2}$/.test(id)) {
      violations.push(`${path}: id="item-${id}" is not zero-padded 2 digits`);
    }
    if (seen.has(id)) violations.push(`${path}: duplicate id="item-${id}"`);
    seen.add(id);
  }
  // Each item must also have data-vg-readkey-item
  const readkeyCount = (html.match(/data-vg-readkey-item="/g) || []).length;
  if (readkeyCount < itemMatches.length) {
    violations.push(
      `${path}: ${itemMatches.length} item cards but only ${readkeyCount} data-vg-readkey-item attrs`
    );
  }
  // Each item must wrap content in .vg-card-roundup-body for read-tracker injection point
  const bodyWrapperCount = (html.match(/class="[^"]*vg-card-roundup-body/g) || []).length;
  if (bodyWrapperCount < itemMatches.length) {
    violations.push(
      `${path}: ${itemMatches.length} item cards but only ${bodyWrapperCount} .vg-card-roundup-body wrappers`
    );
  }
  // Progress span
  if (!/data-vg-progress-of="/.test(html)) {
    violations.push(`${path}: missing data-vg-progress-of span`);
  }
  if (!/data-vg-progress-total="/.test(html)) {
    violations.push(`${path}: missing data-vg-progress-total span`);
  }
  // Section labels: at least one .vg-roundup-section-label per item (loose
  // proxy for "items are grouped"). Be lenient: roundup with all items in
  // ONE domain only needs ≥1 section label.
  const sectionLabelCount = (html.match(/class="[^"]*vg-roundup-section-label/g) || []).length;
  if (sectionLabelCount < 1) {
    violations.push(
      `${path}: roundup has ${itemMatches.length} items but no domain section labels`
    );
  }
  // Lede length sanity (heuristic): 2-3 sentences allowed (≤4 「。」 periods
  // to also allow inline references like "ClickHouse 25.11." or "CVE-2026-31431."
  // counting as periods). >4 implies the lede is bloating to deep-story territory.
  const ledeMatches = [...html.matchAll(/<p[^>]*class="[^"]*vg-card-lede[^"]*"[^>]*>([\s\S]*?)<\/p>/g)];
  for (const m of ledeMatches) {
    const text = m[1].replace(/<[^>]+>/g, "");
    const periodCount = (text.match(/。/g) || []).length;
    if (periodCount > 4) {
      const snippet = text.slice(0, 50).trim();
      violations.push(
        `${path}: roundup item lede has ${periodCount} 「。」 periods (max 4 — 2-3 sentences plus inline-reference allowance): "${snippet}…"`
      );
    }
  }
}

function readSidecarArchetype(htmlPath) {
  // Given _site/.../<slug>/index.html, find the corresponding sidecar in src/posts/.../<slug>.11tydata.json
  // Strategy: parse the post URL from the HTML path back to the source path.
  // _site/YYYY/MM/DD/<slug>/index.html -> src/posts/YYYY/MM/DD/<slug>.11tydata.json
  const m = htmlPath.match(/[/\\](\d{4})[/\\](\d{2})[/\\](\d{2})[/\\]([^/\\]+)[/\\]index\.html$/);
  if (!m) return null;
  const [, y, mo, d, slug] = m;
  const sidecarPath = join(REPO_ROOT, "src", "posts", y, mo, d, `${slug}.11tydata.json`);
  if (!existsSync(sidecarPath)) return null;
  try {
    const data = JSON.parse(readFileSync(sidecarPath, "utf8"));
    return data.deep_archetype || null;
  } catch {
    return null;
  }
}

function checkUniversalContract(path, html) {
  if (!/class="[^"]*vg-deep-opener/.test(html)) {
    violations.push(`${path}: missing .vg-deep-opener`);
  }
  if (!/class="[^"]*vg-dropcap/.test(html)) {
    warnings.push(`${path}: missing .vg-dropcap (recommended for visual rhythm; OK to omit on solemn topics)`);
  }
  if (!/class="[^"]*vg-deep-closer/.test(html)) {
    violations.push(`${path}: missing .vg-deep-closer`);
  }
  if (!/<p[^>]*class="[^"]*vg-deep-closer[^"]*"[^>]*>[\s\S]*?<strong>/.test(html)) {
    violations.push(`${path}: .vg-deep-closer must contain a <strong> for the closing label`);
  }
  const svgCount = (html.match(/<svg\b/g) || []).length;
  if (svgCount < 1) {
    violations.push(`${path}: deep-story requires ≥1 <svg> widget, found ${svgCount}`);
  } else if (svgCount < 2) {
    warnings.push(`${path}: deep-story has only ${svgCount} <svg> widget (≥2 recommended; single must carry high informational density)`);
  }
}

function extractH2Texts(html) {
  return [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)]
    .map((m) => m[1].trim());
}

function checkNarrative(path, html) {
  // Narrative shape: setup → mechanism → consequence. Three-beat arc.
  // Phrasing is free — agent chooses words that fit the story.
  const actual = extractH2Texts(html);
  if (actual.length < 2 || actual.length > 5) {
    violations.push(`${path}: narrative requires 2-5 H2 elements (setup → mechanism → consequence arc), found ${actual.length}`);
  }
  // Closer label is free; just needs a <strong> tag (checked by universal contract).
}

function checkTechnicalDeepDive(path, html) {
  const actual = extractH2Texts(html);
  if (actual.length < 3 || actual.length > 6) {
    violations.push(`${path}: technical-deep-dive requires 3-6 H2 elements (one per component), found ${actual.length}`);
  }
  // Closer label is free; phrasing should signal "capability unlocked".
}

function checkInvestigation(path, html) {
  // Investigation shape: puzzle → 1-3 falsified candidates → resolution.
  // H2 count enforced; phrasing free.
  const actual = extractH2Texts(html);
  if (actual.length < 3 || actual.length > 6) {
    violations.push(`${path}: investigation requires 3-6 H2 elements (puzzle + 1-3 hypotheses + resolution), found ${actual.length}`);
  }
  // Closer label is free.
}

function checkComparison(path, html) {
  // Comparison shape: 3-5 axes (per-option breakdown) + a decision section.
  // H2 phrasing free — "dimension: X" is an example, not a rule.
  const actual = extractH2Texts(html);
  if (actual.length < 4 || actual.length > 6) {
    violations.push(`${path}: comparison requires 4-6 H2 elements (3-5 axes + decision), found ${actual.length}`);
  }
  const hasTable = /<table\b/.test(html);
  const hasComparisonSvg = /class="[^"]*vg-w-comparison-/.test(html);
  if (!hasTable && !hasComparisonSvg) {
    violations.push(`${path}: comparison requires either <table> or <svg class="vg-w-comparison-...">`);
  }
}

function checkExplainer(path, html) {
  // Explainer shape: concrete case → gap → idea → worked example → applicability.
  // H2 count range enforced (4-6); phrasing free.
  // Worked example must materialise as code or SVG somewhere in body.
  const actual = extractH2Texts(html);
  if (actual.length < 4 || actual.length > 6) {
    violations.push(`${path}: explainer requires 4-6 H2 elements (case → gap → idea → example → applicability), found ${actual.length}`);
  }
  const bodyMatch = html.match(/<div[^>]+class="[^"]*vg-post-prose[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  const body = bodyMatch ? bodyMatch[1] : html;
  if (!/<pre\b/.test(body) && !/<svg\b/.test(body)) {
    violations.push(`${path}: explainer body must contain <pre><code> or <svg> for the worked example`);
  }
}

function checkFreeform(path, html) {
  // Universal contract only — already checked by checkUniversalContract
  // No H2 constraints, no closer label constraints (label is free)
}

function readSidecarRaw(htmlPath) {
  const m = htmlPath.match(/[/\\](\d{4})[/\\](\d{2})[/\\](\d{2})[/\\]([^/\\]+)[/\\]index\.html$/);
  if (!m) return null;
  const [, y, mo, d, slug] = m;
  const sidecarPath = join(REPO_ROOT, "src", "posts", y, mo, d, `${slug}.11tydata.json`);
  if (!existsSync(sidecarPath)) return null;
  try { return JSON.parse(readFileSync(sidecarPath, "utf8")); } catch { return null; }
}

function extractPostBody(html) {
  const openTag = /<div\s+class="vg-post-body"\s*>/;
  const openMatch = html.match(openTag);
  if (!openMatch) return html; // fallback: scan whole html (shouldn't happen for deep-stories)
  const start = openMatch.index + openMatch[0].length;
  // Find the closing aside (deterministic landmark in post.njk)
  const asideIdx = html.indexOf('<aside class="vg-bards-note"', start);
  if (asideIdx < 0) return html.slice(start); // fallback: rest of file
  // Walk backwards from aside to find the </div> that closes vg-post-body
  const closeIdx = html.lastIndexOf("</div>", asideIdx);
  if (closeIdx < start) return html.slice(start, asideIdx);
  return html.slice(start, closeIdx);
}

function checkWidgetContract(path, html) {
  if (!isWidgetContractActive(path)) return; // legacy mode

  // Scope widget-contract checks to the post-body region only. Layout chrome
  // (JSON-LD, theme pre-paint, vg-progress, read-tracker) sits outside
  // .vg-post-body and would otherwise trip the IIFE / external-src bans.
  const body = extractPostBody(html);

  // 1. Widget count: ≥ 3 elements with class="vg-w-*"
  const widgetMatches = [...body.matchAll(/class="[^"]*\bvg-w-[a-z0-9-]+/g)];
  // Deduplicate by capturing the actual class names per element root.
  const widgetClasses = new Set();
  for (const m of widgetMatches) {
    const cls = m[0].match(/vg-w-[a-z0-9-]+/);
    if (cls) widgetClasses.add(cls[0]);
  }
  if (widgetClasses.size < 3) {
    violations.push(`${path}: widget contract requires ≥ 3 widgets (vg-w-* classes), found ${widgetClasses.size}`);
  }

  // 2. At least 1 widget must be interactive
  const hasScript = /<script\b/.test(body);
  const hasInput = /<input\b/.test(body);
  const hasCanvas = /<canvas\b/.test(body);
  const hasScrollTimeline = /animation-timeline:\s*scroll\(/.test(body);
  if (!(hasScript || hasInput || hasCanvas || hasScrollTimeline)) {
    violations.push(`${path}: widget contract requires ≥ 1 interactive widget (<script>, <input>, <canvas>, or animation-timeline: scroll())`);
  }

  // 3. Sidecar must have widget_count, widget_questions, widget_templates
  const sidecar = readSidecarRaw(path);
  if (!sidecar) {
    violations.push(`${path}: widget contract requires sidecar JSON`);
    return;
  }
  if (typeof sidecar.widget_count !== "number") {
    violations.push(`${path}: sidecar missing widget_count`);
  }
  if (!Array.isArray(sidecar.widget_questions) || sidecar.widget_questions.length === 0) {
    violations.push(`${path}: sidecar missing widget_questions[] (non-empty array required)`);
  } else if (sidecar.widget_count != null && sidecar.widget_questions.length !== sidecar.widget_count) {
    violations.push(`${path}: sidecar widget_count (${sidecar.widget_count}) != widget_questions.length (${sidecar.widget_questions.length})`);
  }
  if (!Array.isArray(sidecar.widget_templates) || sidecar.widget_templates.length === 0) {
    violations.push(`${path}: sidecar missing widget_templates[] (non-empty array required)`);
  } else if (sidecar.widget_count != null && sidecar.widget_templates.length !== sidecar.widget_count) {
    violations.push(`${path}: sidecar widget_count (${sidecar.widget_count}) != widget_templates.length (${sidecar.widget_templates.length})`);
  }

  // 4. Prose line count ≥ 500
  // Strip <script>, <style>, <svg>, <canvas> blocks and count remaining lines.
  // (Uses full html — including a small amount of layout chrome — because the
  // threshold is a floor for substance, not a ceiling.)
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<canvas[\s\S]*?<\/canvas>/g, "");
  const proseLineCount = stripped.split("\n").filter((l) => l.trim().length > 0).length;
  if (proseLineCount < 500) {
    violations.push(`${path}: prose line count is ${proseLineCount} (widget contract requires ≥ 500 lines of prose, widget code excluded)`);
  }

  // 5. Inline <script src=...> is banned
  if (/<script[^>]+\bsrc=/.test(body)) {
    violations.push(`${path}: external <script src=...> is banned in widget contract`);
  }

  // 6. Inline <script> blocks must be IIFE
  for (const m of body.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    const scriptBody = m[1].trim();
    if (scriptBody.length === 0) continue;
    // Allow forms: (function () {...})(); (() => {...})(); (async () => {...})(); (async function () {...})();
    const iifeOpeners = /^\(\s*(async\s+)?(function\s*\(|\(\s*\)\s*=>|[^)]*=>)/;
    if (!iifeOpeners.test(scriptBody)) {
      const snippet = scriptBody.slice(0, 60).replace(/\n/g, " ");
      violations.push(`${path}: inline <script> must be IIFE-wrapped (starts with: "${snippet}")`);
    }
  }

  // 7. Post-level <style> blocks must have every rule scoped to .vg-w-*
  // Detect <style> blocks that exist OUTSIDE any <svg> by stripping <svg>...</svg> first.
  const noSvg = body.replace(/<svg[\s\S]*?<\/svg>/g, "");
  for (const m of noSvg.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
    const block = m[1];
    // Split on '}' to get rule list (rough). Each rule has a selector portion before '{'.
    const rules = block.split("}").map((r) => r.trim()).filter((r) => r.length > 0 && r.includes("{"));
    for (const rule of rules) {
      const selectorPart = rule.split("{")[0].trim();
      // Allow @-rules (@container, @media, @supports, @keyframes); their body's selectors are checked separately if needed.
      if (selectorPart.startsWith("@")) continue;
      // Each comma-separated selector must contain .vg-w-
      const selectors = selectorPart.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
      for (const sel of selectors) {
        if (!sel.includes(".vg-w-")) {
          violations.push(`${path}: post-level <style> rule selector lacks .vg-w- scoping: "${sel}"`);
        }
      }
    }
  }
}

const ARCHETYPE_CHECKERS = {
  narrative: checkNarrative,
  "technical-deep-dive": checkTechnicalDeepDive,
  investigation: checkInvestigation,
  comparison: checkComparison,
  explainer: checkExplainer,
  freeform: checkFreeform,
};

function checkDeepStory(path, html) {
  checkUniversalContract(path, html);
  checkWidgetContract(path, html);
  const archetype = readSidecarArchetype(path);
  if (!archetype) {
    violations.push(`${path}: deep-story sidecar missing or has no deep_archetype field`);
    return;
  }
  const checker = ARCHETYPE_CHECKERS[archetype];
  if (!checker) {
    violations.push(`${path}: deep_archetype "${archetype}" is not a known archetype`);
    return;
  }
  checker(path, html);
}

function checkUniversal(path, html) {
  // Half-width colon inside card title text content (rough — strip attributes first)
  // We only look at <h2 class="vg-card-title">...</h2> inner content.
  const cardTitleRe = /<h2[^>]+class="[^"]*vg-card-title[^"]*"[^>]*>([^<]+)<\/h2>/g;
  for (const m of html.matchAll(cardTitleRe)) {
    if (/[一-鿿]+:/.test(m[1])) {
      violations.push(`${path}: half-width 「:」 in card title "${m[1].trim()}" (use 「：」)`);
    }
  }
  // Latin em-dash in post body — banned per spec
  const bodyMatch = html.match(/<div[^>]+class="[^"]*vg-post-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/article>/);
  if (bodyMatch) {
    // Allow `--`, `——`, but ban a lone ` — ` (latin em-dash surrounded by spaces or CJK)
    const body = bodyMatch[1].replace(/——/g, ""); // strip CJK double em-dash first
    if (/—/.test(body)) {
      const sample = body.match(/.{0,20}—.{0,20}/)?.[0] || "";
      violations.push(`${path}: Latin em-dash 「—」 found in post body: "...${sample}..."`);
    }
  }
}

for (const path of walk(root)) {
  let html;
  try {
    html = readFileSync(path, "utf8");
  } catch {
    continue;
  }
  // Only check post URLs that look like /YYYY/MM/DD/<slug>/index.html
  const isPostPath = /[/\\](\d{4})[/\\](\d{2})[/\\](\d{2})[/\\][^/\\]+[/\\]index\.html$/.test(path);
  if (isPostPath && path.endsWith(`${sep}roundup${sep}index.html`)) {
    checkRoundup(path, html);
  } else if (isPostPath && /[/\\]deep-[^/\\]+[/\\]index\.html$/.test(path)) {
    checkDeepStory(path, html);
  }
  checkUniversal(path, html);
}

// Warnings: visible but non-fatal. Encourage variety without enforcing it.
for (const w of warnings) process.stdout.write(`warning: ${w}\n`);

if (violations.length > 0) {
  for (const v of violations) process.stderr.write(v + "\n");
  process.exit(1);
}
const warnNote = warnings.length > 0 ? ` (${warnings.length} warning${warnings.length === 1 ? "" : "s"})` : "";
process.stdout.write(`OK: archetype-check passed for ${root}${warnNote}\n`);
