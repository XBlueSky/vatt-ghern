#!/usr/bin/env node
// load-past-roundups.mjs — Dump roundup + deep-story sidecars from the
// past N days as a JSON blob. Used by weekly and monthly rollup workflows.
//
// Usage:
//   node skills/daily-news/scripts/load-past-roundups.mjs --days=7
//   node skills/daily-news/scripts/load-past-roundups.mjs --days=30 --end=2026-05-31
//
// Stdout: JSON
//   {
//     range: { start, end },
//     roundups: [{ date, title, summary, news_ids, sources, ... }],
//     deep_stories: [{ date, title, summary, deep_archetype, news_ids, ... }]
//   }

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, "..", "..", "..");
const POSTS_DIR = join(REPO_ROOT, "src", "posts");

function parseArgs(argv) {
  const out = { days: 7, end: null };
  for (const a of argv.slice(2)) {
    if (a.startsWith("--days=")) out.days = Number(a.split("=")[1]);
    else if (a.startsWith("--end=")) out.end = a.split("=")[1];
    else if (a.startsWith("--")) {
      process.stderr.write(`Unknown arg: ${a}\n`);
      process.exit(2);
    }
  }
  if (!Number.isInteger(out.days) || out.days < 1) {
    process.stderr.write(`--days must be a positive integer\n`);
    process.exit(2);
  }
  return out;
}

function todayInTaipei() {
  const now = new Date();
  const utc8Ms = now.getTime() + 8 * 3600 * 1000;
  const d = new Date(utc8Ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function daysBack(endStr, n) {
  const [y, m, d] = endStr.split("-").map(Number);
  const end = Date.UTC(y, m - 1, d);
  const out = [];
  for (let i = 0; i < n; i++) {
    const past = new Date(end - i * 86400 * 1000);
    out.push(
      `${past.getUTCFullYear()}-${String(past.getUTCMonth() + 1).padStart(2, "0")}-${String(past.getUTCDate()).padStart(2, "0")}`
    );
  }
  return out;
}

function readSidecarsForDay(dayStr) {
  const [y, m, d] = dayStr.split("-");
  const dir = join(POSTS_DIR, y, m, d);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".11tydata.json"))
    .map((f) => {
      try {
        const data = JSON.parse(readFileSync(join(dir, f), "utf8"));
        return { date: dayStr, file: f, data };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

const args = parseArgs(process.argv);
const endStr = args.end || todayInTaipei();
const days = daysBack(endStr, args.days);
const startStr = days[days.length - 1];

const roundups = [];
const deep_stories = [];

for (const day of days) {
  for (const { data } of readSidecarsForDay(day)) {
    const slim = {
      date: day,
      title: data.title,
      summary: data.summary,
      tags: data.tags,
      topics: data.topics,
      news_ids: data.news_ids,
      sources: data.sources,
    };
    if (data.archetype === "daily-roundup") {
      roundups.push(slim);
    } else if (data.archetype === "daily-deep-story") {
      deep_stories.push({ ...slim, deep_archetype: data.deep_archetype });
    }
  }
}

process.stdout.write(JSON.stringify(
  { range: { start: startStr, end: endStr }, roundups, deep_stories },
  null, 2
) + "\n");
