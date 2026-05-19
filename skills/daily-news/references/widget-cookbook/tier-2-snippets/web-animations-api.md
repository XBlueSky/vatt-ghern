# Tier 2 — Web Animations API

> `element.animate()` for precise timing control beyond CSS keyframes.
> Returns an `Animation` object you can pause, reverse, or compose.

## When to use

- Sequence multiple property changes with custom easing per step
- Pause/resume an animation imperatively (e.g., when reader scrolls
  away)
- Animate properties CSS keyframes cannot reach (SVG `pathLength`,
  arbitrary attributes)

## Complete snippet (paste-and-tweak)

```html
<div class="vg-w-anim-EXAMPLE">
  <button id="vg-w-anim-EXAMPLE-go">animate</button>
  <svg viewBox="0 0 200 100">
    <circle id="vg-w-anim-EXAMPLE-dot" cx="20" cy="50" r="8" fill="var(--accent)" />
  </svg>
  <script>
    (function () {
      const root = document.querySelector('.vg-w-anim-EXAMPLE');
      const dot = root.querySelector('#vg-w-anim-EXAMPLE-dot');
      const btn = root.querySelector('#vg-w-anim-EXAMPLE-go');
      let animation = null;
      btn.addEventListener('click', () => {
        if (animation && animation.playState === 'running') {
          animation.pause();
          return;
        }
        animation = dot.animate([
          { cx: 20,  offset: 0 },
          { cx: 180, offset: 1 }
        ], {
          duration: 1200,
          easing: 'cubic-bezier(0.5, 0, 0.5, 1)',
          fill: 'forwards'
        });
        // Note: animating SVG attributes via WAAPI requires browser
        // support for the underlying attribute. cx works in current
        // Chromium/Firefox/Safari.
      });
    })();
  </script>
</div>
```

## Gotchas

- **SVG attribute animation** is supported but check the specific
  attribute. Numeric attributes (`cx`, `cy`, `r`, `x1`) generally
  work; complex attributes (`d`, `transform`) may need a CSS variable
  intermediate.
- **`fill: 'forwards'`** keeps the end state after the animation
  finishes. Without it, the element snaps back.
- **`animation.commitStyles()`** commits the current animated value
  to the inline style. Useful when you want to swap animations.
- **Cancellation**: `animation.cancel()` returns the element to its
  pre-animation state; `animation.finish()` jumps to the end.
