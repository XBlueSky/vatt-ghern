#!/usr/bin/env node
// load-context.mjs — Dump the daily-news skill's working context as JSON.
//
// Reads:
//   - today's date (UTC+8) — used for the YYYY/MM/DD path
//   - past 7 days of post sidecars under src/posts/YYYY/MM/DD/
//
// Writes (stdout): JSON blob with `today`, `past_news_ids`, `past_urls`,
//   `past_roundup_titles`, `past_deep_titles`.
//
// Usage:
//   node skills/daily-news/scripts/load-context.mjs
//
// Returns exit 0 always (no-data scenarios are valid early-life output).

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the repo root: this script lives at
// <repo>/skills/daily-news/scripts/load-context.mjs
const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, "..", "..", "..");
const POSTS_DIR = join(REPO_ROOT, "src", "posts");

// Compute today in UTC+8.
function todayInTaipei() {
  const now = new Date();
  // Convert via UTC milliseconds + 8h offset
  const utc8Ms = now.getTime() + 8 * 3600 * 1000;
  const d = new Date(utc8Ms);
  // Read UTC fields (which now represent UTC+8 wall-clock)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function dateKeyToWindow(todayStr, daysBack = 7) {
  // Returns array of "YYYY-MM-DD" strings for the daysBack days BEFORE today.
  const [y, m, d] = todayStr.split("-").map(Number);
  const today = Date.UTC(y, m - 1, d);
  const out = [];
  for (let i = 1; i <= daysBack; i++) {
    const past = new Date(today - i * 86400 * 1000);
    out.push(
      `${past.getUTCFullYear()}-${String(past.getUTCMonth() + 1).padStart(2, "0")}-${String(past.getUTCDate()).padStart(2, "0")}`
    );
  }
  return out;
}

function readSidecarsForDay(dayStr) {
  // dayStr "YYYY-MM-DD"  -> path src/posts/YYYY/MM/DD/
  const [y, m, d] = dayStr.split("-");
  const dir = join(POSTS_DIR, y, m, d);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".11tydata.json"))
    .map((f) => {
      try {
        return JSON.parse(readFileSync(join(dir, f), "utf8"));
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
}

const today = todayInTaipei();
const pastDays = dateKeyToWindow(today, 7);

const past_news_ids = [];
const past_urls = [];
const past_roundup_titles = [];
const past_deep_titles = [];

for (const day of pastDays) {
  for (const sidecar of readSidecarsForDay(day)) {
    if (Array.isArray(sidecar.news_ids)) {
      past_news_ids.push(...sidecar.news_ids);
    }
    if (Array.isArray(sidecar.sources)) {
      past_urls.push(...sidecar.sources);
    }
    if (sidecar.archetype === "daily-roundup" && sidecar.title) {
      past_roundup_titles.push(sidecar.title);
    }
    if (sidecar.archetype === "daily-deep-story" && sidecar.title) {
      past_deep_titles.push(sidecar.title);
    }
  }
}

process.stdout.write(
  JSON.stringify(
    {
      today,
      past_news_ids: [...new Set(past_news_ids)],
      past_urls: [...new Set(past_urls)],
      past_roundup_titles,
      past_deep_titles,
    },
    null,
    2
  ) + "\n"
);
