import { test } from "node:test";
import assert from "node:assert/strict";

// Load the real config and capture the registered "widget" shortcode function
// by passing a stub eleventyConfig. We only need cfg(stub) to survive one call.
async function getWidgetShortcode() {
  const cfg = (await import("../eleventy.config.js")).default;
  let captured;
  const fakeConfig = {
    on() {}, addShortcode(name, fn) { if (name === "widget") captured = fn; },
    addPairedShortcode() {}, addFilter() {}, addCollection() {},
    addPlugin() {}, addTransform() {}, addPassthroughCopy() {},
    addWatchTarget() {}, setServerOptions() {}, addGlobalData() {},
    setFrontMatterParsingOptions() {}, ignores: { add() {} },
    addBundle() {}, amendLibrary() {}, setLibrary() {},
  };
  cfg(fakeConfig);
  assert.ok(captured, "widget shortcode must be registered");
  return captured;
}

test("widget shortcode wraps partial in vg-w figure with data-widget", async () => {
  const widget = await getWidgetShortcode();
  const ctx = { page: { inputPath: "./p.html" } };
  const html = widget.call(ctx, "feature-flags");
  assert.match(html, /<figure class="vg-w-feature-flags"/);
  assert.match(html, /data-widget="feature-flags"/);
  assert.match(html, /data-pagefind-ignore/);
  assert.match(html, /id="vg-w-feature-flags-1"/);
  assert.match(html, /data-flag-table/); // partial body inlined (real feature-flags anchor)
  assert.match(html, /<script src="\/static\/widgets\/feature-flags\.js" defer><\/script>/);
  assert.match(html, /data-mobile="swap"/);
});

test("widget shortcode dedupes script + increments id on second instance", async () => {
  const widget = await getWidgetShortcode();
  const ctx = { page: { inputPath: "./p2.html" } };
  const first = widget.call(ctx, "feature-flags");
  const second = widget.call(ctx, "feature-flags");
  assert.match(first, /<script src=/);
  assert.doesNotMatch(second, /<script src=/);
  assert.match(second, /id="vg-w-feature-flags-2"/);
});

test("widget shortcode emits data-mobile-summary from widget.json", async () => {
  const widget = await getWidgetShortcode();
  const ctx = { page: { inputPath: "./p3.html" } };
  const html = widget.call(ctx, "feature-flags");
  assert.match(html, /data-mobile-summary="[^"]{20,}"/);
});

test("widget shortcode summary opt overrides widget.json", async () => {
  const widget = await getWidgetShortcode();
  const ctx = { page: { inputPath: "./p4.html" } };
  const html = widget.call(ctx, "feature-flags", { summary: "覆寫摘要，說明此實例在本文脈絡下的特定結論，長度合於檢查規範。" });
  assert.match(html, /data-mobile-summary="覆寫摘要/);
});

test("widget shortcode emits explicit data-mobile, default swap", async () => {
  const widget = await getWidgetShortcode();
  const ctx = { page: { inputPath: "./p5.html" } };
  const html = widget.call(ctx, "feature-flags");
  assert.match(html, /data-mobile="swap"/);
  assert.match(html, /data-mobile="swap"[^>]*data-mobile-summary=/);
});

test("widget shortcode mobile opt overrides the tier", async () => {
  const widget = await getWidgetShortcode();
  const ctx = { page: { inputPath: "./p6.html" } };
  const html = widget.call(ctx, "feature-flags", { mobile: "keep" });
  assert.match(html, /data-mobile="keep"/);
});

test("widget shortcode throws on unknown mobile tier", async () => {
  const widget = await getWidgetShortcode();
  const ctx = { page: { inputPath: "./p7.html" } };
  assert.throws(() => widget.call(ctx, "feature-flags", { mobile: "statc" }), /unknown mobile tier "statc"/);
});
