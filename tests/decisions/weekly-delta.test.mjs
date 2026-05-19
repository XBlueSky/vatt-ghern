import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { computeWeeklyDelta } from "../../skills/daily-news/scripts/decisions/weekly-delta.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(here, "..", "fixtures", "decisions");

test("weekly-delta: matches golden fixture", () => {
  const input = JSON.parse(readFileSync(join(FIXTURES, "weekly-delta-input.json"), "utf8"));
  const expected = JSON.parse(readFileSync(join(FIXTURES, "weekly-delta-output.json"), "utf8"));
  const actual = computeWeeklyDelta({ end: "2026-05-25", loader: () => input });
  assert.deepEqual(actual, expected);
});

test("weekly-delta: sparse THIS week emits this_week_empty note", () => {
  const r = computeWeeklyDelta({
    end: "2026-05-25",
    loader: () => ({
      roundups: [
        { date: "2026-05-13", title: "T", summary: "", tags: [],
          topics: ["roundup", "ai"], news_ids: Array(10).fill("x") },
      ],
      deep_stories: [],
    }),
  });
  assert.equal(r.note, "this_week_empty");
  assert.deepEqual(r.domain_shift, []);
});

test("weekly-delta: sparse LAST week emits last_week_empty note", () => {
  const r = computeWeeklyDelta({
    end: "2026-05-25",
    loader: () => ({
      roundups: [
        { date: "2026-05-20", title: "T", summary: "", tags: [],
          topics: ["roundup", "ai"], news_ids: Array(10).fill("x") },
      ],
      deep_stories: [],
    }),
  });
  assert.equal(r.note, "last_week_empty");
});

test("weekly-delta: domain_shift emits all 5 priority domains in fixed order", () => {
  const r = computeWeeklyDelta({
    end: "2026-05-25",
    loader: () => ({
      roundups: [
        { date: "2026-05-13", title: "T", summary: "", tags: [],
          topics: ["roundup", "ai"], news_ids: ["x"] },
        { date: "2026-05-20", title: "T", summary: "", tags: [],
          topics: ["roundup", "ai"], news_ids: ["x"] },
      ],
      deep_stories: [],
    }),
  });
  const order = r.domain_shift.map((d) => d.domain);
  assert.deepEqual(order, ["ai", "systems", "infra", "web", "backend"]);
});

test("weekly-delta: legacy topics counted as 'legacy' pseudo-domain", () => {
  const r = computeWeeklyDelta({
    end: "2026-05-25",
    loader: () => ({
      roundups: [
        { date: "2026-05-13", title: "T", summary: "", tags: [],
          topics: ["roundup", "storage", "industry"], news_ids: Array(10).fill("x") },
        { date: "2026-05-20", title: "T", summary: "", tags: [],
          topics: ["roundup", "ai"], news_ids: Array(10).fill("x") },
      ],
      deep_stories: [],
    }),
  });
  const legacy = r.domain_shift.find((d) => d.domain === "legacy");
  assert.ok(legacy, "expected legacy pseudo-domain in domain_shift");
  assert.equal(legacy.last_week_pct, 100);
  assert.equal(legacy.this_week_pct, 0);
});

test("weekly-delta: throws on bad end format", () => {
  assert.throws(
    () => computeWeeklyDelta({ end: "not-a-date" }),
    /end must be YYYY-MM-DD/,
  );
});
