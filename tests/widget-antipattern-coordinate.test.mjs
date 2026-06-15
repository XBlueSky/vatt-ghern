import { test } from "node:test";
import assert from "node:assert/strict";
import { figureIsUnsafe, hasBareSvgQuery } from "../skills/daily-news/scripts/check-svg-coordinate-target.mjs";

// info = { transformsCoords, svgCount, usesBareSvgQuery }
test("unsafe: coord transform + multiple svgs + bare svg query", () => {
  assert.equal(figureIsUnsafe({ transformsCoords: true, svgCount: 2, usesBareSvgQuery: true }), true);
});

test("safe: class-qualified svg query even with multiple svgs", () => {
  assert.equal(figureIsUnsafe({ transformsCoords: true, svgCount: 2, usesBareSvgQuery: false }), false);
});

test("safe: single svg in figure (bare query grabs the right one)", () => {
  assert.equal(figureIsUnsafe({ transformsCoords: true, svgCount: 1, usesBareSvgQuery: true }), false);
});

test("safe: figure does not transform coordinates", () => {
  assert.equal(figureIsUnsafe({ transformsCoords: false, svgCount: 2, usesBareSvgQuery: true }), false);
});

// Pin the regex behavior at the source level: hasBareSvgQuery uses the SAME
// regex literal that the browser-side check uses, so a class-qualified query
// must NOT register as bare.
test("hasBareSvgQuery: bare single/double quote fires", () => {
  assert.equal(hasBareSvgQuery("var s = root.querySelector('svg');"), true);
  assert.equal(hasBareSvgQuery('var s = root.querySelector("svg");'), true);
});

test("hasBareSvgQuery: class-qualified does not fire", () => {
  assert.equal(hasBareSvgQuery("root.querySelector('svg.track')"), false);
  assert.equal(hasBareSvgQuery("root.querySelector('svg.vg-w-x-main')"), false);
});
