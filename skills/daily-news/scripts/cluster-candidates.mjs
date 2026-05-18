#!/usr/bin/env node
// cluster-candidates.mjs — Group candidates that look like the same story
// across sources. Two candidates cluster if their canonical URLs match
// OR their title token-Jaccard ≥ 0.6. Clusters are transitive (union-find).
// Within a cluster, the "primary" is the highest-tier variant (lowest
// tier number), then longest summary, then lowest source_id.
//
// Library use:
//   import { clusterCandidates } from "./cluster-candidates.mjs";
//   const clusters = clusterCandidates(candidates);
//
// CLI use:
//   cat candidates.json | node skills/daily-news/scripts/cluster-candidates.mjs
//   node skills/daily-news/scripts/cluster-candidates.mjs --in candidates.json
//
// Stdout: JSON array of {primary, variants}.

import { readFileSync } from "node:fs";

const TITLE_JACCARD_THRESHOLD = 0.6;
const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "into", "than",
  "your", "their", "you", "are", "was", "were", "have", "has", "but",
  "not", "can", "will", "all", "any", "out", "how", "why", "what", "when",
]);

function canonicalize(u) {
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
    return String(u || "").toLowerCase();
  }
}

function tokens(title) {
  const out = new Set();
  const words = String(title || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/);
  for (const w of words) {
    if (w.length >= 3 && !STOPWORDS.has(w)) out.add(w);
  }
  return out;
}

function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

// Union-find ---------------------------------------------------------------

function makeUF(n) {
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(x) {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }
  function union(a, b) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  }
  return { find, union };
}

// Primary selection --------------------------------------------------------

function pickPrimary(variants) {
  return [...variants].sort((a, b) => {
    if (a.source_tier !== b.source_tier) return a.source_tier - b.source_tier;
    const ls = (a.summary || "").length;
    const rs = (b.summary || "").length;
    if (ls !== rs) return rs - ls;
    return String(a.source_id).localeCompare(String(b.source_id));
  })[0];
}

// Public API ---------------------------------------------------------------

export function clusterCandidates(candidates) {
  const n = candidates.length;
  if (n === 0) return [];
  const uf = makeUF(n);
  const canon = candidates.map((c) => canonicalize(c.url));
  const toks = candidates.map((c) => tokens(c.title));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (canon[i] === canon[j] && canon[i] !== "") {
        uf.union(i, j);
        continue;
      }
      if (jaccard(toks[i], toks[j]) >= TITLE_JACCARD_THRESHOLD) {
        uf.union(i, j);
      }
    }
  }

  const groups = new Map();
  for (let i = 0; i < n; i++) {
    const r = uf.find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(candidates[i]);
  }

  return [...groups.values()].map((variants) => ({
    primary: pickPrimary(variants),
    variants,
  }));
}

// CLI ----------------------------------------------------------------------

function parseArgs(argv) {
  let inPath = null;
  for (const a of argv.slice(2)) {
    if (a.startsWith("--in=")) inPath = a.split("=")[1];
    else if (a === "--in") {
      // next arg is the path
      const idx = argv.indexOf(a);
      inPath = argv[idx + 1];
    } else if (a.startsWith("--")) {
      process.stderr.write(`Unknown arg: ${a}\n`);
      process.exit(2);
    }
  }
  return { inPath };
}

async function readStdin() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const { inPath } = parseArgs(process.argv);
  let raw;
  if (inPath) raw = readFileSync(inPath, "utf8");
  else raw = await readStdin();
  const candidates = JSON.parse(raw);
  if (!Array.isArray(candidates)) {
    process.stderr.write(`Expected a JSON array of candidates\n`);
    process.exit(2);
  }
  const clusters = clusterCandidates(candidates);
  process.stdout.write(JSON.stringify(clusters, null, 2) + "\n");
}
