// scripts/mobile-card-transform.mjs — Mobile summary-card injection.
//
// On coarse-pointer devices interactive widgets are desktop-only: CSS hides
// every figure tagged `data-mobile-swap` and shows the injected
// `.vg-mobile-card` instead (see site.css "Mobile summary cards" section).
// This module is a pure function so `npm test` can exercise it without
// running Eleventy; eleventy.config.js wires it in as a transform.
//
// Contract (see widget-isolation.md "Mobile summary contract"):
//   - <figure class="vg-w-..." data-mobile-summary="20–80 字 takeaway">
//     → figure tagged data-mobile-swap + card injected after it
//   - data-mobile="keep" → figure left alone (static, small-screen-safe)
//   - missing summary → generic card (title + hint only), reported in
//     `missing` so the build can warn; never breaks the build.

const FIGURE_RE =
  /<figure\b[^>]*class="[^"]*\bvg-w-[a-z0-9-]+[^"]*"[^>]*>[\s\S]*?<\/figure>/g;
const HINT_TEXT = "互動版圖表請以桌面瀏覽器開啟";
const GENERIC_TITLE = "互動圖表";

export function injectMobileCards(html) {
  const missing = [];
  let swapped = 0;

  let out = html.replace(FIGURE_RE, (figure) => {
    const openEnd = figure.indexOf(">");
    const openTag = figure.slice(0, openEnd + 1);
    if (openTag.includes('data-mobile="keep"')) return figure;
    if (openTag.includes("data-mobile-swap")) return figure; // already processed

    const summaryMatch = openTag.match(/data-mobile-summary="([^"]*)"/);
    const summary = summaryMatch ? summaryMatch[1].trim() : "";
    const capMatch = figure.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/);
    const title = capMatch
      ? capMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
      : GENERIC_TITLE;
    if (!summary) {
      missing.push(openTag.match(/vg-w-[a-z0-9-]+/)?.[0] ?? "vg-w-?");
    }
    swapped += 1;

    const card =
      '<div class="vg-mobile-card" data-pagefind-ignore>' +
      `<p class="vg-mobile-card-title">${title}</p>` +
      (summary ? `<p class="vg-mobile-card-summary">${summary}</p>` : "") +
      `<p class="vg-mobile-card-hint">${HINT_TEXT}</p>` +
      "</div>";
    return (
      openTag.replace(/^<figure\b/, "<figure data-mobile-swap") +
      figure.slice(openEnd + 1) +
      card
    );
  });

  if (swapped > 0) {
    out = out.replace(
      '<div class="vg-post-body">',
      '<div class="vg-post-body">' +
        `<div class="vg-mobile-notice" data-pagefind-ignore>本文含 ${swapped} 個互動圖表，手機版以重點摘要呈現，完整互動內容請以桌面瀏覽器開啟。</div>`
    );
  }
  return { html: out, swapped, missing };
}
