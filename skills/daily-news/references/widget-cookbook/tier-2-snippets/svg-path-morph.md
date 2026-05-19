# Tier 2 — SVG Path Morph

> Interpolate between two SVG `path d` attributes for smooth shape
> transitions.

## When to use

- Smooth transition between two architecture states
- Animated graph layout (force-directed settle)
- Morphing one curve into another in a chart (before/after view)

## Complete snippet (paste-and-tweak)

```html
<figure class="vg-w-morph-EXAMPLE">
  <svg viewBox="0 0 200 100">
    <path id="vg-w-morph-EXAMPLE-p" d="M 10 50 Q 100 10 190 50" fill="none" stroke="var(--accent)" stroke-width="2" />
  </svg>
  <button id="vg-w-morph-EXAMPLE-toggle">morph</button>
  <script>
    (function () {
      const root = document.querySelector('.vg-w-morph-EXAMPLE');
      const path = root.querySelector('#vg-w-morph-EXAMPLE-p');
      const btn = root.querySelector('#vg-w-morph-EXAMPLE-toggle');
      const A = 'M 10 50 Q 100 10 190 50';
      const B = 'M 10 50 Q 100 90 190 50';
      let toB = true;
      btn.addEventListener('click', () => {
        path.animate(
          [{ d: `path('${toB ? A : B}')` }, { d: `path('${toB ? B : A}')` }],
          { duration: 600, easing: 'ease-in-out', fill: 'forwards' }
        );
        toB = !toB;
      });
    })();
  </script>
</figure>
```

## Gotchas

- **Path command compatibility**: morph only works smoothly when both
  paths have the same command sequence (same number of M/L/Q/C
  segments). If they differ, browsers fall back to a jumpy linear
  interpolation.
- **`path('...')` CSS syntax** is needed inside WAAPI keyframes for
  the `d` attribute. Without it, the browser treats `d` as a generic
  string and animates per-character (broken).
- **Falling back to manual interpolation**: if browsers don't morph
  cleanly, parse both paths into segments and lerp coordinates in
  rAF — more code but bulletproof.
