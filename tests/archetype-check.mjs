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
//       * Universal contract: opener, dropcap, closer (with <strong>), ≥2 <svg>
//       * Per-archetype rules based on sidecar deep_archetype field
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
  // Progress span
  if (!/data-vg-progress-of="/.test(html)) {
    violations.push(`${path}: missing data-vg-progress-of span`);
  }
  if (!/data-vg-progress-total="/.test(html)) {
    violations.push(`${path}: missing data-vg-progress-total span`);
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
    violations.push(`${path}: missing .vg-dropcap`);
  }
  if (!/class="[^"]*vg-deep-closer/.test(html)) {
    violations.push(`${path}: missing .vg-deep-closer`);
  }
  if (!/<p[^>]*class="[^"]*vg-deep-closer[^"]*"[^>]*>[\s\S]*?<strong>/.test(html)) {
    violations.push(`${path}: .vg-deep-closer must contain a <strong> for the closing label`);
  }
  const svgCount = (html.match(/<svg\b/g) || []).length;
  if (svgCount < 2) {
    violations.push(`${path}: deep-story requires ≥2 <svg> widgets, found ${svgCount}`);
  }
}

function extractH2Texts(html) {
  return [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)]
    .map((m) => m[1].trim());
}

function checkNarrative(path, html) {
  const expected = ["what happened", "why it matters", "so what"];
  const actual = extractH2Texts(html);
  if (actual.length !== 3) {
    violations.push(`${path}: narrative requires exactly 3 H2 elements, found ${actual.length}`);
  }
  for (let i = 0; i < expected.length; i++) {
    if (actual[i] !== expected[i]) {
      violations.push(`${path}: narrative H2[${i}] expected "${expected[i]}", got "${actual[i] || "(missing)"}"`);
    }
  }
  if (!/<strong>Take-away<\/strong>/.test(html)) {
    violations.push(`${path}: narrative closer must use <strong>Take-away</strong> label`);
  }
}

function checkTechnicalDeepDive(path, html) {
  const actual = extractH2Texts(html);
  if (actual.length < 3 || actual.length > 5) {
    violations.push(`${path}: technical-deep-dive requires 3-5 H2 elements, found ${actual.length}`);
  }
  const banned = ["what happened", "why it matters", "so what", "observation", "the truth", "how to choose", "the core idea"];
  for (const h2 of actual) {
    if (banned.includes(h2.toLowerCase())) {
      violations.push(`${path}: technical-deep-dive H2 "${h2}" is banned (belongs to another archetype)`);
    }
  }
  if (!/<strong>What this enables<\/strong>/.test(html)) {
    violations.push(`${path}: technical-deep-dive closer must use <strong>What this enables</strong> label`);
  }
}

function checkInvestigation(path, html) {
  const actual = extractH2Texts(html);
  if (actual.length < 3) {
    violations.push(`${path}: investigation requires at least 3 H2 elements (observation + ≥1 hypothesis + the truth), found ${actual.length}`);
  }
  if (actual[0] !== "observation") {
    violations.push(`${path}: investigation H2[0] must be "observation", got "${actual[0] || "(missing)"}"`);
  }
  if (actual[actual.length - 1] !== "the truth") {
    violations.push(`${path}: investigation last H2 must be "the truth", got "${actual[actual.length - 1] || "(missing)"}"`);
  }
  const middle = actual.slice(1, -1);
  const hypothesisCount = middle.filter((h) => h.startsWith("hypothesis: ")).length;
  if (hypothesisCount < 1 || hypothesisCount > 3) {
    violations.push(`${path}: investigation requires 1-3 "hypothesis: ..." H2s, found ${hypothesisCount}`);
  }
  if (hypothesisCount !== middle.length) {
    violations.push(`${path}: investigation middle H2s must all start with "hypothesis: ", got: ${middle.join(", ")}`);
  }
  if (!/<strong>Take-away<\/strong>/.test(html)) {
    violations.push(`${path}: investigation closer must use <strong>Take-away</strong> label`);
  }
}

function checkComparison(path, html) {
  const actual = extractH2Texts(html);
  if (actual.length < 4 || actual.length > 6) {
    violations.push(`${path}: comparison requires 4-6 H2 elements (3-5 dimensions + how to choose), found ${actual.length}`);
  }
  const lastH2 = actual[actual.length - 1];
  if (lastH2 !== "how to choose") {
    violations.push(`${path}: comparison last H2 must be "how to choose", got "${lastH2 || "(missing)"}"`);
  }
  const dimensions = actual.slice(0, -1);
  if (dimensions.length < 3 || dimensions.length > 5) {
    violations.push(`${path}: comparison requires 3-5 "dimension: ..." H2s before "how to choose", found ${dimensions.length}`);
  }
  for (const h2 of dimensions) {
    if (!h2.startsWith("dimension: ")) {
      violations.push(`${path}: comparison H2 "${h2}" must start with "dimension: "`);
    }
  }
  const hasTable = /<table\b/.test(html);
  const hasComparisonSvg = /class="[^"]*vg-w-comparison-/.test(html);
  if (!hasTable && !hasComparisonSvg) {
    violations.push(`${path}: comparison requires either <table> or <svg class="vg-w-comparison-...">`);
  }
  if (!/<strong>Take-away<\/strong>/.test(html)) {
    violations.push(`${path}: comparison closer must use <strong>Take-away</strong> label`);
  }
}

function checkExplainer(path, html) {
  const expected = [
    "start with a concrete case",
    "where today's tools fall short",
    "the core idea",
    "what it actually looks like",
    "when you'd reach for it",
  ];
  const actual = extractH2Texts(html);
  if (actual.length !== 5) {
    violations.push(`${path}: explainer requires exactly 5 H2 elements, found ${actual.length}`);
  }
  for (let i = 0; i < expected.length; i++) {
    if (actual[i] !== expected[i]) {
      violations.push(`${path}: explainer H2[${i}] expected "${expected[i]}", got "${actual[i] || "(missing)"}"`);
    }
  }
  // The "what it actually looks like" section must contain code or svg
  const wialMatch = html.match(/<h2[^>]*>\s*what it actually looks like\s*<\/h2>([\s\S]*?)(?:<h2|<p[^>]*vg-deep-closer)/);
  if (wialMatch) {
    const section = wialMatch[1];
    if (!/<pre/.test(section) && !/<svg\b/.test(section)) {
      violations.push(`${path}: explainer "what it actually looks like" section must contain <pre><code> or <svg>`);
    }
  }
  if (!/<strong>Take-away<\/strong>/.test(html)) {
    violations.push(`${path}: explainer closer must use <strong>Take-away</strong> label`);
  }
}

function checkFreeform(path, html) {
  // Universal contract only — already checked by checkUniversalContract
  // No H2 constraints, no closer label constraints (label is free)
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

if (violations.length > 0) {
  for (const v of violations) process.stderr.write(v + "\n");
  process.exit(1);
}
process.stdout.write(`OK: archetype-check passed for ${root}\n`);
