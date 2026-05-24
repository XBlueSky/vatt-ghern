#!/usr/bin/env node
// check-dup.mjs — Verify a freshly-authored day's posts do not collide with
// prior coverage.
//
// Reads:
//   - argv[2] = directory of today's posts, e.g. src/posts/2026/05/16/
//   - prior posts via the shared dedup-context collector
//
// Checks:
//   1. No news_id in today's sidecars collides with ANY prior day's news_ids
//      (full archive).
//   2. No source URL in today's sidecars collides with ANY prior day's
//      sources (full archive, after stripping ?utm_*, #fragment, trailing /).
//   3. No title cosine similarity > threshold between today's items and
//      RECENT (past 7 days) titles — rough char-bigram match. Threshold is
//      0.85 for roundup items, 0.70 for deep-stories.
//
// Exact identifiers (1, 2) span the full archive because a source covered
// once is a duplicate forever; fuzzy titles (3) stay windowed because topics
// legitimately recur. See dedup-context.mjs for the rationale.
//
// Sidecar may include `"override_dup_check": true` to skip per-file.
//
// Exit 0 = clean. Exit 1 = one or more collisions (printed to stderr).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalizeUrl,
  jaccardSim,
  collectPastContext,
} from "./dedup-context.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, "..", "..", "..");
const POSTS_DIR = join(REPO_ROOT, "src", "posts");

const targetDir = process.argv[2];
if (!targetDir) {
  process.stderr.write("Usage: check-dup.mjs <src/posts/YYYY/MM/DD/>\n");
  process.exit(2);
}
if (!existsSync(targetDir)) {
  process.stderr.write(`No such directory: ${targetDir}\n`);
  process.exit(2);
}

function todayKeyFromDir(dir) {
  // Expect dir ending in YYYY/MM/DD or YYYY/MM/DD/
  const parts = dir.replace(/\/+$/, "").split("/");
  return `${parts[parts.length - 3]}-${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
}

const today = todayKeyFromDir(targetDir);
const todaySidecars = readdirSync(targetDir)
  .filter((f) => f.endsWith(".11tydata.json"))
  .map((f) => ({
    path: join(targetDir, f),
    data: JSON.parse(readFileSync(join(targetDir, f), "utf8")),
  }));

const { pastNewsIds, pastUrls, pastRoundupTitles, pastDeepTitles } =
  collectPastContext(POSTS_DIR, today, { fuzzyDays: 7 });

const violations = [];

for (const { path: p, data } of todaySidecars) {
  if (data.override_dup_check === true) continue;

  for (const id of data.news_ids || []) {
    if (pastNewsIds.has(id)) {
      violations.push(`${p}: news_id "${id}" duplicates prior coverage`);
    }
  }
  for (const u of data.sources || []) {
    const canon = canonicalizeUrl(u);
    if (pastUrls.has(canon)) {
      violations.push(`${p}: source url "${u}" duplicates prior coverage`);
    }
  }
  if (data.title) {
    const pool =
      data.archetype === "daily-roundup" ? pastRoundupTitles : pastDeepTitles;
    const threshold = data.archetype === "daily-roundup" ? 0.85 : 0.7;
    for (const past of pool) {
      const sim = jaccardSim(data.title, past);
      if (sim > threshold) {
        violations.push(
          `${p}: title similarity ${sim.toFixed(2)} > ${threshold} against past "${past}"`
        );
      }
    }
  }
}

if (violations.length > 0) {
  for (const v of violations) process.stderr.write(v + "\n");
  process.exit(1);
}
process.stdout.write(`OK: 0 duplicates in ${targetDir} vs prior coverage\n`);
