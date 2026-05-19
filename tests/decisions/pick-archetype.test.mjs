import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pickArchetype, ARCHETYPES } from "../../skills/daily-news/scripts/decisions/pick-archetype.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(here, "..", "fixtures", "decisions");

test("pick-archetype: matches golden fixture for 2026-05-19 bootstrap", () => {
  const input = JSON.parse(readFileSync(join(FIXTURES, "archetype-input.json"), "utf8"));
  const expected = JSON.parse(readFileSync(join(FIXTURES, "archetype-output.json"), "utf8"));
  const actual = input.map(pickArchetype);
  assert.deepEqual(actual, expected);
});

test("pick-archetype: hybrid_or_unclear wins over every other signal", () => {
  const r = pickArchetype({
    signals: {
      time_ordered: true, structural_exposition: true, puzzle_with_hypotheses: true,
      multiple_options: true, concept_unknown: true, hybrid_or_unclear: true,
    },
  });
  assert.equal(r.archetype, "freeform");
  assert.equal(r.matched_signal, "hybrid_or_unclear");
});

test("pick-archetype: all signals false returns freeform/default", () => {
  const r = pickArchetype({
    signals: {
      time_ordered: false, structural_exposition: false, puzzle_with_hypotheses: false,
      multiple_options: false, concept_unknown: false, hybrid_or_unclear: false,
    },
  });
  assert.equal(r.archetype, "freeform");
  assert.equal(r.matched_signal, "default");
});

test("pick-archetype: returns one of the 6 known archetypes for any signal combo", () => {
  for (let bits = 0; bits < 64; bits++) {
    const s = {
      time_ordered: !!(bits & 1),
      structural_exposition: !!(bits & 2),
      puzzle_with_hypotheses: !!(bits & 4),
      multiple_options: !!(bits & 8),
      concept_unknown: !!(bits & 16),
      hybrid_or_unclear: !!(bits & 32),
    };
    const r = pickArchetype({ signals: s });
    assert.ok(ARCHETYPES.includes(r.archetype), `unknown archetype ${r.archetype} for bits ${bits}`);
  }
});

test("pick-archetype: throws on missing signals object", () => {
  assert.throws(() => pickArchetype({}), /missing signals/);
});

test("pick-archetype: throws on non-boolean signal", () => {
  assert.throws(
    () => pickArchetype({
      signals: {
        time_ordered: "yes",
        structural_exposition: false, puzzle_with_hypotheses: false,
        multiple_options: false, concept_unknown: false, hybrid_or_unclear: false,
      },
    }),
    /signal time_ordered must be boolean/,
  );
});
