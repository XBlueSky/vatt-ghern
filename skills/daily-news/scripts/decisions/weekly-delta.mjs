#!/usr/bin/env node
// decisions/weekly-delta.mjs — Compute domain-share shift and tag
// movement between THIS week and LAST week. Advisory output for the
// weekly-rollup archetype's "本週劢頭" H2.
//
// Library use:
//   import { computeWeeklyDelta } from "./decisions/weekly-delta.mjs";
//   const r = computeWeeklyDelta({ end: "2026-05-25" });
//
// CLI use:
//   node skills/daily-news/scripts/decisions/weekly-delta.mjs --end=2026-05-25
//
// Stdout: JSON { range_this, range_last, domain_shift, tag_movement,
//                totals, note? }.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const LOAD_PATH = join(here, "..", "load-past-roundups.mjs");

const PRIORITY_DOMAINS = ["ai", "systems", "infra", "web", "backend"];
const LEGACY_DOMAINS = new Set(["storage", "industry"]);

const TAG_NEW_MIN = 2;
const TAG_NEW_CAP = 8;
const TAG_SURGE_DELTA = 2;
const TAG_SURGE_MIN = 3;
const TAG_SURGE_CAP = 5;
const TAG_FADED_DELTA = 2;
const TAG_FADED_MIN = 3;
const TAG_FADED_CAP = 5;

function defaultLoader(days, end) {
  const r = spawnSync(process.execPath,
    [LOAD_PATH, `--days=${days}`, `--end=${end}`],
    { encoding: "utf8" });
  if (r.status !== 0) {
    throw new Error(`load-past-roundups failed: ${r.stderr}`);
  }
  return JSON.parse(r.stdout);
}

export function computeWeeklyDelta(opts) {
  const { end, loader = defaultLoader } = opts;
  if (!end || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    throw new Error("computeWeeklyDelta: end must be YYYY-MM-DD");
  }

  const all = loader(14, end);
  const cutoff = subtractDays(end, 7);
  const startThis = subtractDays(end, 6);
  const startLast = subtractDays(end, 13);

  const thisWeek = filterByRange(all, startThis, end);
  const lastWeek = filterByRange(all, startLast, cutoff);

  const thisItems = countItems(thisWeek);
  const lastItems = countItems(lastWeek);

  const note = decideNote(thisItems, lastItems);
  if (note) {
    return {
      range_this: { start: startThis, end },
      range_last: { start: startLast, end: cutoff },
      domain_shift: [],
      tag_movement: { new_this_week: [], surge: [], faded: [] },
      totals: { this_week_items: thisItems.total, last_week_items: lastItems.total },
      note,
    };
  }

  return {
    range_this: { start: startThis, end },
    range_last: { start: startLast, end: cutoff },
    domain_shift: computeDomainShift(thisItems, lastItems),
    tag_movement: computeTagMovement(thisItems, lastItems),
    totals: { this_week_items: thisItems.total, last_week_items: lastItems.total },
  };
}

function subtractDays(ymd, n) {
  const [y, m, d] = ymd.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d) - n * 86400 * 1000;
  const dt = new Date(ms);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function filterByRange(loaded, startStr, endStr) {
  const inRange = (date) => date >= startStr && date <= endStr;
  return {
    roundups: loaded.roundups.filter((r) => inRange(r.date)),
    deep_stories: loaded.deep_stories.filter((d) => inRange(d.date)),
  };
}

function decideNote(thisItems, lastItems) {
  if (thisItems.total === 0) return "this_week_empty";
  if (lastItems.total === 0) return "last_week_empty";
  return null;
}

