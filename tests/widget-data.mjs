import { test } from "node:test";
import assert from "node:assert/strict";
import widgets from "../src/_data/widgets.js";

test("catalog index includes feature-flags from sidecar", () => {
  const ff = widgets.catalogEntries.find((w) => w.id === "feature-flags");
  assert.ok(ff, "feature-flags must be in catalogEntries");
  // Gallery title/summary are zh-Hant (LABELS_ZH override); sidecar stays English.
  assert.equal(ff.title, "Feature flag 矩陣");
  assert.match(ff.summary, /feature flag/i);
  assert.ok(ff.suits.includes("flag-matrix-demo"));
  assert.equal(ff.link, "/widgets/catalog/feature-flags/");
  assert.equal(ff.interactive, true);
});

test("cookbook entries exclude the two banned scroll patterns", () => {
  const ids = widgets.cookbookEntries.map((e) => e.id);
  assert.ok(!ids.includes("scroll-driven-explanation"), "tier-1 banned must be excluded");
  assert.ok(!ids.includes("css-scroll-timeline"), "tier-2 banned must be excluded");
  assert.ok(ids.includes("intersection-observer-reveal"), "intersection-observer-reveal stays (NOT banned in vatt-ghern)");
  assert.ok(ids.includes("data-driven-chart"), "tier-1 hero present");
});

test("groups expose three sections with counts", () => {
  assert.equal(widgets.groups.length, 3);
  assert.equal(widgets.groups[0].kind, "catalog");
  assert.equal(widgets.totals.catalog, widgets.catalogEntries.length);
});

test("every gallery entry has a zh-Hant summary (no English fallback leaks)", () => {
  // Titles may stay English when they ARE technical names (CSS Container Query,
  // View Transition API, Web Animations API — per PRODUCT.md). Summaries must
  // always be zh-Hant: assert each summary contains at least one CJK char.
  const cjk = /[一-鿿]/;
  const all = [...widgets.catalogEntries, ...widgets.cookbookEntries];
  const englishSummaries = all.filter((e) => !cjk.test(e.summary || ""));
  assert.equal(
    englishSummaries.length,
    0,
    `gallery entries with non-zh summary (missing LABELS_ZH): ${englishSummaries.map((e) => e.id).join(", ")}`
  );
});
