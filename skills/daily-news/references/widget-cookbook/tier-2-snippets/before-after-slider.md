# Tier 2 — Before/After Slider

> Two figures overlaid with a draggable vertical divider revealing the
> "after" view.

## When to use

- Show the visual / structural diff of a refactor or migration
- Compare two algorithm visualisations on the same input
- Before/after of a CSS bug fix on a real page screenshot (SVG)

## Complete snippet (paste-and-tweak)

```html
<figure class="vg-w-ba-EXAMPLE">
  <style>
    .vg-w-ba-EXAMPLE { position: relative; aspect-ratio: 16 / 9; overflow: hidden; }
    .vg-w-ba-EXAMPLE .layer { position: absolute; inset: 0; }
    .vg-w-ba-EXAMPLE .after { clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%); }
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
        after.style.clipPath = `polygon(0 0, ${clamped}% 0, ${clamped}% 100%, 0 100%)`;
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
    })();
  </script>
</figure>
```

## Gotchas

- **`clip-path: polygon`** is the safest way to reveal — works across
  browsers and supports any divider shape.
- **Mobile drag**: pointer events work; ensure the touch target on
  the divider is ≥ 32px square.
- **Don't show "before" and "after" labels in the figure** if the
  divider context already implies them; double-labelling is noise.
- **Same coordinate system**: ensure both layers share the same
  viewBox; otherwise the comparison is misleading.
