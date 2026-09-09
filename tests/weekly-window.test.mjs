import { test } from "node:test";
import assert from "node:assert/strict";
import { computeWeeklyWindow } from "../skills/daily-news/scripts/weekly-window.mjs";

test("weekly-window: Monday run covers the ISO week that just ended", () => {
  // Mon 2026-08-24 publishes the rollup for W34 (Mon 8/17 .. Sun 8/23).
  const w = computeWeeklyWindow({ today: "2026-08-24" });
  assert.equal(w.week_key, "2026-W34");
  assert.equal(w.start, "2026-08-17");
  assert.equal(w.end, "2026-08-23");
  assert.equal(w.title_prefix, "第 34 週");
});

test("weekly-window: window never includes the publication day", () => {
  const w = computeWeeklyWindow({ today: "2026-08-24" });
  assert.ok(w.end < w.publish_date);
  // Exactly 7 days, Monday through Sunday.
  const days = (Date.parse(w.end) - Date.parse(w.start)) / 86400000 + 1;
  assert.equal(days, 7);
});

test("weekly-window: catch-up run mid-week still covers the last full week", () => {
  // Wed 2026-09-09 — the week containing it (W37) is not over yet.
  const w = computeWeeklyWindow({ today: "2026-09-09" });
  assert.equal(w.week_key, "2026-W36");
  assert.equal(w.start, "2026-08-31");
  assert.equal(w.end, "2026-09-06");
});

test("weekly-window: Sunday run covers the previous week, not the running one", () => {
  const w = computeWeeklyWindow({ today: "2026-09-13" }); // Sun of W37
  assert.equal(w.week_key, "2026-W36");
});

test("weekly-window: year boundary — Mon 2027-01-04 covers 2026-W53", () => {
  const w = computeWeeklyWindow({ today: "2027-01-04" });
  assert.equal(w.week_key, "2026-W53");
  assert.equal(w.start, "2026-12-28");
  assert.equal(w.end, "2027-01-03");
});

test("weekly-window: --week override wins over today", () => {
  const w = computeWeeklyWindow({ today: "2026-09-14", week: "2026-W21" });
  assert.equal(w.week_key, "2026-W21");
  assert.equal(w.start, "2026-05-18");
  assert.equal(w.end, "2026-05-24");
  assert.equal(w.week_number, 21);
});

test("weekly-window: rejects malformed input", () => {
  assert.throws(() => computeWeeklyWindow({ today: "8/24/2026" }), /YYYY-MM-DD/);
  assert.throws(() => computeWeeklyWindow({ week: "2026-34" }), /YYYY-Www/);
});
