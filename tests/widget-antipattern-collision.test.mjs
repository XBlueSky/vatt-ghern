import { test } from "node:test";
import assert from "node:assert/strict";
import { pairOverlaps } from "../skills/daily-news/scripts/check-svg-text-collision.mjs";

const box = (left, top, w, h) => ({ left, right: left + w, top, bottom: top + h });

test("pairOverlaps: horizontal smear on same line fires (ox>1, oy>3)", () => {
  const a = box(100, 50, 90, 16);
  const b = box(140, 50, 90, 16);
  assert.equal(pairOverlaps(a, b), true);
});

test("pairOverlaps: two-line desc at same cx does NOT fire (oy<=3)", () => {
  const a = box(100, 50, 90, 16); // bottom = 66
  const b = box(100, 64, 90, 16); // top = 64 -> oy = 2
  assert.equal(pairOverlaps(a, b), false);
});

test("pairOverlaps: tiny horizontal touch does NOT fire (ox<=1)", () => {
  const a = box(100, 50, 90, 16); // right = 190
  const b = box(189, 50, 90, 16); // left = 189 -> ox = 1
  assert.equal(pairOverlaps(a, b), false);
});

test("pairOverlaps: disjoint boxes do not fire", () => {
  const a = box(100, 50, 40, 16);
  const b = box(300, 50, 40, 16);
  assert.equal(pairOverlaps(a, b), false);
});
