#!/usr/bin/env node
// decisions/score.mjs — Add the +2 domain-coverage bonus to a
// Claude-supplied subjective_score (0–8 per rubric in
// references/archetypes.md). The subjective points (teaches non-obvious /
// actionable / substantial original) stay with Claude; this module only
// handles the objective coverage bonus to remove a class of arithmetic
// errors.
//
// Rule: a candidate's domain is "under-represented" if at most 2
// candidates in the day's harvest share its domain (including itself).
// Under-represented → coverage_bonus = 2. Else 0. Final score clamps to 10.
//
// Library use:
//   import { scoreCandidates } from "./decisions/score.mjs";
//   const scored = scoreCandidates(candidates);
//
// CLI use:
//   cat candidates.json | node skills/daily-news/scripts/decisions/score.mjs
//
// Stdout: JSON array of input candidates each augmented with
//   { coverage_bonus, score }.

import { readFileSync } from "node:fs";

const UNDER_REPRESENTED_THRESHOLD = 2;

export function scoreCandidates(candidates) {
  if (!Array.isArray(candidates)) {
    throw new Error("scoreCandidates: expected an array");
  }
  const counts = new Map();
  for (const c of candidates) {
    counts.set(c.domain, (counts.get(c.domain) ?? 0) + 1);
  }
  return candidates.map((c) => {
    if (typeof c.subjective_score !== "number") {
      throw new Error(`scoreCandidates: candidate ${c.url} missing subjective_score`);
    }
    const bonus = counts.get(c.domain) <= UNDER_REPRESENTED_THRESHOLD ? 2 : 0;
    const total = Math.min(10, c.subjective_score + bonus);
    return { ...c, coverage_bonus: bonus, score: total };
  });
}

// CLI ----------------------------------------------------------------------

async function readStdin() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  let raw;
  const inArg = process.argv.indexOf("--in");
  if (inArg >= 0) {
    raw = readFileSync(process.argv[inArg + 1], "utf8");
  } else {
    raw = await readStdin();
  }
  const candidates = JSON.parse(raw);
  const scored = scoreCandidates(candidates);
  process.stdout.write(JSON.stringify(scored, null, 2) + "\n");
}
