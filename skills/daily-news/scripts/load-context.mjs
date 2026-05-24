#!/usr/bin/env node
// load-context.mjs — Dump the daily-news skill's working context as JSON.
//
// Reads:
//   - today's date (UTC+8) — used for the YYYY/MM/DD path
//   - prior post sidecars under src/posts/YYYY/MM/DD/
//
// Writes (stdout): JSON blob with `today`, `past_news_ids`, `past_urls`,
//   `past_roundup_titles`, `past_deep_titles`.
//
// Window semantics (see dedup-context.mjs):
//   - `past_news_ids`, `past_urls` span the FULL archive — exact identifiers
//     are duplicates forever, so Step 3 manual filtering and Step 5d
//     `dedup-urls.mjs` catch a re-surfaced URL no matter how old.
//   - `past_roundup_titles`, `past_deep_titles` span the recent 7-day window
//     only — fuzzy title similarity is meant to suppress recent re-runs, not
//     legitimately recurring topics.
//
// Usage:
//   node skills/daily-news/scripts/load-context.mjs
//
// Returns exit 0 always (no-data scenarios are valid early-life output).

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { collectPastContext } from "./dedup-context.mjs";

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

const today = todayInTaipei();
const { pastNewsIds, pastUrls, pastRoundupTitles, pastDeepTitles } =
  collectPastContext(POSTS_DIR, today, { fuzzyDays: 7 });

process.stdout.write(
  JSON.stringify(
    {
      today,
      past_news_ids: [...pastNewsIds],
      past_urls: [...pastUrls],
      past_roundup_titles: pastRoundupTitles,
      past_deep_titles: pastDeepTitles,
    },
    null,
    2
  ) + "\n"
);
