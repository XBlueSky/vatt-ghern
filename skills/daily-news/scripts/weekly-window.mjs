#!/usr/bin/env node
// weekly-window.mjs — Resolve which ISO week (Mon–Sun) a weekly rollup covers.
//
// The rollup runs Monday morning and summarises the week that just *ended*.
// Anchoring the window on the run day instead (`--days=7` with no `--end`)
// yields Tue..Mon, which straddles two ISO weeks: it drops the covered week's
// Monday and pulls in the run day's own daily posts. That disagrees with how
// the archive buckets posts (`weeksWithPosts` in eleventy.config.js keys weeks
// by `isoWeekKey(range.start)`) and, on a 3-posts-per-week cadence, can leave
// a Monday's posts in a window that never gets a rollup at all.
//
// Library use:
//   import { computeWeeklyWindow } from "./weekly-window.mjs";
//   const w = computeWeeklyWindow({ today: "2026-09-14" });
//
// CLI use:
//   node skills/daily-news/scripts/weekly-window.mjs
//   node skills/daily-news/scripts/weekly-window.mjs --today=2026-09-14
//   node skills/daily-news/scripts/weekly-window.mjs --week=2026-W37
//
// Stdout: JSON { today, publish_date, week_key, week_number, start, end,
//                title_prefix }.

import { isoWeekKey, isoWeekRange } from "../../../scripts/iso-week.mjs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const WEEK_RE = /^\d{4}-W\d{2}$/;

function todayInTaipei() {
  const now = new Date();
  const d = new Date(now.getTime() + 8 * 3600 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function shiftDays(ymd, n) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + n * 86400 * 1000);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

export function computeWeeklyWindow(opts = {}) {
  const { week = null } = opts;
  const today = opts.today || todayInTaipei();
  if (!DATE_RE.test(today)) {
    throw new Error("computeWeeklyWindow: today must be YYYY-MM-DD");
  }

  let weekKey;
  if (week) {
    if (!WEEK_RE.test(week)) {
      throw new Error("computeWeeklyWindow: week must be YYYY-Www");
    }
    weekKey = week;
  } else {
    // The last day of the week before the one containing `today`: step back
    // to this week's Monday, then one more day lands on that Sunday. Works
    // for a catch-up run on any weekday, not just Monday.
    const thisWeekMonday = isoWeekRange(isoWeekKey(today)).start;
    weekKey = isoWeekKey(shiftDays(thisWeekMonday, -1));
  }

  const { start, end } = isoWeekRange(weekKey);
  const weekNumber = Number(weekKey.split("-W")[1]);

  return {
    today,
    publish_date: today,
    week_key: weekKey,
    week_number: weekNumber,
    start,
    end,
    title_prefix: `第 ${weekNumber} 週`,
  };
}

// CLI ----------------------------------------------------------------------

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const opts = {};
  for (const a of process.argv.slice(2)) {
    if (a.startsWith("--today=")) opts.today = a.split("=")[1];
    else if (a.startsWith("--week=")) opts.week = a.split("=")[1];
    else {
      process.stderr.write(`Unknown arg: ${a}\n`);
      process.exit(2);
    }
  }
  let out;
  try {
    out = computeWeeklyWindow(opts);
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    process.exit(2);
  }
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}
