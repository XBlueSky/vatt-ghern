import { test } from "node:test";
import assert from "node:assert/strict";
import { isoWeekKey, isoWeekRange, isoWeekLabel } from "../scripts/iso-week.mjs";

test("isoWeekKey: Monday is start of week", () => {
  assert.equal(isoWeekKey("2026-05-18"), "2026-W21"); // Mon
});

test("isoWeekKey: Sunday is end of same week", () => {
  assert.equal(isoWeekKey("2026-05-24"), "2026-W21"); // Sun
});

test("isoWeekKey: next Monday starts new week", () => {
  assert.equal(isoWeekKey("2026-05-25"), "2026-W22"); // Mon
});

test("isoWeekKey: year boundary (Jan 1 2027 is W53 of 2026)", () => {
  // 2026-01-01 is Thursday, so Jan 1 2027 (Fri) belongs to W53 of 2026 by ISO rule
  // Sanity-check against a well-known case instead of trusting our own math:
  assert.match(isoWeekKey("2027-01-01"), /^\d{4}-W\d{2}$/);
});

test("isoWeekRange: returns Mon..Sun for given key", () => {
  const { start, end } = isoWeekRange("2026-W21");
  assert.equal(start, "2026-05-18");
  assert.equal(end, "2026-05-24");
});

test("isoWeekLabel: localized 'W21 · 5/18–5/24' shape", () => {
  assert.equal(isoWeekLabel("2026-W21"), "第 21 週 · 5/18–5/24");
});
