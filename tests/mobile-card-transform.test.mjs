// tests/mobile-card-transform.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { injectMobileCards } from "../scripts/mobile-card-transform.mjs";

const wrap = (inner) => `<div class="vg-post-body">${inner}</div>`;

test("widget with summary gets card + data-mobile-swap + notice", () => {
  const html = wrap(
    `<figure class="vg-w-test-demo" data-mobile-summary="同樣的輸入，迭代八次即可全部收斂，這是吞吐量差距的真正來源，值得記住。"><svg></svg></figure>`
  );
  const { html: out, swapped, missing } = injectMobileCards(html);
  assert.equal(swapped, 1);
  assert.deepEqual(missing, []);
  assert.match(out, /<figure data-mobile-swap class="vg-w-test-demo"/);
  assert.match(out, /<\/figure><div class="vg-mobile-card" data-pagefind-ignore>/);
  assert.match(out, /<p class="vg-mobile-card-summary">同樣的輸入/);
  assert.match(out, /<p class="vg-mobile-card-hint">互動版圖表請以桌面瀏覽器開啟<\/p>/);
  assert.match(out, /<div class="vg-mobile-notice" data-pagefind-ignore>本文含 1 個互動圖表，手機版以重點摘要呈現，完整互動內容請以桌面瀏覽器開啟。<\/div>/);
});

test("card title comes from figcaption text, tags stripped", () => {
  const html = wrap(
    `<figure class="vg-w-test-demo" data-mobile-summary="一句長度合於規範的摘要，描述這個圖表想傳達的核心結論與重點。"><svg></svg><figcaption>圖一<em>:</em>去噪過程</figcaption></figure>`
  );
  const { html: out } = injectMobileCards(html);
  assert.match(out, /<p class="vg-mobile-card-title">圖一:去噪過程<\/p>/);
});

test("no figcaption falls back to generic title", () => {
  const html = wrap(
    `<figure class="vg-w-test-demo" data-mobile-summary="一句長度合於規範的摘要，描述這個圖表想傳達的核心結論與重點。"><svg></svg></figure>`
  );
  const { html: out } = injectMobileCards(html);
  assert.match(out, /<p class="vg-mobile-card-title">互動圖表<\/p>/);
});

test("missing summary injects generic card and reports class", () => {
  const html = wrap(`<figure class="vg-w-test-demo"><svg></svg></figure>`);
  const { html: out, swapped, missing } = injectMobileCards(html);
  assert.equal(swapped, 1);
  assert.deepEqual(missing, ["vg-w-test-demo"]);
  assert.match(out, /vg-mobile-card/);
  assert.doesNotMatch(out, /vg-mobile-card-summary/);
});

test('data-mobile="keep" leaves figure untouched, no notice', () => {
  const html = wrap(`<figure class="vg-w-static-map" data-mobile="keep"><svg></svg></figure>`);
  const { html: out, swapped } = injectMobileCards(html);
  assert.equal(swapped, 0);
  assert.equal(out, html);
});

test("non-widget figures are untouched", () => {
  const html = wrap(`<figure class="vg-photo"><img alt="" src="x.png"></figure>`);
  const { html: out, swapped } = injectMobileCards(html);
  assert.equal(swapped, 0);
  assert.equal(out, html);
});

test("idempotent: second run changes nothing", () => {
  const html = wrap(
    `<figure class="vg-w-test-demo" data-mobile-summary="一句長度合於規範的摘要，描述這個圖表想傳達的核心結論與重點。"><svg></svg></figure>`
  );
  const once = injectMobileCards(html).html;
  const twice = injectMobileCards(once).html;
  assert.equal(twice, once);
});

test("notice counts only swapped widgets", () => {
  const html = wrap(
    `<figure class="vg-w-a" data-mobile-summary="第一個摘要，長度合於規範，描述圖表想傳達的核心結論與重點所在。"><svg></svg></figure>` +
    `<figure class="vg-w-b" data-mobile="keep"><svg></svg></figure>` +
    `<figure class="vg-w-c" data-mobile-summary="第三個摘要，長度合於規範，描述圖表想傳達的核心結論與重點所在。"><svg></svg></figure>`
  );
  const { html: out, swapped } = injectMobileCards(html);
  assert.equal(swapped, 2);
  assert.match(out, /本文含 2 個互動圖表/);
});
