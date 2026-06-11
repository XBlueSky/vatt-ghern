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

// Issue 1: > inside attribute values

test("summary containing > survives intact and is not reported missing", () => {
  const html = wrap(
    `<figure class="vg-w-gt-demo" data-mobile-summary="當 a > b 時吞吐量領先，差距隨批次放大，結論在實測中不變。"><svg></svg></figure>`
  );
  const { html: out, swapped, missing } = injectMobileCards(html);
  assert.equal(swapped, 1);
  assert.deepEqual(missing, []);
  assert.match(out, /<p class="vg-mobile-card-summary">當 a &gt; b 時吞吐量領先/);
});

test("summary containing < renders &lt; in card text", () => {
  const html = wrap(
    `<figure class="vg-w-lt-demo" data-mobile-summary="當 p95 < 50µs 時才算達標，限制主要來自 NIC 中斷合併的延遲。"><svg></svg></figure>`
  );
  const { html: out, swapped, missing } = injectMobileCards(html);
  assert.equal(swapped, 1);
  assert.deepEqual(missing, []);
  assert.match(out, /<p class="vg-mobile-card-summary">當 p95 &lt; 50µs/);
});

test("summary attribute before class attribute still matches", () => {
  const html = wrap(
    `<figure data-mobile-summary="即使屬性順序顛倒且含 > 符號，這個圖表仍應被置換為摘要卡。" class="vg-w-order-demo"><svg></svg></figure>`
  );
  const { html: out, swapped, missing } = injectMobileCards(html);
  assert.equal(swapped, 1);
  assert.deepEqual(missing, []);
});

test('keep figure with a summary attribute is still untouched', () => {
  const html = wrap(
    `<figure class="vg-w-static" data-mobile="keep" data-mobile-summary="這張靜態圖在手機可讀，不需要置換成摘要卡,保留原樣即可。"><svg></svg></figure>`
  );
  const { html: out, swapped } = injectMobileCards(html);
  assert.equal(swapped, 0);
  assert.equal(out, html);
});

// Issue 2: figcaption title truncation

test("card title truncates figcaption at first 。", () => {
  const html = wrap(
    `<figure class="vg-w-cap-demo" data-mobile-summary="摘要文字長度合於規範，描述這個圖表想傳達的核心結論與重點。"><svg></svg><figcaption>去噪八步的全貌。後半段是冗長的操作說明，不該出現在卡片標題。</figcaption></figure>`
  );
  const { html: out } = injectMobileCards(html);
  assert.match(out, /<p class="vg-mobile-card-title">去噪八步的全貌<\/p>/);
});

test("card title hard-caps at 60 chars with ellipsis", () => {
  const longCap = "甲".repeat(70);
  const html = wrap(
    `<figure class="vg-w-cap-long" data-mobile-summary="摘要文字長度合於規範，描述這個圖表想傳達的核心結論與重點。"><svg></svg><figcaption>${longCap}</figcaption></figure>`
  );
  const { html: out } = injectMobileCards(html);
  const m = out.match(/<p class="vg-mobile-card-title">([^<]+)<\/p>/);
  assert.ok(m, "title present");
  assert.equal(m[1].length, 60);
  assert.ok(m[1].endsWith("…"));
});

async function getMobileCardsTransform() {
  const cfg = (await import("../eleventy.config.js")).default;
  let captured;
  const fakeConfig = {
    on() {}, addShortcode() {}, addPairedShortcode() {}, addFilter() {},
    addCollection() {}, addPlugin() {},
    addTransform(name, fn) { if (name === "mobile-cards") captured = fn; },
    addPassthroughCopy() {}, addWatchTarget() {}, setServerOptions() {},
    addGlobalData() {}, setFrontMatterParsingOptions() {},
    ignores: { add() {} }, addBundle() {}, amendLibrary() {}, setLibrary() {},
  };
  cfg(fakeConfig);
  assert.ok(captured, "mobile-cards transform must be registered");
  return captured;
}

test("transform applies to post output paths only", async () => {
  const fn = await getMobileCardsTransform();
  const html = `<div class="vg-post-body"><figure class="vg-w-x" data-mobile-summary="一句長度合於規範的摘要，描述這個圖表想傳達的核心結論與重點。"><svg></svg></figure></div>`;
  const post = fn.call({ page: { outputPath: "_site/2026/06/11/deep-x/index.html" } }, html);
  assert.match(post, /vg-mobile-card/);
  const gallery = fn.call({ page: { outputPath: "_site/widgets/cookbook/tab-switcher-pure-css/index.html" } }, html);
  assert.equal(gallery, html);
  const noOut = fn.call({ page: { outputPath: false } }, html);
  assert.equal(noOut, html);
});