function countItems(window) {
  const by_domain = new Map();
  const by_tag = new Map();
  let total = 0;

  for (const r of window.roundups) {
    const itemCount = (r.news_ids || []).length;
    if (itemCount === 0) continue;
    total += itemCount;
    const domains = (r.topics || [])
      .filter((t) => t !== "roundup")
      .map((t) => LEGACY_DOMAINS.has(t) ? "legacy" : t)
      .filter((t) => PRIORITY_DOMAINS.includes(t) || t === "legacy");
    if (domains.length === 0) continue;
    const share = itemCount / domains.length;
    for (const d of domains) {
      by_domain.set(d, (by_domain.get(d) ?? 0) + share);
    }
    for (const tag of (r.tags || [])) {
      by_tag.set(tag, (by_tag.get(tag) ?? 0) + 1);
    }
  }

  for (const d of window.deep_stories) {
    total += 1;
    const dom = (d.topics || [])[0];
    if (dom) {
      const norm = LEGACY_DOMAINS.has(dom) ? "legacy" : dom;
      if (PRIORITY_DOMAINS.includes(norm) || norm === "legacy") {
        by_domain.set(norm, (by_domain.get(norm) ?? 0) + 1);
      }
    }
    for (const tag of (d.tags || [])) {
      by_tag.set(tag, (by_tag.get(tag) ?? 0) + 1);
    }
  }

  for (const [k, v] of by_domain.entries()) {
    by_domain.set(k, Math.round(v * 100) / 100);
  }

  return { total, by_domain, by_tag };
}

function computeDomainShift(thisItems, lastItems) {
  const out = [];
  const order = [...PRIORITY_DOMAINS];
  if (thisItems.by_domain.has("legacy") || lastItems.by_domain.has("legacy")) {
    order.push("legacy");
  }
  for (const domain of order) {
    const thisCount = thisItems.by_domain.get(domain) ?? 0;
    const lastCount = lastItems.by_domain.get(domain) ?? 0;
    const thisPct = thisItems.total > 0
      ? Math.round((thisCount / thisItems.total) * 1000) / 10
      : 0;
    const lastPct = lastItems.total > 0
      ? Math.round((lastCount / lastItems.total) * 1000) / 10
      : 0;
    out.push({
      domain,
      this_week_count: thisCount,
      last_week_count: lastCount,
      this_week_pct: thisPct,
      last_week_pct: lastPct,
      delta_pp: Math.round((thisPct - lastPct) * 10) / 10,
    });
  }
  return out;
}

function computeTagMovement(thisItems, lastItems) {
  const allTags = new Set([
    ...thisItems.by_tag.keys(),
    ...lastItems.by_tag.keys(),
  ]);

  const newThisWeek = [];
  const surge = [];
  const faded = [];

  for (const tag of allTags) {
    const t = thisItems.by_tag.get(tag) ?? 0;
    const l = lastItems.by_tag.get(tag) ?? 0;
    const delta = t - l;

    if (l === 0 && t >= TAG_NEW_MIN) {
      newThisWeek.push({ tag, count: t });
      continue;
    }
    if (delta >= TAG_SURGE_DELTA && t >= TAG_SURGE_MIN) {
      surge.push({ tag, this: t, last: l, delta });
      continue;
    }
    if (-delta >= TAG_FADED_DELTA && l >= TAG_FADED_MIN) {
      faded.push({ tag, this: t, last: l, delta });
    }
  }

  newThisWeek.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  surge.sort((a, b) => b.delta - a.delta || a.tag.localeCompare(b.tag));
  faded.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.tag.localeCompare(b.tag));

  return {
    new_this_week: newThisWeek.slice(0, TAG_NEW_CAP),
    surge: surge.slice(0, TAG_SURGE_CAP),
    faded: faded.slice(0, TAG_FADED_CAP),
  };
}

// CLI ----------------------------------------------------------------------

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  let end = null;
  for (const a of process.argv.slice(2)) {
    if (a.startsWith("--end=")) end = a.split("=")[1];
    else if (a.startsWith("--")) {
      process.stderr.write(`Unknown arg: ${a}\n`);
      process.exit(2);
    }
  }
  if (!end) {
    process.stderr.write("Usage: weekly-delta.mjs --end=YYYY-MM-DD\n");
    process.exit(2);
  }
  const r = computeWeeklyDelta({ end });
  process.stdout.write(JSON.stringify(r, null, 2) + "\n");
}
