import { test } from "node:test";
import assert from "node:assert/strict";
import { figureIsUnsafe } from "../skills/daily-news/scripts/check-svg-coordinate-target.mjs";

// info = { transformsCoords, svgCount, hasMainSvg }
test("unsafe: coord transform + multiple svgs + no -main svg", () => {
  assert.equal(figureIsUnsafe({ transformsCoords: true, svgCount: 2, hasMainSvg: false }), true);
});

test("safe: has a -main svg even with multiple svgs", () => {
  assert.equal(figureIsUnsafe({ transformsCoords: true, svgCount: 2, hasMainSvg: true }), false);
});

test("safe: single svg in figure (bare query grabs the right one)", () => {
  assert.equal(figureIsUnsafe({ transformsCoords: true, svgCount: 1, hasMainSvg: false }), false);
});

test("safe: figure does not transform coordinates", () => {
  assert.equal(figureIsUnsafe({ transformsCoords: false, svgCount: 2, hasMainSvg: false }), false);
});
