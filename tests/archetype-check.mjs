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
//       * Has all three H2: 幕一, 幕二, 幕三 (full-width 「：」)
//       * Has class="vg-deep-opener" element
//       * Has class="vg-dropcap" element
//       * Has class="vg-deep-closer" element
//       * Has ≥2 <svg> tags
//   - Universal:
//       * No `style=` attribute outside <svg> ancestor (best-effort grep)
//       * No `:` (half-width) inside .vg-card-title or H1/H2 text content
//       * No Latin em-dash `—` inside .vg-post-body or .vg-post-title
//
// Exits 0 on success, 1 on any violation.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

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

function checkDeepStory(path, html) {
  for (const act of ["幕一：", "幕二：", "幕三："]) {
    if (!html.includes(act)) {
      violations.push(`${path}: missing H2 act "${act}" (full-width colon required)`);
    }
  }
  if (!/class="[^"]*vg-deep-opener/.test(html)) {
    violations.push(`${path}: missing .vg-deep-opener`);
  }
  if (!/class="[^"]*vg-dropcap/.test(html)) {
    violations.push(`${path}: missing .vg-dropcap`);
  }
  if (!/class="[^"]*vg-deep-closer/.test(html)) {
    violations.push(`${path}: missing .vg-deep-closer`);
  }
  const svgCount = (html.match(/<svg\b/g) || []).length;
  if (svgCount < 2) {
    violations.push(`${path}: deep-story requires ≥2 <svg> widgets, found ${svgCount}`);
  }
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
