# Tier 2 — CSS Scroll-Driven Animation

> Use `animation-timeline: scroll()` to drive an animation by scroll
> position. Pure CSS, no JS needed.

## When to use

- Reveal animation as reader scrolls into the widget
- Progress indicator that fills as the page scrolls
- Element that rotates / scales / translates based on scroll position

## Complete snippet (paste-and-tweak)

```html
<div class="vg-w-scrolltimeline-EXAMPLE">
  <style>
    .vg-w-scrolltimeline-EXAMPLE { position: relative; height: 200vh; }
    .vg-w-scrolltimeline-EXAMPLE .fixed-art { position: sticky; top: 30vh; height: 40vh; }
    .vg-w-scrolltimeline-EXAMPLE .bar {
      width: 100%;
      height: 4px;
      background: var(--accent);
      transform-origin: 0% 50%;
      animation: vg-w-scrolltimeline-EXAMPLE-grow linear;
      animation-timeline: --scrollProgress;
    }
    .vg-w-scrolltimeline-EXAMPLE { scroll-timeline: --scrollProgress y; }
    @keyframes vg-w-scrolltimeline-EXAMPLE-grow {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }
    /* Fallback for non-supporting browsers */
    @supports not (animation-timeline: scroll()) {
      .vg-w-scrolltimeline-EXAMPLE .bar { transform: scaleX(1); }
    }
  </style>
  <div class="fixed-art">
    <div class="bar"></div>
  </div>
</div>
```

## Gotchas

- **Browser support** (as of 2026): Chromium-based browsers ship it,
  Firefox is behind a flag, Safari partial. Always provide an
  `@supports not` fallback so non-supporting browsers see a sensible
  static state.
- **`scroll()` vs `view()`**: `scroll()` is driven by ancestor scroll
  position; `view()` is driven by element's own visibility. Pick
  based on whether you want "scroll across the whole article" or
  "animate as this widget enters viewport".
- **Performance**: scroll-driven animations are compositor-driven and
  cheap; no rAF overhead.
- **Don't combine with JS-driven scroll handlers** — they'll fight.
  Pick one timeline driver per animation.
