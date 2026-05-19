# Tier 2 — CSS Container Query

> `@container` lets a widget adapt its layout to its container width,
> not the viewport width. Crucial for widgets that render in
> different column widths (prose column vs figure breakout).

## When to use

- Widget that should be horizontal in a wide column, vertical in a
  narrow one
- Adjust font size based on widget width, not page width
- Two-column layout that collapses when the widget itself shrinks

## Complete snippet (paste-and-tweak)

```html
<div class="vg-w-cq-EXAMPLE">
  <style>
    .vg-w-cq-EXAMPLE { container-type: inline-size; container-name: vgw; }
    .vg-w-cq-EXAMPLE .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--s-2);
    }
    @container vgw (min-width: 480px) {
      .vg-w-cq-EXAMPLE .grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    @container vgw (min-width: 720px) {
      .vg-w-cq-EXAMPLE .grid {
        grid-template-columns: 1fr 1fr 1fr;
      }
    }
  </style>
  <div class="grid">
    <div>cell A</div>
    <div>cell B</div>
    <div>cell C</div>
  </div>
</div>
```

## Gotchas

- **`container-type: inline-size`** is the most common — queries on
  width. `container-type: size` queries on both dimensions but requires
  the container to have a defined block size (often inconvenient).
- **Naming containers** (`container-name: vgw`) prevents collisions
  when a widget is nested inside another container query.
- **Browser support** (as of 2026): widespread across modern
  browsers. Safe to use without `@supports` fallback for vatt-ghern's
  audience.
- **Container queries trigger style recalc** — don't query every 1px;
  pick semantic breakpoints (e.g., 480, 720, 960).
