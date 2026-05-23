# Tier 2 — Stack Cards with SVG Fallback

> Dual-rendering pattern for stack-style widgets (4 layers, 3 hypotheses,
> N stages). Mobile shows HTML cards that wrap naturally; desktop shows
> a wide SVG diagram with arrows / annotations. Same radio inputs drive
> both — selection and detail-panel mechanics are identical.

## When to use

- The widget is a **stack / list of N discrete items**, each with a
  short title + long subtitle / annotation. Examples: a 4-layer
  architecture diagram, a 3-stage rollout pipeline, an N-component
  dependency chain.
- Each item's subtitle is too long to fit in a 343-px mobile column
  rendered as SVG text. (SVG text doesn't wrap — long text gets
  truncated or pushed off the right edge.)
- The desktop rendering benefits from a wide horizontal/vertical SVG
  with arrows between items (the "flow" feels different from a vertical
  card list).

## When NOT to use

- Chart-style widgets (timelines, axis plots, param sweeps): the
  partial-visibility horizontal-scroll-inside-figure pattern (see
  `tier-3-principles.md` § Mobile legibility floor + `data-svg-scroll`)
  is the right answer. Continuous content still conveys meaning when
  partially visible; discrete item lists do not.
- Single annotated images / illustrations with no per-item structure.
- Widgets with < 3 items (just write HTML).

## Why this exists (PR #35, 2026-05-23)

