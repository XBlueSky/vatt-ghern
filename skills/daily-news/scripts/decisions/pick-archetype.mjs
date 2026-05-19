#!/usr/bin/env node
// decisions/pick-archetype.mjs — Encode the archetype decision tree from
// SKILL.md Step 5 (lines 221-228). Claude extracts the boolean signals
// from a deep-story cluster; this module returns the recommended
// archetype. Claude may override and records overrides in the PR body.
//
// Library use:
//   import { pickArchetype } from "./decisions/pick-archetype.mjs";
//   const r = pickArchetype({ signals: { ... } });
//
// CLI use:
//   cat signals.json | node skills/daily-news/scripts/decisions/pick-archetype.mjs
//
// Stdout: JSON object { archetype, matched_signal } — or array thereof
// when stdin is a JSON array of inputs.

import { readFileSync } from "node:fs";

export const ARCHETYPES = [
  "narrative", "technical-deep-dive", "investigation",
  "comparison", "explainer", "freeform",
];

export const REQUIRED_SIGNALS = [
  "time_ordered",
  "structural_exposition",
  "puzzle_with_hypotheses",
  "multiple_options",
  "concept_unknown",
  "hybrid_or_unclear",
];

export function pickArchetype(input) {
  if (!input || typeof input !== "object") {
    throw new Error("pickArchetype: expected an object with .signals");
  }
  const s = input.signals;
  if (!s || typeof s !== "object") {
    throw new Error("pickArchetype: missing signals object");
  }
  for (const k of REQUIRED_SIGNALS) {
    if (typeof s[k] !== "boolean") {
      throw new Error(`pickArchetype: signal ${k} must be boolean`);
    }
  }
  if (s.hybrid_or_unclear) return { archetype: "freeform", matched_signal: "hybrid_or_unclear" };
  if (s.time_ordered) return { archetype: "narrative", matched_signal: "time_ordered" };
  if (s.structural_exposition) return { archetype: "technical-deep-dive", matched_signal: "structural_exposition" };
  if (s.puzzle_with_hypotheses) return { archetype: "investigation", matched_signal: "puzzle_with_hypotheses" };
  if (s.multiple_options) return { archetype: "comparison", matched_signal: "multiple_options" };
  if (s.concept_unknown) return { archetype: "explainer", matched_signal: "concept_unknown" };
  return { archetype: "freeform", matched_signal: "default" };
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
  const input = JSON.parse(raw);
  if (Array.isArray(input)) {
    const r = input.map(pickArchetype);
    process.stdout.write(JSON.stringify(r, null, 2) + "\n");
  } else {
    const r = pickArchetype(input);
    process.stdout.write(JSON.stringify(r, null, 2) + "\n");
  }
}
