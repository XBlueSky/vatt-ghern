import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { clusterCandidates } from "../../skills/daily-news/scripts/decisions/cluster.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(here, "..", "fixtures", "decisions");

test("cluster: matches golden fixture for 2026-05-19 bootstrap", () => {
  const input = JSON.parse(readFileSync(join(FIXTURES, "candidates-input.json"), "utf8"));
  const expected = JSON.parse(readFileSync(join(FIXTURES, "clusters-output.json"), "utf8"));
  const actual = clusterCandidates(input);
  assert.deepEqual(actual, expected);
});

test("cluster: singleton candidate returns one cluster with primary === variant", () => {
  const r = clusterCandidates([
    { url: "https://x.com/a", title: "Solo Story", source_id: "x", source_tier: 1 },
  ]);
  assert.equal(r.length, 1);
  assert.equal(r[0].variants.length, 1);
  assert.equal(r[0].primary.source_id, "x");
});

test("cluster: same canonical URL with utm_ stripped clusters", () => {
  const r = clusterCandidates([
    { url: "https://x.com/a?utm_source=hn", title: "X", source_id: "hn", source_tier: 4 },
    { url: "https://x.com/a/", title: "Different Words Entirely", source_id: "x", source_tier: 1 },
  ]);
  assert.equal(r.length, 1);
  assert.equal(r[0].primary.source_id, "x");
});

test("cluster: empty input returns empty array", () => {
  assert.deepEqual(clusterCandidates([]), []);
});
