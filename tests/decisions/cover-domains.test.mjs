import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { coverDomains } from "../../skills/daily-news/scripts/decisions/cover-domains.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(here, "..", "fixtures", "decisions");

test("cover-domains: matches golden fixture for 2026-05-19 bootstrap", () => {
  const scored = JSON.parse(readFileSync(join(FIXTURES, "scored-output.json"), "utf8"));
  const expected = JSON.parse(readFileSync(join(FIXTURES, "selected-output.json"), "utf8"));
  const actual = coverDomains(scored);
  assert.deepEqual(actual, expected);
});

test("cover-domains: sparse day accepts fewer items rather than padding", () => {
  const r = coverDomains([
    { url: "https://a", title: "A", domain: "ai", score: 9, source_id: "x", source_tier: 1 },
    { url: "https://b", title: "B", domain: "ai", score: 8, source_id: "x", source_tier: 1 },
    { url: "https://c", title: "C", domain: "ai", score: 7, source_id: "x", source_tier: 1 },
  ]);
  assert.equal(r.selected.length, 3);
  assert.equal(r.skipped_domains.length, 4);
  for (const s of r.skipped_domains) {
    assert.equal(s.reason, "no qualifying candidates");
  }
});

test("cover-domains: enforces ≤6 per-domain cap and reports capped", () => {
  // 10 AI items with the highest scores → top-10 == 10 AI → cap step
  // evicts 4 down to 6, backfills with lower-scored other-domain items.
  const flood = Array.from({ length: 10 }, (_, i) => ({
    url: `https://ai${i}`, title: `AI ${i}`, domain: "ai",
    score: 10, source_id: "x", source_tier: 1,
  }));
  const others = ["systems", "infra", "web", "backend"].map((d) => ({
    url: `https://${d}`, title: d, domain: d,
    score: 3, source_id: "x", source_tier: 1,
  }));
  const r = coverDomains([...flood, ...others]);
  const aiCount = r.selected.filter((c) => c.domain === "ai").length;
  assert.equal(aiCount, 6);
  assert.ok(r.capped_domains.length >= 1);
  const aiCap = r.capped_domains.find((c) => c.domain === "ai");
  assert.ok(aiCap, "expected 'ai' in capped_domains");
  assert.equal(aiCap.kept, 6);
});

test("cover-domains: rank_nn is zero-padded 01..NN in score order", () => {
  const r = coverDomains([
    { url: "https://a", title: "A", domain: "ai", score: 7, source_id: "x", source_tier: 1 },
    { url: "https://b", title: "B", domain: "systems", score: 9, source_id: "x", source_tier: 1 },
    { url: "https://c", title: "C", domain: "infra", score: 8, source_id: "x", source_tier: 1 },
  ]);
  assert.equal(r.selected[0].rank_nn, "01");
  assert.equal(r.selected[0].url, "https://b");
  assert.equal(r.selected[1].rank_nn, "02");
  assert.equal(r.selected[2].rank_nn, "03");
});

test("cover-domains: throws on non-array input", () => {
  assert.throws(() => coverDomains("not an array"), /expected an array/);
});
