// tests/mobile-tier-check.test.mjs — unit tests for the mobile tier contract.
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkMobileContract } from "./archetype-check.mjs";

const OLD = "_site/2026/06/01/deep-old/index.html";   // before EXPLICIT_TIER_SINCE
const NEW = "_site/2026/06/12/deep-new/index.html";   // on/after EXPLICIT_TIER_SINCE
const SUMMARY = "一句長度合於規範的摘要，描述這個圖表想傳達的核心結論與重點。";

test("old post, no tier, valid summary → ok (grandfathered swap)", () => {
  const body = `<figure class="vg-w-a" data-mobile-summary="${SUMMARY}"><svg></svg></figure>`;
  assert.deepEqual(checkMobileContract(OLD, body), []);
});

test("new post, no tier → explicit-tier violation", () => {
  const body = `<figure class="vg-w-a" data-mobile-summary="${SUMMARY}"><svg></svg></figure>`;
  const v = checkMobileContract(NEW, body);
  assert.equal(v.length, 1);
  assert.match(v[0], /must declare data-mobile/);
});

test("new post, explicit swap with valid summary → ok", () => {
  const body = `<figure class="vg-w-a" data-mobile="swap" data-mobile-summary="${SUMMARY}"><canvas></canvas></figure>`;
  assert.deepEqual(checkMobileContract(NEW, body), []);
});

test("swap missing summary → violation (both dates)", () => {
  const body = `<figure class="vg-w-a" data-mobile="swap"><svg></svg></figure>`;
  assert.equal(checkMobileContract(OLD, body).length, 1);
  assert.equal(checkMobileContract(NEW, body).length, 1);
});

test("keep without summary → ok", () => {
  const body = `<figure class="vg-w-a" data-mobile="keep"><svg></svg></figure>`;
  assert.deepEqual(checkMobileContract(NEW, body), []);
});

test("static with svg-scroll and tagged controls → ok, no summary needed", () => {
  const body = `<figure class="vg-w-a" data-mobile="static" data-svg-scroll="800"><div data-vg-controls><input></div><svg></svg></figure>`;
  assert.deepEqual(checkMobileContract(NEW, body), []);
});

test("static without data-svg-scroll → violation", () => {
  const body = `<figure class="vg-w-a" data-mobile="static"><svg></svg></figure>`;
  const v = checkMobileContract(NEW, body);
  assert.equal(v.length, 1);
  assert.match(v[0], /data-svg-scroll/);
});

test("static with untagged input → data-vg-controls violation", () => {
  const body = `<figure class="vg-w-a" data-mobile="static" data-svg-scroll="800"><div><input type="range"></div><svg></svg></figure>`;
  const v = checkMobileContract(NEW, body);
  assert.equal(v.length, 1);
  assert.match(v[0], /data-vg-controls/);
});

test("static, SVG-only interactivity, no inputs → ok without data-vg-controls", () => {
  const body = `<figure class="vg-w-a" data-mobile="static" data-svg-scroll="800"><svg><rect role="button"></rect></svg></figure>`;
  assert.deepEqual(checkMobileContract(NEW, body), []);
});

test("unknown tier value → violation", () => {
  const body = `<figure class="vg-w-a" data-mobile="hide"><svg></svg></figure>`;
  const v = checkMobileContract(NEW, body);
  assert.equal(v.length, 1);
  assert.match(v[0], /unknown data-mobile/);
});

test("non-widget figures ignored", () => {
  const body = `<figure class="vg-photo"><img></figure>`;
  assert.deepEqual(checkMobileContract(NEW, body), []);
});
