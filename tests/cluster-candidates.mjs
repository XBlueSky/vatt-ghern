// tests/cluster-candidates.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { clusterCandidates } from "../skills/daily-news/scripts/cluster-candidates.mjs";

function cand(over = {}) {
  return {
    source_id: "hn",
    source_tier: 1,
    url: "https://example.com/a",
    title: "Default Title",
    summary: "",
    published_at: null,
    signal: { kind: "html_index" },
    ...over,
  };
}

test("identical canonical URLs collapse into one cluster", () => {
  const input = [
    cand({ source_id: "hn", source_tier: 1, url: "https://example.com/post?utm_source=x" }),
    cand({ source_id: "lobsters", source_tier: 1, url: "https://example.com/post/" }),
  ];
  const clusters = clusterCandidates(input);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].variants.length, 2);
});

test("similar titles collapse even with different URLs", () => {
  const input = [
    cand({ source_id: "hn", url: "https://a.example/x",
      title: "Cloudflare workers rolls out faster cold starts" }),
    cand({ source_id: "lobsters", url: "https://b.example/y",
      title: "Cloudflare workers ships faster cold starts" }),
  ];
  const clusters = clusterCandidates(input);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].variants.length, 2);
});

test("unrelated candidates stay separate", () => {
  const input = [
    cand({ source_id: "hn", url: "https://x/1", title: "Rust 1.99 released" }),
    cand({ source_id: "lobsters", url: "https://y/1", title: "How TCP slow start works" }),
    cand({ source_id: "hackernoon", url: "https://z/1", title: "Postgres skinny tables" }),
  ];
  const clusters = clusterCandidates(input);
  assert.equal(clusters.length, 3);
  for (const c of clusters) assert.equal(c.variants.length, 1);
});

test("primary picks highest tier (lowest tier number)", () => {
  const input = [
    cand({ source_id: "arxiv-cs-ai", source_tier: 4, url: "https://arxiv.org/abs/x",
      title: "Same paper", summary: "long upstream context that is long" }),
    cand({ source_id: "hn", source_tier: 1, url: "https://news.ycombinator.com/item",
      title: "Same paper" }),
  ];
  const clusters = clusterCandidates(input);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].primary.source_id, "hn");
});

test("ties on tier broken by longest summary", () => {
  const input = [
    cand({ source_id: "hn", source_tier: 1, url: "https://a/1", title: "X", summary: "short" }),
    cand({ source_id: "lobsters", source_tier: 1, url: "https://a/1", title: "X",
      summary: "a much longer summary that wins the tie break" }),
  ];
  const clusters = clusterCandidates(input);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].primary.source_id, "lobsters");
});

test("clusters are transitive (a~b, b~c → one cluster)", () => {
  const input = [
    cand({ source_id: "hn", url: "https://x/1", title: "Cloudflare workers cold starts faster" }),
    cand({ source_id: "lobsters", url: "https://x/1?utm_source=y", title: "Different title" }),
    cand({ source_id: "hackernoon", url: "https://z/9",
      title: "Cloudflare workers ship faster cold starts" }),
  ];
  // hn~lobsters by URL; hn~hackernoon by title; so all three transitively.
  const clusters = clusterCandidates(input);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].variants.length, 3);
});

test("singletons render with primary === variants[0]", () => {
  const input = [cand({ source_id: "hn", title: "Lone story" })];
  const clusters = clusterCandidates(input);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].variants.length, 1);
  assert.equal(clusters[0].primary, clusters[0].variants[0]);
});

test("empty input returns empty clusters", () => {
  assert.deepEqual(clusterCandidates([]), []);
});
