import { test } from "node:test";
import assert from "node:assert/strict";
import widgets from "../src/_data/widgets.js";

test("catalog index includes feature-flags from sidecar", () => {
  const ff = widgets.catalogEntries.find((w) => w.id === "feature-flags");
  assert.ok(ff, "feature-flags must be in catalogEntries");
  assert.equal(ff.title, "Feature flags");
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
