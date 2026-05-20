# Anti-Examples — What NOT to ship

> Required reading alongside `tier-3-principles.md`. Distill.pub-grade
> output is defined as much by what's omitted as by what's included.
> Each entry below is a real shape we want to never see in a vatt'ghern
> deep-story.

## A. Decoration disguised as interaction

### A1. Hover-change-colour with no information

```html
<rect class="vg-w-foo-box"
      onmouseenter="this.style.fill='red'"
      onmouseleave="this.style.fill='blue'" />
```

The reader learns nothing. If the colour change *encoded* a state
(e.g., highlighting which queue an item routed through), it would be
meaningful. As-is, it's decoration.

### A2. Entrance animations

```css
.vg-w-arch-stage { animation: fadeIn 600ms ease-out; }
```

Adds no information. Slows perceived load. Delete.

### A3. "Click to reveal" with no concept being revealed

```html
<button onclick="document.querySelector('.detail').hidden = false">
  Click for more
</button>
<p class="detail" hidden>...some prose...</p>
```

If the prose belongs in the post, just write it inline. If it doesn't,
delete it. "Click to reveal" without a conceptual reason is filler.

### A4. HTML `<label>` wrapping an SVG `<rect>`

```html
<svg viewBox="0 0 480 200">
  <label for="my-radio">
    <rect class="box" x="20" y="60" width="120" height="80" />
    <text x="80" y="105">Router</text>
  </label>
</svg>
```

**SVG does not recognise the HTML `<label>` element.** Inside `<svg>`,
`<label>` is treated as an unknown element, the wrapped `<rect>`
becomes a layout orphan with `getBoundingClientRect()` returning
0×0 — the box is silently invisible. CSS still resolves (`fill`,
`stroke`), the DOM still exists, but nothing is painted. This bug
fails silently — there is no console warning. The only way to catch
it is a visual check (Playwright self-review in Step 8.5).

Use the `data-target` + tiny JS handler pattern instead. See
`tier-1-golden/annotated-diagram-walkthrough.md` for the SVG-safe
working template.

## B. Repetition without contrast

### B1. Three near-identical bar charts

```
[ Chart A: throughput by config, green ]
[ Chart B: throughput by config, blue  ]
[ Chart C: throughput by config, red   ]
```

If three charts share the same axes, scale, and shape, they should be
one chart with three series. The reader's eye should compare *within*
one frame, not jump between three.

### B2. Same widget shape repeated for cosmetic variety

Two donut charts of two different distributions. The donut shape says
"slices of a whole" — if the second one is really a time series, use a
line chart for it. Variety should follow the data, not pad it out.

## C. Fake interactivity

### C1. Chart whose data is hardcoded to "look right"

```js
const points = [10, 18, 35, 50, 62, 71]; // hand-picked to slope nicely
```

If the data isn't real, it's not a data widget — it's an illustration.
Either source real data and cite it, or use SVG for an illustration and
don't pretend it's a chart.

### C2. Slider whose range is 1-10 but only 3 values do anything

```js
slider.addEventListener('input', () => {
  if (slider.value < 3) showState('low');
  else if (slider.value < 7) showState('mid');
  else showState('high');
});
```

If the underlying model has 3 states, use 3 radio buttons. A continuous
slider promises a continuous response; honour the promise or change the
input.

### C3. Animation that loops without start/stop affordance

```js
setInterval(updateFrame, 16);
```

Reader can't pause to inspect a frame, can't reset to start, has no
sense of progress. Either provide controls, or use a static figure.

## D. Redundancy

### D1. Widget that pictures what the prose just said

If the prose says "the cache has three levels: L1, L2, L3", and the
widget is a 3-rectangle diagram labelled "L1 / L2 / L3" with no
additional content, the widget added zero information. Either add
information (capacity, latency, hit rate) or delete the widget.

### D2. Caption that says what the figure is

```html
<figure>
  <svg>...DNS resolution flow...</svg>
  <figcaption>A diagram of DNS resolution flow</figcaption>
</figure>
```

The reader can see it's a DNS resolution flow. The caption should add
something the figure doesn't: a citation, a why-this-matters, a
historical note. Otherwise omit the caption.

## E. Inappropriate weight

### E1. 250-line widget for a 50-line concept

If the concept fits in a paragraph, a 250-line interactive simulation
is overkill. Use a 30-line static SVG and spend the time on the next
widget.

### E2. Static figure for a dynamic concept

If the concept is fundamentally about *time* or *state evolution*
(congestion window, queue fill, build graph traversal), a static
figure cannot capture it. Promote to animation or scroll-driven.

