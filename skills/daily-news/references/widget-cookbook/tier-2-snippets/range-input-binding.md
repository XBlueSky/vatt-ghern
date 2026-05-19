# Tier 2 — Range Input Binding

> `<input type="range">` paired with a live numeric readout and a
> redraw callback. Foundation of `interactive-param-demo`.

## When to use

- Any widget where the reader sweeps a continuous variable
- Multiple sliders side-by-side for n-D sweeps
- Pair with a derived display ("N=20 → 1.3 ms")

## Complete snippet (paste-and-tweak)

```html
<div class="vg-w-range-EXAMPLE">
  <style>
    .vg-w-range-EXAMPLE { display: flex; align-items: center; gap: var(--s-2); font-family: var(--sans); font-size: var(--fs-sm); }
    .vg-w-range-EXAMPLE input { flex: 1; accent-color: var(--accent); }
    .vg-w-range-EXAMPLE .readout { font-variant-numeric: tabular-nums; color: var(--ink); min-width: 8ch; text-align: right; }
  </style>
  <label for="vg-w-range-EXAMPLE-x">N =</label>
  <input id="vg-w-range-EXAMPLE-x" type="range" min="1" max="100" step="1" value="20" />
  <span class="readout">20</span>
  <script>
    (function () {
      const root = document.querySelector('.vg-w-range-EXAMPLE');
      const inp = root.querySelector('input');
      const out = root.querySelector('.readout');
      function onInput() {
        const n = Number(inp.value);
        out.textContent = String(n);
        // call your redraw / recompute here
      }
      inp.addEventListener('input', onInput);
      onInput();
    })();
  </script>
</div>
```

## Gotchas

- **Use `input` event, not `change`** — `change` fires only on
  release; `input` fires per pixel of drag.
- **`accent-color: var(--accent)`** styles the slider thumb to match
  the design system. Avoid custom `::-webkit-slider-thumb` styling
  unless you need it — it's brittle across browsers.
- **`step="any"` for continuous** — default step is 1 (integer).
- **Tabular numerals on readout** prevents the layout from jittering
  as digits change width.
- **Mobile**: range inputs work fine on touch, but the thumb is
  small. Consider `style="height: 32px"` on the input for tap targets.
