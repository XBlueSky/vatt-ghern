// tests/sources-registry.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadSources } from "../skills/daily-news/scripts/registry.mjs";
import { fetch as arxivFetch } from "../skills/daily-news/scripts/fetchers/arxiv.mjs";
import { fetch as hfFetch } from "../skills/daily-news/scripts/fetchers/hf.mjs";
import { fetch as lobstersFetch } from "../skills/daily-news/scripts/fetchers/lobsters-json.mjs";
import { fetch as sitemapFetch } from "../skills/daily-news/scripts/fetchers/sitemap-diff.mjs";
import { fetch as htmlIndexFetch } from "../skills/daily-news/scripts/fetchers/html-index.mjs";

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

test("arxiv fetcher parses Atom feed into candidates", async () => {
  const xml = readFileSync(new URL("./fixtures/arxiv-sample.xml", import.meta.url), "utf8");
  const record = { id: "arxiv-cs-ai", tier: 4, url: "https://example/feed" };
  const ctx = { fetchImpl: async () => ({ ok: true, text: async () => xml }) };
  const { candidates } = await arxivFetch(record, ctx);
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].source_id, "arxiv-cs-ai");
  assert.equal(candidates[0].source_tier, 4);
  assert.equal(candidates[0].url, "http://arxiv.org/abs/2601.12345v1");
  assert.equal(candidates[0].title, "A Test Paper About Transformers");
  assert.match(candidates[0].summary, /transformers/i);
  assert.equal(candidates[0].published_at, "2026-05-18T08:00:00Z");
});

test("hf fetcher parses model list", async () => {
  const json = readFileSync(new URL("./fixtures/hf-models-sample.json", import.meta.url), "utf8");
  const record = { id: "hf-trending-models", tier: 4, url: "https://example/api" };
  const ctx = { fetchImpl: async () => ({ ok: true, json: async () => JSON.parse(json) }) };
  const { candidates } = await hfFetch(record, ctx);
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].source_id, "hf-trending-models");
  assert.equal(candidates[0].url, "https://huggingface.co/openai/whisper-large-v4");
  assert.equal(candidates[0].title, "openai/whisper-large-v4");
  assert.equal(candidates[0].signal.downloads, 1000000);
  assert.equal(candidates[0].signal.likes, 4321);
});

test("lobsters-json picks external url, falls back to comments_url", async () => {
  const json = readFileSync(new URL("./fixtures/lobsters-sample.json", import.meta.url), "utf8");
  const record = { id: "lobsters-json", tier: 1, url: "https://example/api" };
  const ctx = { fetchImpl: async () => ({ ok: true, json: async () => JSON.parse(json) }) };
  const { candidates } = await lobstersFetch(record, ctx);
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].url, "https://example.com/memory");
  assert.equal(candidates[1].url, "https://lobste.rs/s/def456");
  assert.deepEqual(candidates[0].signal.tags, ["rust", "memory"]);
});

test("sitemap-diff surfaces only changed urls", async () => {
  const xml = readFileSync(
    new URL("./fixtures/anthropic-sitemap-sample.xml", import.meta.url),
    "utf8"
  );
  const record = { id: "anthropic-sitemap", tier: 3, url: "https://example/sitemap.xml" };
  const ctx = {
    fetchImpl: async () => ({ ok: true, text: async () => xml }),
    // Prior known state: post-b at 2026-05-17, about at 2025-01-01.
    // post-a is new; post-b unchanged; about unchanged.
    priorState: {
      "https://www.anthropic.com/news/post-b": "2026-05-17",
      "https://www.anthropic.com/about": "2025-01-01",
    },
  };
  const { candidates, state_diff } = await sitemapFetch(record, ctx);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].url, "https://www.anthropic.com/news/post-a");
  // state_diff contains all current urls (full replacement, not delta).
  assert.equal(Object.keys(state_diff).length, 3);
  assert.equal(state_diff["https://www.anthropic.com/news/post-a"], "2026-05-18");
});

test("html-index fetcher returns deferred sentinel", async () => {
  const record = { id: "hn", tier: 1, url: "https://news.ycombinator.com/news" };
  const { candidates, deferred } = await htmlIndexFetch(record);
  assert.deepEqual(candidates, []);
  assert.equal(deferred.kind, "webfetch");
  assert.equal(deferred.source_id, "hn");
});
