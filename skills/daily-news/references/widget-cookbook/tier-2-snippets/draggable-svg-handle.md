# Tier 2 — Draggable SVG Handle

> Drag a circle (or any element) inside an SVG using pointer events,
> with boundary clamping in viewBox coordinates.

## When to use

- "Drag the packet along the path" interactions
- Adjust a parameter via spatial manipulation rather than a slider
- Move a cursor through a state space (e.g., loss landscape)

## Complete snippet (paste-and-tweak)

```html
<figure class="vg-w-drag-EXAMPLE">
  <svg viewBox="0 0 400 100">
    <line x1="20" y1="50" x2="380" y2="50" stroke="var(--muted-2)" stroke-width="1" />
    <circle id="vg-w-drag-EXAMPLE-h" cx="200" cy="50" r="10" fill="var(--accent)" cursor="grab" />
    <text id="vg-w-drag-EXAMPLE-label" x="200" y="30" text-anchor="middle" font-family="Manrope, sans-serif" font-size="12" fill="var(--ink)">0.50</text>
  </svg>
  <script>
    (function () {
      const root = document.querySelector('.vg-w-drag-EXAMPLE');
      const svg = root.querySelector('svg');
      const handle = root.querySelector('#vg-w-drag-EXAMPLE-h');
      const label = root.querySelector('#vg-w-drag-EXAMPLE-label');
      const X_MIN = 20, X_MAX = 380;

      let dragging = false;
      function clientToSvgX(clientX) {
        const pt = svg.createSVGPoint();
        pt.x = clientX; pt.y = 0;
        const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
        return Math.max(X_MIN, Math.min(X_MAX, svgPt.x));
      }
      function update(x) {
        handle.setAttribute('cx', x);
        label.setAttribute('x', x);
        const norm = (x - X_MIN) / (X_MAX - X_MIN);
        label.textContent = norm.toFixed(2);
        // Hook your redraw / recompute here.
      }
      handle.addEventListener('pointerdown', (e) => {
        dragging = true;
        handle.setPointerCapture(e.pointerId);
        handle.setAttribute('cursor', 'grabbing');
      });
      handle.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        update(clientToSvgX(e.clientX));
      });
      handle.addEventListener('pointerup', (e) => {
        dragging = false;
        handle.setAttribute('cursor', 'grab');
      });
    })();
  </script>
</figure>
```

## Gotchas

- **Pointer events, not mouse/touch** — pointer events unify both;
  `setPointerCapture` keeps the drag tracking even if the pointer
  leaves the element.
- **`getScreenCTM().inverse()`** is the standard incantation for
  converting client-space coordinates back into viewBox space. Cache
  it if the SVG doesn't resize.
- **Cursor change on drag**: `grab` → `grabbing` is the conventional
  affordance.
- **Touch action**: add `touch-action: none` to the SVG (or the
  handle) if the page scrolls horizontally and you want drags to stay
  inside the widget.
