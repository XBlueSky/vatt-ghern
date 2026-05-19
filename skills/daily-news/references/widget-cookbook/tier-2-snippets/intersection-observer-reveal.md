# Tier 2 — IntersectionObserver Reveal

> Fire a callback when an element enters/exits the viewport. Building
> block for scroll-driven explanations, lazy widget initialisation, and
> stage-tracking inside a long article.

## When to use

- Trigger an animation only after the widget is scrolled into view
  (avoid wasting frames on off-screen work).
- Drive a `scroll-driven-explanation` widget when CSS scroll-timeline
  is unavailable.
- Mark sections as "read" when they pass through the viewport center.

## Complete snippet (paste-and-tweak)

```html
<div class="vg-w-reveal-EXAMPLE">
  <div class="track">
    <div class="step" data-step="1">step 1</div>
    <div class="step" data-step="2">step 2</div>
    <div class="step" data-step="3">step 3</div>
  </div>
  <script>
    (function () {
      const root = document.querySelector('.vg-w-reveal-EXAMPLE');
      const steps = root.querySelectorAll('.step');
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('active');
          }
        }
      }, {
        // rootMargin tweak: shrink the viewport so only the center triggers
        rootMargin: '-30% 0px -30% 0px',
        threshold: 0
      });
      for (const s of steps) io.observe(s);
    })();
  </script>
</div>
```

## Gotchas

- **`rootMargin` direction**: positive values *grow* the observation
  area beyond the viewport; negative values *shrink* it. To trigger
  only when the element is at the center, use a symmetric negative
  margin like `-30% 0px -30% 0px`.
- **`threshold`**: `0` fires as soon as 1px of the element enters.
  Use `[0, 0.5, 1]` for finer-grained tracking.
- **One-shot vs continuous**: if you want a step to "lock in" once
  triggered, call `io.unobserve(e.target)` inside the callback.
- **Don't observe hundreds of elements** — IntersectionObserver is
  efficient but each element costs a bit; for very long pages,
  observe section headers, not paragraphs.
