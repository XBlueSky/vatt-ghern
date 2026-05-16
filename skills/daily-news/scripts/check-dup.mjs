#!/usr/bin/env node
// check-dup.mjs — Verify a freshly-authored day's posts do not collide with
// the prior 7 days.
//
// Reads:
//   - argv[2] = directory of today's posts, e.g. src/posts/2026/05/16/
//   - past 7 days' sidecars via the same logic as load-context.mjs
//
// Checks:
//   1. No news_id in today's sidecars collides with past 7 days' news_ids
//   2. No source URL in today's sidecars collides with past 7 days' sources
//      (after stripping ?utm_*, #fragment, trailing /)
//   3. No title cosine similarity > 0.85 between today's items and past
//      roundup items (rough char-bigram match — coarse but cheap)
//
// Sidecar may include `"override_dup_check": true` to skip per-file.
//
// Exit 0 = clean. Exit 1 = one or more collisions (printed to stderr).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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

function canonicalizeUrl(u) {
  try {
    const url = new URL(u);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_")) url.searchParams.delete(key);
    }
    let out = url.toString();
    if (out.endsWith("/")) out = out.slice(0, -1);
    return out.toLowerCase();
  } catch {
    return u.toLowerCase();
  }
}

function bigrams(s) {
  const clean = s.replace(/\s+/g, "").toLowerCase();
  const out = new Set();
  for (let i = 0; i < clean.length - 1; i++) out.add(clean.slice(i, i + 2));
  return out;
}

function jaccardSim(a, b) {
  const A = bigrams(a),
    B = bigrams(b);
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

function loadSidecarsInDir(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".11tydata.json"))
    .map((f) => ({ path: join(dir, f), data: JSON.parse(readFileSync(join(dir, f), "utf8")) }));
}

function todayKeyFromDir(dir) {
  // Expect dir ending in YYYY/MM/DD or YYYY/MM/DD/
  const parts = dir.replace(/\/+$/, "").split("/");
  return `${parts[parts.length - 3]}-${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
}

function pastDaysBefore(todayKey, n = 7) {
  const [y, m, d] = todayKey.split("-").map(Number);
  const today = Date.UTC(y, m - 1, d);
  const out = [];
  for (let i = 1; i <= n; i++) {
    const past = new Date(today - i * 86400 * 1000);
    out.push(
      `${past.getUTCFullYear()}-${String(past.getUTCMonth() + 1).padStart(2, "0")}-${String(past.getUTCDate()).padStart(2, "0")}`
    );
  }
  return out;
}

const today = todayKeyFromDir(targetDir);
const todaySidecars = loadSidecarsInDir(targetDir);
const pastDays = pastDaysBefore(today);

const pastNewsIds = new Set();
const pastUrls = new Set();
const pastRoundupTitles = [];
const pastDeepTitles = [];

for (const day of pastDays) {
  const [y, m, d] = day.split("-");
  const dir = join(POSTS_DIR, y, m, d);
  if (!existsSync(dir)) continue;
  for (const { data } of loadSidecarsInDir(dir)) {
    (data.news_ids || []).forEach((id) => pastNewsIds.add(id));
    (data.sources || []).forEach((u) => pastUrls.add(canonicalizeUrl(u)));
    if (data.archetype === "daily-roundup" && data.title) pastRoundupTitles.push(data.title);
    if (data.archetype === "daily-deep-story" && data.title) pastDeepTitles.push(data.title);
  }
}

const violations = [];

for (const { path: p, data } of todaySidecars) {
  if (data.override_dup_check === true) continue;

  for (const id of data.news_ids || []) {
    if (pastNewsIds.has(id)) {
      violations.push(`${p}: news_id "${id}" duplicates past 7 days`);
    }
  }
  for (const u of data.sources || []) {
    const canon = canonicalizeUrl(u);
    if (pastUrls.has(canon)) {
      violations.push(`${p}: source url "${u}" duplicates past 7 days`);
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
process.stdout.write(`OK: 0 duplicates in ${targetDir} vs past 7 days\n`);
