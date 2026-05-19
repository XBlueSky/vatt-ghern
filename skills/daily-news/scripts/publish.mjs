#!/usr/bin/env node
// publish.mjs — Validate a freshly-authored day's post directory.
//
// Strict mode helper: reads the YYYY/MM/DD/ dir of new posts, checks the
// sidecars are well-formed, the HTML files exist for each sidecar, and the
// archetype matches expected naming (roundup.html for daily-roundup,
// deep-<slug>.html for daily-deep-story). It does NOT do passthrough or
// rendering — that's Eleventy's job.
//
// Usage:
//   node skills/daily-news/scripts/publish.mjs src/posts/2026/05/16/
//
// Exit 0 = ok. Exit 1 = validation failure printed to stderr.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";

const targetDir = process.argv[2];
if (!targetDir) {
  process.stderr.write("Usage: publish.mjs <src/posts/YYYY/MM/DD/>\n");
  process.exit(2);
}
if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
  process.stderr.write(`No such directory: ${targetDir}\n`);
  process.exit(2);
}

const REQUIRED_FIELDS = [
  "title",
  "date",
  "archetype",
  "topics",
  "tags",
  "sources",
  "news_ids",
  "summary",
  "estimated_read_min",
];

const violations = [];
const sidecars = readdirSync(targetDir).filter((f) => f.endsWith(".11tydata.json"));

if (sidecars.length === 0) {
  violations.push(`${targetDir}: no sidecars (.11tydata.json) found`);
}

let roundupCount = 0;
let deepCount = 0;

for (const sidecarFile of sidecars) {
  const stem = sidecarFile.replace(/\.11tydata\.json$/, "");
  const htmlFile = `${stem}.html`;
  const htmlPath = join(targetDir, htmlFile);
  const sidecarPath = join(targetDir, sidecarFile);

  if (!existsSync(htmlPath)) {
    violations.push(`${sidecarPath}: missing companion HTML ${htmlFile}`);
    continue;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(sidecarPath, "utf8"));
  } catch (e) {
    violations.push(`${sidecarPath}: invalid JSON (${e.message})`);
    continue;
  }

  for (const field of REQUIRED_FIELDS) {
    if (!(field in data)) {
      violations.push(`${sidecarPath}: missing required field "${field}"`);
    }
  }
  if (!["daily-roundup", "daily-deep-story"].includes(data.archetype)) {
    violations.push(`${sidecarPath}: archetype must be "daily-roundup" or "daily-deep-story"`);
  }
  if (data.archetype === "daily-roundup") {
    roundupCount++;
    if (stem !== "roundup") {
      violations.push(`${sidecarPath}: daily-roundup file must be named "roundup.html" (got "${stem}.html")`);
    }
    const ids = data.news_ids || [];
    if (ids.length < 1 || ids.length > 12) {
      violations.push(`${sidecarPath}: roundup should have 1–12 news_ids, got ${ids.length}`);
    }
  }
  if (data.archetype === "daily-deep-story") {
    deepCount++;
    if (!stem.startsWith("deep-")) {
      violations.push(`${sidecarPath}: daily-deep-story file must start with "deep-" (got "${stem}.html")`);
    }
    if (!data.related_roundup) {
      violations.push(`${sidecarPath}: daily-deep-story must have "related_roundup" pointing at today's roundup`);
    }
    if (!Array.isArray(data.news_ids) || data.news_ids.length !== 1) {
      violations.push(`${sidecarPath}: deep-story should reference exactly 1 news_id (got ${data.news_ids?.length ?? 0})`);
    }
    // Widget contract: enforced on every daily-deep-story.
    if (typeof data.widget_count !== "number" || data.widget_count < 3) {
      violations.push(`${sidecarPath}: widget_count must be a number ≥ 3 (got ${data.widget_count})`);
    }
    if (!Array.isArray(data.widget_questions) || data.widget_questions.length === 0) {
      violations.push(`${sidecarPath}: widget_questions[] required and non-empty`);
    } else if (typeof data.widget_count === "number" && data.widget_questions.length !== data.widget_count) {
      violations.push(`${sidecarPath}: widget_count (${data.widget_count}) != widget_questions.length (${data.widget_questions.length})`);
    }
    if (!Array.isArray(data.widget_templates) || data.widget_templates.length === 0) {
      violations.push(`${sidecarPath}: widget_templates[] required and non-empty`);
    } else if (typeof data.widget_count === "number" && data.widget_templates.length !== data.widget_count) {
      violations.push(`${sidecarPath}: widget_count (${data.widget_count}) != widget_templates.length (${data.widget_templates.length})`);
    }
  }
  if (data.title && /[^：]:[^/]/.test(data.title)) {
    // half-width colon in title prose (excluding url-like x://y)
    violations.push(`${sidecarPath}: title contains half-width colon (use 「：」 instead)`);
  }
}

if (roundupCount > 1) {
  violations.push(`${targetDir}: must have exactly 1 daily-roundup, found ${roundupCount}`);
}
if (deepCount > 3) {
  violations.push(`${targetDir}: at most 3 daily-deep-story allowed per day, found ${deepCount}`);
}

if (violations.length > 0) {
  for (const v of violations) process.stderr.write(v + "\n");
  process.exit(1);
}

process.stdout.write(
  `OK: ${targetDir} valid (${roundupCount} roundup, ${deepCount} deep-story)\n`
);
