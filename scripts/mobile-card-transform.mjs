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
//
// Assumption: attribute values are authored as valid HTML (entities already
// encoded), so summary and title text pass through to card HTML without
// re-escaping.

// Quote-aware open-tag regex: handles `"..."`, `'...'`, and bare non-> chars,
// so a literal > inside a quoted attribute value does not end the tag match.
const OPEN_TAG_RE = /<figure\b(?:"[^"]*"|'[^']*'|[^>"'])*>/g;
const HINT_TEXT = "互動版圖表請以桌面瀏覽器開啟";
const GENERIC_TITLE = "互動圖表";

/** Extract the value of a double-quoted attribute, or null if absent. */
function attrValue(openTag, attrName) {
  const re = new RegExp(`\\b${attrName}="([^"]*)"`);
  const m = openTag.match(re);
  return m ? m[1] : null;
}

/** Derive card title from raw figcaption text:
 *  1. Strip tags and collapse whitespace.
 *  2. Truncate at first 。 (exclude it).
 *  3. Hard-cap at 60 chars: cut to 59 + 「…」.
 */
function deriveTitle(rawCaption) {
  let text = rawCaption.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const dotIdx = text.indexOf("。");
  if (dotIdx !== -1) text = text.slice(0, dotIdx);
  if (text.length > 60) text = text.slice(0, 59) + "…";
  return text;
}

export function injectMobileCards(html) {
  const missing = [];
  let swapped = 0;
  const parts = [];
  let cursor = 0;

  // Reset lastIndex before iterating (regex is module-level with /g flag).
  OPEN_TAG_RE.lastIndex = 0;

  let m;
  while ((m = OPEN_TAG_RE.exec(html)) !== null) {
    const openTag = m[0];
    const tagStart = m.index;
    const tagEnd = tagStart + openTag.length; // index of first char after >

    // Must be a vg-w-* widget.
    const classAttr = attrValue(openTag, "class");
    if (!classAttr || !/\bvg-w-[a-z0-9-]+/.test(classAttr)) continue;

    // Skip figures that should stay as-is.
    if (attrValue(openTag, "data-mobile") === "keep") continue;
    if (openTag.includes("data-mobile-swap")) continue; // already processed

    // Find the closing </figure> from just after the open tag.
    const closeIdx = html.indexOf("</figure>", tagEnd);
    if (closeIdx === -1) continue; // malformed, skip
    const figureEnd = closeIdx + "</figure>".length;
    const figureBody = html.slice(tagEnd, figureEnd); // content + </figure>

    // Extract summary and figcaption from the full figure.
    const summary = (attrValue(openTag, "data-mobile-summary") ?? "").trim();
    const capMatch = figureBody.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/);
    const title = capMatch ? deriveTitle(capMatch[1]) : GENERIC_TITLE;

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

    const newOpenTag = openTag.replace(/^<figure\b/, "<figure data-mobile-swap");

    // Emit: everything since last cursor, then the rewritten figure, then the card.
    parts.push(html.slice(cursor, tagStart));
    parts.push(newOpenTag);
    parts.push(figureBody);
    parts.push(card);
    cursor = figureEnd;

    // Advance OPEN_TAG_RE past the figure we just consumed to avoid re-matching
    // any <figure inside the body (e.g. nested figures, though unusual).
    OPEN_TAG_RE.lastIndex = figureEnd;
  }

  parts.push(html.slice(cursor));
  let out = parts.join("");

  if (swapped > 0) {
    out = out.replace(
      '<div class="vg-post-body">',
      '<div class="vg-post-body">' +
        `<div class="vg-mobile-notice" data-pagefind-ignore>本文含 ${swapped} 個互動圖表，手機版以重點摘要呈現，完整互動內容請以桌面瀏覽器開啟。</div>`
    );
  }
  return { html: out, swapped, missing };
}
