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

test("isoWeekKey: year boundary — 2027-01-01 belongs to ISO 2026-W53", () => {
  // 2026 starts Thu, so 2026 has 53 ISO weeks; Jan 1 2027 (Fri) still belongs
  // to the last week of 2026.
  assert.equal(isoWeekKey("2027-01-01"), "2026-W53");
});

test("isoWeekRange: W01 of 2026 crosses year boundary back to Dec 2025", () => {
  // 2026 starts Thu, so ISO W01 of 2026 is Mon 2025-12-29 .. Sun 2026-01-04.
  const { start, end } = isoWeekRange("2026-W01");
  assert.equal(start, "2025-12-29");
  assert.equal(end, "2026-01-04");
});

test("isoWeekRange: returns Mon..Sun for given key", () => {
  const { start, end } = isoWeekRange("2026-W21");
  assert.equal(start, "2026-05-18");
  assert.equal(end, "2026-05-24");
});

test("isoWeekLabel: localized 'W21 · 5/18–5/24' shape", () => {
  assert.equal(isoWeekLabel("2026-W21"), "第 21 週 · 5/18–5/24");
});
