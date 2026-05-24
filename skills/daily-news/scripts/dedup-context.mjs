// dedup-context.mjs — shared past-context collection for the daily-news
// anti-duplication checks (Step 1 baseline via load-context.mjs, Step 8 gate
// via check-dup.mjs).
//
// Two dedup axes with DIFFERENT lookback windows:
//
//   - Exact identifiers (canonical source URL, news_id): matched against the
//     FULL archive. A story covered once is a duplicate forever — a genuine
//     follow-up gets a different URL (see anti-duplication.md edge cases), and
//     intentional re-coverage uses the `override_dup_check` sidecar flag.
//
//   - Fuzzy title similarity: matched only against a recent window
//     (default 7 days). Topics legitimately recur, so a long fuzzy window
//     would over-suppress genuinely evolving coverage.
//
// Why the split exists: the 2026-05-24 run re-published the 2026-05-16 QUIC
// death-spiral and ClickHouse query-planner deep-stories — identical source
// URLs, 8 days apart. The Cloudflare blog is an `html_index` source with no
// per-URL fetch memory, so it re-surfaces prominent posts as candidates every
// day. The old uniform 7-day window sat one day short of 5/16, so neither the
// baseline nor the gate saw the collision. Scanning exact identifiers across
// the full archive closes that class of escape without widening the fuzzy
// title window.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

export function canonicalizeUrl(u) {
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
    return (u || "").toLowerCase();
  }
}

export function bigrams(s) {
  const clean = s.replace(/\s+/g, "").toLowerCase();
  const out = new Set();
  for (let i = 0; i < clean.length - 1; i++) out.add(clean.slice(i, i + 2));
  return out;
}

export function jaccardSim(a, b) {
  const A = bigrams(a),
    B = bigrams(b);
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

// Shift a "YYYY-MM-DD" key by deltaDays (UTC), returning a new key string.
export function shiftDateKey(key, deltaDays) {
  const [y, m, d] = key.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + deltaDays * 86400 * 1000;
  const dt = new Date(t);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

// Enumerate every YYYY/MM/DD day directory present under postsDir.
function listDayDirs(postsDir) {
  const out = [];
  if (!existsSync(postsDir)) return out;
  for (const y of readdirSync(postsDir)) {
    if (!/^\d{4}$/.test(y)) continue;
    const yDir = join(postsDir, y);
    if (!statSync(yDir).isDirectory()) continue;
    for (const m of readdirSync(yDir)) {
      if (!/^\d{2}$/.test(m)) continue;
      const mDir = join(yDir, m);
      if (!statSync(mDir).isDirectory()) continue;
      for (const d of readdirSync(mDir)) {
        if (!/^\d{2}$/.test(d)) continue;
        const dDir = join(mDir, d);
        if (!statSync(dDir).isDirectory()) continue;
        out.push({ key: `${y}-${m}-${d}`, dir: dDir });
      }
    }
  }
  return out;
}

export function loadSidecarsInDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".11tydata.json"))
    .map((f) => {
      try {
        return JSON.parse(readFileSync(join(dir, f), "utf8"));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// Collect the anti-duplication ground truth for a given day.
//
//   postsDir  — repo's src/posts directory
//   todayKey  — "YYYY-MM-DD"; only days strictly before this are scanned
//   fuzzyDays — recent-window size for the fuzzy title pools (default 7)
//
// Returns:
//   pastNewsIds        Set<string>  — full archive
//   pastUrls           Set<string>  — full archive, canonicalized
//   pastRoundupTitles  string[]     — recent window only
//   pastDeepTitles     string[]     — recent window only
export function collectPastContext(postsDir, todayKey, { fuzzyDays = 7 } = {}) {
  const fuzzyCutoff = shiftDateKey(todayKey, -fuzzyDays);

  const pastNewsIds = new Set();
  const pastUrls = new Set();
  const pastRoundupTitles = [];
  const pastDeepTitles = [];

  for (const { key, dir } of listDayDirs(postsDir)) {
    if (key >= todayKey) continue; // strictly before today; never self-match
    const inFuzzyWindow = key >= fuzzyCutoff;
    for (const data of loadSidecarsInDir(dir)) {
      (data.news_ids || []).forEach((id) => pastNewsIds.add(id));
      (data.sources || []).forEach((u) => pastUrls.add(canonicalizeUrl(u)));
      if (inFuzzyWindow && data.title) {
        if (data.archetype === "daily-roundup") pastRoundupTitles.push(data.title);
        if (data.archetype === "daily-deep-story") pastDeepTitles.push(data.title);
      }
    }
  }

  return { pastNewsIds, pastUrls, pastRoundupTitles, pastDeepTitles };
}