## F. Accessibility / robustness failures

### F1. Hardcoded colour values

```svg
<rect fill="#ff6b35" />
```

Breaks dark mode. Always use `var(--accent)` etc.

### F2. SVG that doesn't reflow at mobile width

```html
<svg viewBox="0 0 480 200" width="480" height="200">
```

Fixed `width` and `height` attributes ignore mobile. Use
`style="width: 100%; height: auto"` and let `viewBox` do the work.

### F3. Interaction that requires hover (no mobile fallback)

If the only way to read a widget's data is to hover over a tooltip, mobile
users lose. Either provide tap-to-toggle, or label the data inline.

### F4. `position: sticky` in 2-col grid, mobile collapses to "figure at bottom"

```css
.vg-w-foo { display: grid; grid-template-columns: 1fr 1fr; }
.vg-w-foo .figure-sticky { position: sticky; top: 32px; }
@media (max-width: 720px) {
  .vg-w-foo { grid-template-columns: 1fr; }
  .vg-w-foo .figure-sticky { position: static; }   /* still wrong */
}
```

Desktop layout `[prose | sticky figure]` works. At mobile the grid
collapses to single column. DOM order is usually `.stages` then
`.figure-sticky`, so dropping sticky puts the figure *underneath* all
the stage prose — the reader has to scroll past 1000px of "stage 1...
stage 2... stage 3..." prose before they see any of the figure that
those stages were referring to. By the time they reach the figure,
the prose is out of viewport and the scroll-driven IntersectionObserver
is no longer firing on anything visible. The whole scroll-driven
mechanism becomes pure decoration on mobile.

**Right pattern**: at mobile, pin the figure to the *top* of the
viewport with `order: -1` so it lifts above the stages, and cap its
height to ~50vh so the prose underneath still has room:

```css
@media (max-width: 720px) {
  .vg-w-foo { grid-template-columns: 1fr; }
  .vg-w-foo .figure-sticky {
    position: sticky;
    top: var(--vg-header-h);   /* offset below sticky site chrome */
    order: -1;
    max-height: 55vh;
    background: var(--bg);
    z-index: 1;
    padding: var(--s-2) 0;
  }
  .vg-w-foo .figure-sticky svg { max-height: 50vh; }
}
```

Using `top: 0` would put the figure *behind* the sticky site header
(`.vg-site-header { position: sticky; top: 0; z-index: 50 }` — ~100px
tall). Use `var(--vg-header-h)` (defined in `src/static/site.css`)
so the figure pins below the chrome. See tier-3-principles §12.1.B.

### F5. `IntersectionObserver` rootMargin -40% on mobile (scroll-driven inert)

```js
const io = new IntersectionObserver(cb, { rootMargin: '-40% 0px -40% 0px' });
```

Desktop viewport ~900px tall → 20% activation band = 180px, big enough
to overlap any stage section. Phone viewport ~667px tall → 20% band =
~133px, often narrower than a stage section. Result: no stage activates
at all — the scroll-driven widget is silently inert on mobile.

Use viewport-relative rootMargin via `matchMedia`:

```js
const isMobile = window.matchMedia('(max-width: 720px)').matches;
const margin = isMobile ? '-25% 0px -25% 0px' : '-40% 0px -40% 0px';
```

See tier-3-principles §12.1.E.

### F6. Tap targets < 32px (sliders, buttons, drag handles)

```css
.vg-w-foo input[type="range"] { /* default 16px thumb */ }
.vg-w-foo .divider { width: 2px; cursor: ew-resize; }
```

Default 16px range thumb is barely tappable on mobile; 2px-wide
divider line cannot be grabbed at all by a fingertip. Wrap fine
elements in a ≥32px hit area:

```css
.vg-w-foo input[type="range"] { height: 36px; accent-color: var(--accent); }
.vg-w-foo .divider { width: 32px; cursor: ew-resize; touch-action: none; }
.vg-w-foo .divider::before { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; transform: translateX(-50%); background: var(--accent); }
```

See tier-3-principles §12.1.C and §12.1.F.

## G. The summary test

Before shipping a widget, ask:

1. Can I write its conceptual question in one sentence? (If no → delete)
2. Does it add information the prose doesn't? (If no → delete)
3. Does interaction (if any) let the reader *manipulate* the concept,
   not just trigger an animation? (If no → make it static)
4. Does it work in dark mode and at 375px? (If no → fix)

A widget that passes all four is worth shipping. A widget that fails
any is dragging the post down.
