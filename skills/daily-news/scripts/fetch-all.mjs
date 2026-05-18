#!/usr/bin/env node
// fetch-all.mjs — Dispatch every source in the registry to its fetcher,
// merge candidates, accumulate deferred html_index records, accumulate
// sitemap state_diffs, and write web-state.json back when not in dry-run.
//
// Library use:
//   import { fetchAll } from "./fetch-all.mjs";
//   const r = await fetchAll({ filter, fetchImpl, priorWebState, writeState });
//
// CLI use:
//   node skills/daily-news/scripts/fetch-all.mjs                 # all sources, write state
//   node skills/daily-news/scripts/fetch-all.mjs --dry-run       # no state write
//   node skills/daily-news/scripts/fetch-all.mjs --type=arxiv
//   node skills/daily-news/scripts/fetch-all.mjs --tier=4

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSources } from "./registry.mjs";
import { fetch as arxivFetch } from "./fetchers/arxiv.mjs";
import { fetch as hfFetch } from "./fetchers/hf.mjs";
import { fetch as sitemapFetch } from "./fetchers/sitemap-diff.mjs";
import { fetch as lobstersFetch } from "./fetchers/lobsters-json.mjs";
import { fetch as htmlIndexFetch } from "./fetchers/html-index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, "..", "..", "..");
const WEB_STATE_PATH = join(REPO_ROOT, "src", "_data", "web-state.json");

const FETCHERS = {
  arxiv: arxivFetch,
  hf: hfFetch,
  sitemap: sitemapFetch,
  lobsters_json: lobstersFetch,
  html_index: htmlIndexFetch,
};

function readWebState() {
  if (!existsSync(WEB_STATE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(WEB_STATE_PATH, "utf8"));
  } catch {
    return {};
  }
}

export async function fetchAll({ filter = {}, fetchImpl, priorWebState, writeState = false } = {}) {
  const sources = loadSources(filter);
  const priorState = priorWebState ?? readWebState();
  const allCandidates = [];
  const deferred = [];
  const stateDiffs = {};
  const failures = [];

  for (const record of sources) {
    const fn = FETCHERS[record.type];
    if (!fn) {
      failures.push({ id: record.id, error: `no fetcher for type ${record.type}` });
      continue;
    }
    const ctx = {
      fetchImpl,
      priorState: priorState[record.id] || {},
    };
    try {
      const out = await fn(record, ctx);
      if (out.candidates) allCandidates.push(...out.candidates);
      if (out.deferred) deferred.push(out.deferred);
      if (out.state_diff) stateDiffs[record.id] = out.state_diff;
    } catch (e) {
      failures.push({ id: record.id, error: String(e.message || e) });
    }
  }

  if (writeState && Object.keys(stateDiffs).length > 0) {
    const next = { ...priorState, ...stateDiffs };
    writeFileSync(WEB_STATE_PATH, JSON.stringify(next, null, 2) + "\n");
  }

  return { candidates: allCandidates, deferred, state_diffs: stateDiffs, failures };
}

function parseCliArgs(argv) {
  const out = { dryRun: false, filter: {} };
  for (const a of argv.slice(2)) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a.startsWith("--tier=")) out.filter.tier = Number(a.split("=")[1]);
    else if (a.startsWith("--type=")) out.filter.type = a.split("=")[1];
    else if (a.startsWith("--id=")) out.filter.id = a.split("=")[1];
    else {
      process.stderr.write(`Unknown arg: ${a}\n`);
      process.exit(2);
    }
  }
  return out;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const args = parseCliArgs(process.argv);
  fetchAll({ filter: args.filter, writeState: !args.dryRun })
    .then((r) => {
      process.stdout.write(
        JSON.stringify(
          {
            candidate_count: r.candidates.length,
            deferred_count: r.deferred.length,
            state_updated: !args.dryRun && Object.keys(r.state_diffs).length > 0,
            failures: r.failures,
          },
          null,
          2
        ) + "\n"
      );
      if (r.failures.length > 0) process.exit(1);
    })
    .catch((e) => {
      process.stderr.write(`fetch-all fatal: ${e.message}\n`);
      process.exit(2);
    });
}
