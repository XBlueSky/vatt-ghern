#!/usr/bin/env node
// check-widget-static.mjs — static text scan for two script-invisible
// widget bugs (no browser needed):
//   #2  matter-of-fact-table rendered as <pre> instead of a real <table>
//   #11 SVG role=button widget with data-target rects but no bridge script
//
// See docs/superpowers/specs/2026-06-15-widget-antipattern-gate-design.md
// and the vatt-ghern-widget-gotchas memory (#2, #11).
//
// Usage:
//   node check-widget-static.mjs <dir-of-posts-or-html-files...>
// Exit 0 = clean. Exit 1 = at least one finding. Exit 2 = usage error.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Pure scanner: takes HTML text, returns an array of findings.
// A finding is { rule, file, detail }.
export function scanWidgetStatic(html, file) {
  const findings = [];

  // --- Rule #2: fake matter-of-fact-table ---------------------------------
  const figureRe = /<figure\b[^>]*\bclass="([^"]*)"[^>]*>([\s\S]*?)<\/figure>/gi;
  let m;
  while ((m = figureRe.exec(html)) !== null) {
    const cls = m[1];
    const body = m[2];
    if (/\bvg-w-table-[a-z0-9-]+/i.test(cls)) {
      if (!/<table\b/i.test(body)) {
        findings.push({
          rule: "fake-table",
          file,
          detail: `figure class="${cls}" has no <table> (rendered as <pre>?)`,
        });
      }
    }
  }

  // --- Rule #11: dead SVG role=button (data-target without bridge) ---------
  if (/\bdata-target=/.test(html)) {
    const hasBridge = /getAttribute\((['"])data-target\1\)/.test(html);
    if (!hasBridge) {
      findings.push({
        rule: "dead-svg-button",
        file,
        detail: "data-target rects present but no getAttribute('data-target') bridge script",
      });
    }
  }

  return findings;
}

function collectFiles(args) {
  const files = [];
  for (const a of args) {
    let st;
    try {
      st = statSync(a);
    } catch {
      return null;
    }
    if (st.isDirectory()) {
      for (const name of readdirSync(a)) {
        if (name.endsWith(".html")) files.push(join(a, name));
      }
    } else if (a.endsWith(".html")) {
      files.push(a);
    }
  }
  return files;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    process.stderr.write("usage: check-widget-static.mjs <dir-or-html...>\n");
    process.exit(2);
  }
  const files = collectFiles(args);
  if (files === null || files.length === 0) {
    process.stderr.write("no .html files found at the given path(s)\n");
    process.exit(2);
  }
  const all = [];
  for (const f of files) {
    const html = readFileSync(f, "utf8");
    all.push(...scanWidgetStatic(html, f));
  }
  for (const f of all) {
    process.stderr.write(`FAIL [${f.rule}] ${f.file}: ${f.detail}\n`);
  }
  process.stdout.write(
    JSON.stringify({ verdict: all.length ? "FAIL" : "PASS", findings: all }, null, 2) + "\n"
  );
  process.exit(all.length ? 1 : 0);
}

import { fileURLToPath } from "node:url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