The earlier `data-svg-scroll="880"` pattern forced an 880-px-wide SVG
on all viewports. On a 375-px phone, only the leftmost 343 px is
visible without horizontal swipe. For stack-style widgets the
SVG title bisects mid-character ("panic 由內向外的四個邊界——每層只
負責自己那段翻 / 譯"), and each layer's subtitle truncates at the
right edge — looking visually broken even though the figure is
horizontally scrollable. The user's PR #35 review surfaced this as
a real RWD failure; this snippet documents the fix.

The systemic audit found 7 past widgets with the same pattern:
`vg-w-annotated-fides-stack`, `vg-w-labelflow-fides-propagation`,
`vg-w-annotated-csharp-unsafe-contracts`, `vg-w-skel-rust-vtable`,
`vg-w-pipeline-rust-erasure`, `vg-w-diagram-consumer-stages`,
`vg-w-schematic-cliff-vs-ramp`. All retrofitted to this pattern in
the same PR.

## Complete snippet (paste-and-tweak)

```html
<figure class="vg-w-stack-EXAMPLE">
  <style>
    .vg-w-stack-EXAMPLE { display: flex; flex-direction: column; gap: var(--s-3); align-items: stretch; }
    .vg-w-stack-EXAMPLE input[type="radio"] { position: absolute; opacity: 0; pointer-events: none; }

    /* mobile cards (default-visible) ─────────────────── */
    .vg-w-stack-EXAMPLE .stack-title {
      font-family: IM Fell English, serif; font-style: italic;
      font-size: var(--fs-md); margin: 0 0 var(--s-1) 0;
      color: var(--ink); line-height: 1.4;
    }
    .vg-w-stack-EXAMPLE .stack-cards {
      display: flex; flex-direction: column; gap: var(--s-1);
      list-style: none; padding: 0; margin: 0;
    }
    .vg-w-stack-EXAMPLE .stack-cards label {
      display: block; padding: var(--s-2);
      border: 1px solid var(--muted-2); border-radius: 2px;
      cursor: pointer; transition: border-color 200ms + background 200ms;
      min-height: 44px;
    }
    .vg-w-stack-EXAMPLE .stack-cards label:hover { border-color: var(--accent); }
    .vg-w-stack-EXAMPLE .stack-cards .card-head {
      font-family: EB Garamond, serif; font-size: var(--fs-md);
      margin: 0 0 4px 0; color: var(--ink);
      display: flex; align-items: baseline; justify-content: space-between;
      gap: var(--s-2); flex-wrap: wrap;
    }
    .vg-w-stack-EXAMPLE .stack-cards .card-sub {
      font-family: IM Fell English, serif; font-style: italic;
      font-size: var(--fs-sm); color: var(--muted);
      margin: 0; line-height: 1.5;
    }
    .vg-w-stack-EXAMPLE .stack-cards .card-tag {
      font-family: JetBrains Mono, monospace; font-size: var(--fs-xs);
      color: var(--accent-text); font-style: normal;
    }
    .vg-w-stack-EXAMPLE:has(#vg-w-stack-EXAMPLE-r1:checked) .card-1 {
      border-color: var(--accent);
      background: color-mix(in srgb + var(--accent) 8% + transparent);
    }
    /* ... repeat for r2/card-2 + r3/card-3 + r4/card-4 ... */

    /* desktop ≥ 720px ── show SVG diagram + hide HTML cards */
    .vg-w-stack-EXAMPLE svg.diagram { display: none; }
    @media (min-width: 720px) {
      .vg-w-stack-EXAMPLE svg.diagram { display: block; width: 100%; height: auto; max-width: 880px; }
      .vg-w-stack-EXAMPLE .stack-title { display: none; }
      .vg-w-stack-EXAMPLE .stack-cards { display: none; }
    }

    /* SVG layer styles (only used at ≥ 720px) */
    .vg-w-stack-EXAMPLE .layer { fill: var(--bg-soft); stroke: var(--muted-2); stroke-width: 1.5; cursor: pointer; }
    .vg-w-stack-EXAMPLE:has(#vg-w-stack-EXAMPLE-r1:checked) .layer-1 { fill: var(--accent); fill-opacity: 0.22; stroke: var(--accent); }
    /* ... ditto for layer-2 .. layer-4 ... */

    /* detail panel (visible at all viewports) */
    .vg-w-stack-EXAMPLE .detail { padding: var(--s-2); border-left: 2px solid var(--accent); display: none; }
    .vg-w-stack-EXAMPLE:has(#vg-w-stack-EXAMPLE-r1:checked) .detail-1 { display: block; }
    /* ... ditto for detail-2 .. detail-4 ... */
  </style>

  <input type="radio" id="vg-w-stack-EXAMPLE-r1" name="vg-w-stack-EXAMPLE-sel" checked aria-label="L1" />
  <input type="radio" id="vg-w-stack-EXAMPLE-r2" name="vg-w-stack-EXAMPLE-sel" aria-label="L2" />
  <input type="radio" id="vg-w-stack-EXAMPLE-r3" name="vg-w-stack-EXAMPLE-sel" aria-label="L3" />
  <input type="radio" id="vg-w-stack-EXAMPLE-r4" name="vg-w-stack-EXAMPLE-sel" aria-label="L4" />

  <!-- mobile: HTML cards ─────────────────────────── -->
  <p class="stack-title" id="vg-w-stack-EXAMPLE-title">your stack title here</p>
  <ul class="stack-cards" aria-labelledby="vg-w-stack-EXAMPLE-title">
    <li class="card-1"><label for="vg-w-stack-EXAMPLE-r1">
      <p class="card-head"><span>L1 · short name</span><code class="card-tag">tag</code></p>
      <p class="card-sub">long subtitle that wraps freely on mobile</p>
    </label></li>
    <li class="card-2"><label for="vg-w-stack-EXAMPLE-r2"> ... </label></li>
    <li class="card-3"><label for="vg-w-stack-EXAMPLE-r3"> ... </label></li>
    <li class="card-4"><label for="vg-w-stack-EXAMPLE-r4"> ... </label></li>
  </ul>

  <!-- desktop: SVG diagram (display: none on mobile via CSS) ── -->
  <svg class="diagram" viewBox="0 0 880 360" role="img" aria-label="...">
    <text x="80" y="22" class="head">your title (same content)</text>
    <rect class="layer layer-1" x="60" y="56" width="760" height="56" role="button" />
    <text x="80" y="80" class="layer-text">L1 · short name</text>
    <text x="80" y="100" class="layer-sub">long subtitle</text>
    <!-- arrow, layer-2, layer-3, layer-4 follow the same pattern -->
  </svg>

  <!-- detail panel (shown at both layouts) -->
  <div>
    <p class="hint">click any layer above</p>
    <div class="detail detail-1">
      <h3>L1 · responsibility</h3>
      <p>detail prose for L1</p>
    </div>
    <!-- detail-2, detail-3, detail-4 ... -->
  </div>
</figure>
```

## Hard rules

- **Do NOT add `data-svg-scroll`** to this widget — the SVG is only
  visible at ≥ 720 px where it fits naturally, and the global `figure
  svg { width: 100% !important }` rule makes it scale. Adding
  `data-svg-scroll` would force a min-width on a hidden element and
  trigger the grid-svgscroll-conflict check on desktop.
- **Keep the SVG element in the DOM** (CSS `display: none` only). The
  archetype-check rule "deep-story requires ≥ 1 SVG widget" reads the
  HTML source, not the rendered visibility — so the SVG must still
  exist in the file.
- **Radios drive both layouts**. Cards and SVG layers use the same
  `<input type="radio" name="vg-w-stack-EXAMPLE-sel">` — clicking a
  card label updates the radio, which `:has(input:checked)` then
  styles the matching SVG layer (when visible) AND the detail panel
  (always visible).
- **Title moves out of SVG**. The `<p class="stack-title">` above the
  card list wraps naturally on mobile (where the SVG is hidden).
  Desktop hides this `<p>` because the SVG's `<text>` inside renders
  the same title.
- **Tap targets ≥ 44 px**. The card label's `min-height: 44px`
  satisfies the mobile audit rule (tier-3 § 12.1.C).

## Verification checklist

When retrofitting an existing widget OR using this pattern in a new
post, run the per-widget mobile audit:

1. Resize browser to 375 × 812.
2. Scroll the widget into view.
3. Confirm:
   - The stack-title is fully visible (wraps as needed).
   - Each card's head + subtitle is fully visible (no horizontal scroll
     within the figure).
   - `document.documentElement.scrollWidth === 375` (no page-level
     horizontal scroll caused by the figure).
4. Switch to ≥ 720 px viewport (e.g. 1280 × 900).
5. Confirm the SVG diagram renders with all 4 layers, arrows, and tag
   annotations. Cards are hidden.
6. Click any card / layer to confirm the detail panel updates at both
   layouts.

## Related

- `tier-3-principles.md` § Mobile legibility floor — explains
  `data-svg-scroll` and when it's appropriate (chart/timeline content).
- `anti-examples.md` — pattern G (banned scroll-driven explanation)
  and the rationale for replacing fragile scroll-tied widgets with
  CSS-only alternatives.
