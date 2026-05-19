import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scoreCandidates } from "../../skills/daily-news/scripts/decisions/score.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(here, "..", "fixtures", "decisions");

test("score: matches golden fixture for 2026-05-19 bootstrap", () => {
  const input = JSON.parse(readFileSync(join(FIXTURES, "candidates-input.json"), "utf8"));
  const expected = JSON.parse(readFileSync(join(FIXTURES, "scored-output.json"), "utf8"));
  const actual = scoreCandidates(input);
  assert.deepEqual(actual, expected);
});

test("score: clamps to 10 when subjective + bonus > 10", () => {
  const r = scoreCandidates([
    { url: "https://a", title: "T", source_id: "x", source_tier: 1, domain: "rare", subjective_score: 9 },
  ]);
  assert.equal(r[0].coverage_bonus, 2);
  assert.equal(r[0].score, 10);
});

test("score: no bonus when domain has > 2 candidates", () => {
  const r = scoreCandidates([
    { url: "https://a", title: "T", source_id: "x", source_tier: 1, domain: "ai", subjective_score: 7 },
    { url: "https://b", title: "T", source_id: "x", source_tier: 1, domain: "ai", subjective_score: 7 },
    { url: "https://c", title: "T", source_id: "x", source_tier: 1, domain: "ai", subjective_score: 7 },
  ]);
  for (const c of r) {
    assert.equal(c.coverage_bonus, 0);
    assert.equal(c.score, 7);
  }
});

test("score: throws on missing subjective_score", () => {
  assert.throws(
    () => scoreCandidates([{ url: "https://a", domain: "ai" }]),
    /missing subjective_score/,
  );
});

test("score: throws on non-array input", () => {
  assert.throws(() => scoreCandidates({}), /expected an array/);
});
