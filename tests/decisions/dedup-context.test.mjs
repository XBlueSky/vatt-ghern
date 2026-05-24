import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  canonicalizeUrl,
  shiftDateKey,
  collectPastContext,
} from "../../skills/daily-news/scripts/dedup-context.mjs";

// Build a throwaway src/posts tree and return its path. `days` maps a
// "YYYY-MM-DD" key to an array of sidecar objects for that day.
function makePostsTree(days) {
  const root = mkdtempSync(join(tmpdir(), "vg-dedup-"));
  for (const [key, sidecars] of Object.entries(days)) {
    const [y, m, d] = key.split("-");
    const dir = join(root, y, m, d);
    mkdirSync(dir, { recursive: true });
    sidecars.forEach((sc, i) => {
      writeFileSync(join(dir, `${i}.11tydata.json`), JSON.stringify(sc));
    });
  }
  return root;
}

test("canonicalizeUrl strips utm_*, hash, trailing slash, lowercases", () => {
  assert.equal(
    canonicalizeUrl("https://blog.cloudflare.com/quic-death-spiral-fix/?utm_source=x#frag"),
    "https://blog.cloudflare.com/quic-death-spiral-fix"
  );
});

test("shiftDateKey crosses month boundaries", () => {
  assert.equal(shiftDateKey("2026-05-24", -7), "2026-05-17");
  assert.equal(shiftDateKey("2026-05-01", -1), "2026-04-30");
});

test("regression: same source URL 8 days apart is an exact-match duplicate", () => {
  // The 2026-05-24 escape: 5/16 deep-stories re-surfaced as candidates and
  // passed the old 7-day window (which only covered 5/17..5/23).
  const root = makePostsTree({
    "2026-05-16": [
      {
        archetype: "daily-deep-story",
        title: "QUIC 的死亡螺旋",
        news_ids: ["2026-05-16-01"],
        sources: ["https://blog.cloudflare.com/quic-death-spiral-fix/"],
      },
    ],
  });
  try {
    const { pastUrls, pastDeepTitles } = collectPastContext(root, "2026-05-24", {
      fuzzyDays: 7,
    });
    // Exact URL is caught across the full archive...
    assert.ok(
      pastUrls.has("https://blog.cloudflare.com/quic-death-spiral-fix"),
      "8-day-old source URL must be in the full-archive set"
    );
    // ...but the fuzzy title pool does NOT reach back to 5/16 (>7 days).
    assert.equal(
      pastDeepTitles.length,
      0,
      "title from 8 days ago must fall outside the 7-day fuzzy window"
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fuzzy title pools include the recent window but exclude older days", () => {
  const root = makePostsTree({
    "2026-05-16": [
      { archetype: "daily-deep-story", title: "OLD deep", sources: ["https://old"] },
    ],
    "2026-05-21": [
      { archetype: "daily-roundup", title: "RECENT roundup", sources: ["https://r"] },
      { archetype: "daily-deep-story", title: "RECENT deep", sources: ["https://d"] },
    ],
  });
  try {
    const ctx = collectPastContext(root, "2026-05-24", { fuzzyDays: 7 });
    assert.deepEqual(ctx.pastRoundupTitles, ["RECENT roundup"]);
    assert.deepEqual(ctx.pastDeepTitles, ["RECENT deep"]);
    // Exact identifiers still span everything, including 5/16.
    assert.ok(ctx.pastUrls.has("https://old"));
    assert.ok(ctx.pastUrls.has("https://d"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("today's own directory never matches itself", () => {
  const root = makePostsTree({
    "2026-05-24": [
      { archetype: "daily-deep-story", title: "today", news_ids: ["2026-05-24-01"], sources: ["https://today"] },
    ],
  });
  try {
    const ctx = collectPastContext(root, "2026-05-24", { fuzzyDays: 7 });
    assert.equal(ctx.pastUrls.size, 0);
    assert.equal(ctx.pastNewsIds.size, 0);
    assert.equal(ctx.pastDeepTitles.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("missing archive returns empty collections, does not throw", () => {
  const ctx = collectPastContext(join(tmpdir(), "vg-nonexistent-xyz"), "2026-05-24");
  assert.equal(ctx.pastUrls.size, 0);
  assert.equal(ctx.pastNewsIds.size, 0);
});
