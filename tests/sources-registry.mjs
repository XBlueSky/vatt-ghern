// tests/sources-registry.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSources } from "../skills/daily-news/scripts/registry.mjs";

test("registry loads all sources with required fields", () => {
  const all = loadSources();
  assert.ok(all.length >= 30, `expected >= 30 sources, got ${all.length}`);
  for (const s of all) {
    assert.ok(s.id, "id missing");
    assert.ok(s.name, "name missing");
    assert.ok(s.url, "url missing");
    assert.ok([1, 2, 3, 4, 5].includes(s.tier), `bad tier on ${s.id}: ${s.tier}`);
    assert.ok(
      ["html_index", "arxiv", "hf", "sitemap", "lobsters_json"].includes(s.type),
      `bad type on ${s.id}: ${s.type}`
    );
  }
});

test("registry filters by tier", () => {
  const t1 = loadSources({ tier: 1 });
  assert.ok(t1.length >= 3);
  for (const s of t1) assert.equal(s.tier, 1);
});

test("registry filters by type", () => {
  const arxiv = loadSources({ type: "arxiv" });
  assert.equal(arxiv.length, 5);
  for (const s of arxiv) assert.equal(s.type, "arxiv");
});

test("registry rejects unknown filter values", () => {
  assert.throws(() => loadSources({ tier: 9 }), /tier/i);
  assert.throws(() => loadSources({ type: "nope" }), /type/i);
});

test("all ids are unique", () => {
  const all = loadSources();
  const ids = all.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate id in sources.yml");
});
