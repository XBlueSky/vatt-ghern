# Tier 2 — Before/After Slider

> Two figures overlaid with a draggable vertical divider revealing the
> "after" view from the right side.

## When to use

- Show the visual / structural diff of a refactor or migration
- Compare two algorithm visualisations on the same input
- Before/after of a CSS bug fix on a real page screenshot (SVG)

## Required mental model

The convention is: **`.before` is the base layer, `.after` overlays its
own right half on top.** Dragging the divider to the right reveals more
of `.after`.

Three things must agree or the widget breaks visually:

1. **DOM order**: `.before` element BEFORE `.after`. The later element
   paints on top by default; we want `.after` on top.
2. **CSS clip-path**: `.after` clips to the RIGHT half initially —
   `polygon(50% 0, 100% 0, 100% 100%, 50% 100%)`. The `.before` layer
   is NOT clipped (default) because it forms the full base.
3. **JS setPct**: drag updates `.after`'s clip-path as
   `polygon(P% 0, 100% 0, 100% 100%, P% 100%)`. The seam at `P%` matches
   the divider position.

Getting any one of these inverted (e.g. clipping `.after` to the LEFT
half, or putting `.after` BEFORE `.before` in DOM order) makes the
right pane invisible because the unclipped `.before` covers it. PR #30
hit exactly this when the Rust BA-slider widget inverted both the
clip-path and the DOM order — half the diagram simply never rendered.

## Complete snippet (paste-and-tweak)

```html
<figure class="vg-w-ba-EXAMPLE" data-interactive="drag" data-svg-scroll="720">
  <style>
    .vg-w-ba-EXAMPLE { position: relative; aspect-ratio: 16 / 9; overflow: hidden; }
    .vg-w-ba-EXAMPLE .layer { position: absolute; inset: 0; }
    /* `.after` overlays the RIGHT half on top of `.before`. */
    .vg-w-ba-EXAMPLE .after { clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%); }
    .vg-w-ba-EXAMPLE .divider {
      position: absolute; top: 0; bottom: 0; left: 50%;
      width: 32px; transform: translateX(-50%);
      cursor: ew-resize; touch-action: none;
    }
    .vg-w-ba-EXAMPLE .divider::before {
      content: ''; position: absolute; left: 50%; top: 0; bottom: 0;
      width: 2px; transform: translateX(-50%);
      background: var(--accent);
    }
    .vg-w-ba-EXAMPLE .divider::after {
      content: '↔'; position: absolute; left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      background: var(--accent); color: var(--bg);
      width: 32px; height: 32px; border-radius: 50%;
      display: grid; place-items: center;
      font-family: var(--sans); font-size: 16px;
    }
  </style>

  <!-- DOM ORDER MATTERS: .before MUST come first so .after paints on top. -->
  <svg class="layer before" viewBox="0 0 400 225">
    <rect width="400" height="225" fill="var(--bg-soft)" />
    <text x="200" y="120" text-anchor="middle" font-family="EB Garamond, serif" font-size="18">before</text>
  </svg>
  <svg class="layer after" viewBox="0 0 400 225" id="vg-w-ba-EXAMPLE-after">
    <rect width="400" height="225" fill="var(--accent)" fill-opacity="0.15" />
    <text x="200" y="120" text-anchor="middle" font-family="EB Garamond, serif" font-size="18" fill="var(--accent-text)">after</text>
  </svg>
  <div class="divider" id="vg-w-ba-EXAMPLE-divider"></div>
  <script>
    (function () {
      const root = document.querySelector('.vg-w-ba-EXAMPLE');
      const after = root.querySelector('#vg-w-ba-EXAMPLE-after');
      const divider = root.querySelector('#vg-w-ba-EXAMPLE-divider');
      let dragging = false;
      function setPct(pct) {
        const clamped = Math.max(0, Math.min(100, pct));
        // Mirror of the static CSS: .after's visible band is [P%, 100%].
        after.style.clipPath = `polygon(${clamped}% 0, 100% 0, 100% 100%, ${clamped}% 100%)`;
        divider.style.left = `${clamped}%`;
      }
      divider.addEventListener('pointerdown', (e) => {
        dragging = true;
        divider.setPointerCapture(e.pointerId);
      });
      root.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const rect = root.getBoundingClientRect();
        setPct(((e.clientX - rect.left) / rect.width) * 100);
      });
      root.addEventListener('pointerup', () => { dragging = false; });
      root.addEventListener('pointercancel', () => { dragging = false; });
    })();
  </script>
</figure>
```

## Variant: code panels instead of SVG (HTML "after" wins right half)

If `.before` and `.after` each hold full-width code blocks (not SVG),
the clip-path approach hides only the visual paint — the underlying
text still occupies the full element width. Showing only the right half
of a left-aligned code block produces gibberish (a tail of every line).

Fix: pre-position each pane's content into its own half via `padding`,
so each side's text is already squeezed into the visible half.

```css
.vg-w-ba-EXAMPLE .before { padding-right: 50%; }  /* text only on the LEFT half */
.vg-w-ba-EXAMPLE .after  { padding-left: 50%;  }  /* text only on the RIGHT half */
.vg-w-ba-EXAMPLE .before { clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%); }
.vg-w-ba-EXAMPLE .after  { clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%); }
```

And in `setPct`, update BOTH clip-paths:

```js
before.style.clipPath = `polygon(0 0, ${clamped}% 0, ${clamped}% 100%, 0 100%)`;
after.style.clipPath  = `polygon(${clamped}% 0, 100% 0, 100% 100%, ${clamped}% 100%)`;
```

## Gotchas

- **`clip-path: polygon`** is the safest way to reveal — works across
  browsers and supports any divider shape.
- **DOM order is structural, not stylistic**: `.before` first, `.after`
  second. Any reordering breaks the layering even if the clip-path is
  correct.
- **Both halves must look complete on their own**: at the default 50/50
  position, the reader sees `.before`'s left half + `.after`'s right
  half. Author each layer so its half makes sense in isolation. If the
  layer is a wide HTML code block where text spans the full width, use
  the padding variant above.
- **Mobile drag**: pointer events work; ensure the touch target on the
  divider is ≥ 32px square.
- **Same coordinate system**: ensure both layers share the same
  viewBox (for SVG) or pixel dimensions (for HTML); otherwise the
  comparison is misleading.
- **Always set `data-interactive="drag"`** on the `<figure>` so the
  affordance badge appears (per `references/design-system.md`).
- **Always set `data-svg-scroll="N"`** if the inner SVG would otherwise
  shrink text below 11 px on a 375 viewport (per design-system § Mobile
  legibility floor).

## Invariant for review

After authoring, verify by inspection:

```js
// In DevTools console on the live page:
const fig = document.querySelector('.vg-w-ba-EXAMPLE');
const b = fig.querySelector('.before');
const a = fig.querySelector('.after');
console.log({
  dom_order_ok: Array.from(fig.children).indexOf(b) < Array.from(fig.children).indexOf(a),
  after_clip:   getComputedStyle(a).clipPath,
  // expected: contains "50%" as the left edge initially
});
```

Step 8.5's visual review must screenshot the widget at the default 50/50
position and confirm both halves contain visible, sensical content.
"Right half is blank or showing the tail of left-half code" = the bug
above.
