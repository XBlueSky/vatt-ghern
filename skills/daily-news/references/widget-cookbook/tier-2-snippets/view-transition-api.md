# Tier 2 — View Transition API

> `document.startViewTransition()` runs a callback then animates the
> DOM diff. Useful for state-swap animations without manual keyframes.

## When to use

- Swap between two states of a widget (before / after)
- Animate list reorderings (sort by X vs sort by Y)
- Crossfade between two SVG figures

## Complete snippet (paste-and-tweak)

```html
<div class="vg-w-vt-EXAMPLE">
  <style>
    .vg-w-vt-EXAMPLE { display: grid; gap: var(--s-2); }
    .vg-w-vt-EXAMPLE .box { background: var(--bg-soft); padding: var(--s-2); border: 1px solid var(--line); }
    .vg-w-vt-EXAMPLE button { padding: 4px 12px; }
    /* The pseudo-elements are the API's hook for the transition. */
    ::view-transition-old(vgw-state), ::view-transition-new(vgw-state) {
      animation-duration: 400ms;
    }
    .vg-w-vt-EXAMPLE .state-content { view-transition-name: vgw-state; }
  </style>
  <button id="vg-w-vt-EXAMPLE-swap">swap state</button>
  <div class="box">
    <div class="state-content" id="vg-w-vt-EXAMPLE-content">state A</div>
  </div>
  <script>
    (function () {
      const root = document.querySelector('.vg-w-vt-EXAMPLE');
      const btn = root.querySelector('#vg-w-vt-EXAMPLE-swap');
      const content = root.querySelector('#vg-w-vt-EXAMPLE-content');
      let toggle = false;
      btn.addEventListener('click', () => {
        const next = toggle ? 'state A' : 'state B';
        toggle = !toggle;
        if (document.startViewTransition) {
          document.startViewTransition(() => { content.textContent = next; });
        } else {
          content.textContent = next; // fallback: just swap
        }
      });
    })();
  </script>
</div>
```

## Gotchas

- **Browser support** (as of 2026): Chromium ships same-document
  transitions; cross-document is still settling. Always wrap with the
  `if (document.startViewTransition)` guard.
- **`view-transition-name` must be unique per page** — give it a
  prefix tied to the widget.
- **Nested transitions** are tricky; keep one transition root per
  widget.
- **Customise per element** with
  `::view-transition-old(name)` / `::view-transition-new(name)`.
