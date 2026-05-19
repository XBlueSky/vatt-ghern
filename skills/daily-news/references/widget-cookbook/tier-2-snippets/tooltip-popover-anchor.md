# Tier 2 — Tooltip / Popover with CSS Anchor Positioning

> CSS `anchor-positioning` lets a popover position itself relative to
> an anchor element. Provides hover-detail without JS positioning math.

## When to use

- Hover detail on chart data points
- Inline glossary entries (definition popover on a term)
- "What's this number?" affordance next to a label

## Complete snippet (paste-and-tweak)

```html
<div class="vg-w-pop-EXAMPLE">
  <style>
    .vg-w-pop-EXAMPLE { position: relative; }
    .vg-w-pop-EXAMPLE .term { anchor-name: --vgw-anchor; text-decoration: underline dotted var(--muted); cursor: help; }
    .vg-w-pop-EXAMPLE .pop {
      position-anchor: --vgw-anchor;
      position: absolute;
      top: anchor(bottom);
      left: anchor(center);
      translate: -50% var(--s-1);
      padding: var(--s-1) var(--s-2);
      background: var(--bg-soft);
      border: 1px solid var(--line);
      font-family: var(--scribed);
      font-size: var(--fs-sm);
      max-width: 32ch;
      opacity: 0;
      transition: opacity 100ms;
      pointer-events: none;
    }
    .vg-w-pop-EXAMPLE .term:hover + .pop,
    .vg-w-pop-EXAMPLE .term:focus + .pop { opacity: 1; }
    /* Fallback without anchor positioning */
    @supports not (anchor-name: --x) {
      .vg-w-pop-EXAMPLE .pop { position: static; opacity: 1; pointer-events: auto; }
    }
  </style>
  <p>
    The system uses a <span class="term" tabindex="0">consistent hash ring</span>
    <span class="pop">A data structure where each key hashes to a fixed point on a circle, and the closest server clockwise owns the key. Adding a server only re-shuffles keys near its inserted position.</span>
    to route requests.
  </p>
</div>
```

## Gotchas

- **Browser support** (as of 2026): Chromium ships anchor positioning,
  Safari has partial support, Firefox is behind a flag. Always provide
  an `@supports not` fallback that degrades to inline.
- **Mobile**: hover doesn't exist; expose via tap (`:focus` works if
  the term has `tabindex="0"`).
- **`pointer-events: none`** on the pop while hidden prevents
  blocking clicks on underlying content.
- **Don't over-tooltip** — if a term needs explaining, often the
  prose should explain it inline rather than hiding the explanation.
