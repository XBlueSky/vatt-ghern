#!/usr/bin/env node
// dedup-urls.mjs — Pre-dispatch URL dedup for deep-story candidates.
//
// Why: SKILL Step 3 instructs the agent to drop candidates whose canonical
// URL already appears in past_urls, but Step 3 is a manual check. The
// formal `check-dup.mjs` runs in Step 8, AFTER deep-story sub-agents are
// dispatched and have written their HTML. When dedup fires at Step 8, the
// affected deep-story is dropped with no refill — N goes from 3 to 2.
// PR #30 (2026-05-21) hit exactly this: GitHub eBPF deep-story was
// authored, then dropped on URL collision with the 5/16 roundup. The
// roundup recovered by swapping in Slack HTTP/3; the deep-story slot just
// stayed empty.
//
// This module runs at Step 5 — between picking deep-story candidates and
// dispatching sub-agents. It splits inputs into `kept` and `dropped`, so
// the agent can refill dropped slots from the next-best candidates *before*
// any sub-agent runs.
//
// Input (stdin, JSON):
//   {
//     "candidates": [{ "url": "...", "title": "...", ... }, ...],
//     "past_urls": ["..."]
//   }
//
// Output (stdout, JSON):
//   {
//     "kept":    [{ ...candidate, "dedup_reason": null }, ...],
//     "dropped": [{ ...candidate, "dedup_reason": "url-match-archive" }, ...]
//   }
//
// Drop rule: canonical URL match (strip utm_*, #fragment, trailing /).
// Exit 0 always; downstream decides what to do with the split.

function canonicalizeUrl(u) {
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

async function readStdin() {
  return new Promise((resolve, reject) => {
    let buf = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (buf += chunk));
    process.stdin.on("end", () => resolve(buf));
    process.stdin.on("error", reject);
  });
}

const raw = await readStdin();
let input;
try {
  input = JSON.parse(raw);
} catch (e) {
  process.stderr.write(`dedup-urls: invalid JSON on stdin: ${e.message}\n`);
  process.exit(2);
}

const candidates = Array.isArray(input.candidates) ? input.candidates : [];
const pastUrls = Array.isArray(input.past_urls) ? input.past_urls : [];
const pastSet = new Set(pastUrls.map(canonicalizeUrl));

const kept = [];
const dropped = [];
for (const c of candidates) {
  const canon = canonicalizeUrl(c.url || "");
  if (canon && pastSet.has(canon)) {
    dropped.push({ ...c, dedup_reason: `url-match-archive` });
  } else {
    kept.push({ ...c, dedup_reason: null });
  }
}

process.stdout.write(JSON.stringify({ kept, dropped }, null, 2) + "\n");
