#!/usr/bin/env node
// decisions/cover-domains.mjs — Pick the day's items with domain coverage
// and a per-domain cap. Mirrors the algorithm in SKILL.md Step 4 (lines
// 131-152). Caller (Claude in SKILL.md) wraps the returned rank_nn with
// the YYYY-MM-DD- prefix to produce the final news_id.
//
// Library use:
//   import { coverDomains } from "./decisions/cover-domains.mjs";
//   const r = coverDomains(scoredCandidates);
//
// CLI use:
//   cat scored.json | node skills/daily-news/scripts/decisions/cover-domains.mjs
//
// Stdout: JSON object { selected, skipped_domains, capped_domains }.

import { readFileSync } from "node:fs";

const DEFAULT_TARGET = 10;
const DEFAULT_MIN_DOMAINS = 4;
const DEFAULT_PER_DOMAIN_CAP = 6;
const PRIORITY_DOMAINS = ["ai", "systems", "infra", "web", "backend"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function countByDomain(items) {
  const m = new Map();
  for (const it of items) m.set(it.domain, (m.get(it.domain) ?? 0) + 1);
  return m;
}

export function coverDomains(candidates, opts = {}) {
  if (!Array.isArray(candidates)) {
    throw new Error("coverDomains: expected an array");
  }
  const target = opts.target ?? DEFAULT_TARGET;
  const minDomains = opts.minDomains ?? DEFAULT_MIN_DOMAINS;
  const perDomainCap = opts.perDomainCap ?? DEFAULT_PER_DOMAIN_CAP;

  // Sort by score desc (stable on score ties — ranked by input order).
  const sorted = [...candidates].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const remaining = [...sorted];

  // Step 1: take top `target`.
  let selected = remaining.splice(0, target);

  // Step 2: enforce minDomains via swap.
  while (true) {
    const counts = countByDomain(selected);
    const uncovered = PRIORITY_DOMAINS.filter((d) => !counts.has(d));
    if (selected.length === 0) break;
    if (PRIORITY_DOMAINS.length - uncovered.length >= minDomains) break;

    // Pick highest-score remaining in any uncovered domain.
    const swapIn = remaining.find((c) => uncovered.includes(c.domain));
    if (!swapIn) break;  // sparse day

    // Find over-represented domain to evict from (≥2 in selected).
    const over = [...counts.entries()].find(([, n]) => n >= 2);
    if (!over) break;
    const overDomain = over[0];
    // Evict the lowest-score in that domain.
    let evictIdx = -1, evictScore = Infinity;
    for (let i = 0; i < selected.length; i++) {
      if (selected[i].domain === overDomain && (selected[i].score ?? 0) < evictScore) {
        evictIdx = i;
        evictScore = selected[i].score ?? 0;
      }
    }
    if (evictIdx < 0) break;
    const evicted = selected.splice(evictIdx, 1)[0];
    remaining.splice(remaining.indexOf(swapIn), 1);
    remaining.push(evicted);
    selected.push(swapIn);
  }

  // Step 3: enforce perDomainCap.
  const cappedDiagnostics = [];
  while (true) {
    const counts = countByDomain(selected);
    const over = [...counts.entries()].find(([, n]) => n > perDomainCap);
    if (!over) break;
    const [overDomain, qualifying] = over;
    let evictIdx = -1, evictScore = Infinity;
    for (let i = 0; i < selected.length; i++) {
      if (selected[i].domain === overDomain && (selected[i].score ?? 0) < evictScore) {
        evictIdx = i;
        evictScore = selected[i].score ?? 0;
      }
    }
    const evicted = selected.splice(evictIdx, 1)[0];
    remaining.push(evicted);
    cappedDiagnostics.push({ domain: overDomain, qualifying, kept: perDomainCap });
    // Backfill from under-represented domains.
    const currentCounts = countByDomain(selected);
    const under = PRIORITY_DOMAINS.filter((d) => (currentCounts.get(d) ?? 0) < perDomainCap);
    const backfill = remaining
      .filter((c) => under.includes(c.domain))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    if (backfill) {
      remaining.splice(remaining.indexOf(backfill), 1);
      selected.push(backfill);
    }
  }

  // Step 4: re-sort selected by score desc and assign rank_nn.
  selected.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  selected = selected.map((c, i) => ({ ...c, rank_nn: pad2(i + 1) }));

  // Diagnostics: skipped domains.
  const finalCounts = countByDomain(selected);
  const skipped = [];
  for (const d of PRIORITY_DOMAINS) {
    if (finalCounts.has(d)) continue;
    const hasRemaining = remaining.some((c) => c.domain === d);
    skipped.push({
      domain: d,
      reason: hasRemaining ? "displaced for diversity" : "no qualifying candidates",
    });
  }

  return {
    selected,
    skipped_domains: skipped,
    capped_domains: cappedDiagnostics,
  };
}

// CLI ----------------------------------------------------------------------

async function readStdin() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const raw = await readStdin();
  const scored = JSON.parse(raw);
  const result = coverDomains(scored);
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}
