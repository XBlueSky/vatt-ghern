# Tier 2 — CSS 3D Transform

> `perspective` + `transform: rotateX/Y/Z` for diagrams that benefit
> from 3D structure (packet header layers, storage stack, network
> layer stack).

## When to use

- Show a "stack" of layers where each layer has labels
- Reveal a packet's bytes as you rotate the view
- Subtle 3D for emphasis (don't go full diorama)

## Complete snippet (paste-and-tweak)

```html
<figure class="vg-w-3d-EXAMPLE">
  <style>
    .vg-w-3d-EXAMPLE .stage { perspective: 1200px; height: 240px; }
    .vg-w-3d-EXAMPLE .stack {
      transform-style: preserve-3d;
      transform: rotateX(-20deg) rotateY(-30deg);
      width: 200px;
      height: 200px;
      margin: 20px auto;
      position: relative;
    }
    .vg-w-3d-EXAMPLE .layer {
      position: absolute;
      width: 200px;
      height: 30px;
      border: 1.5px solid var(--ink);
      background: var(--bg-soft);
      font-family: var(--sans);
      font-size: var(--fs-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ink);
    }
    .vg-w-3d-EXAMPLE .l1 { transform: translateZ(0px);   }
    .vg-w-3d-EXAMPLE .l2 { transform: translateZ(-40px); }
    .vg-w-3d-EXAMPLE .l3 { transform: translateZ(-80px); }
    .vg-w-3d-EXAMPLE .l4 { transform: translateZ(-120px); }
  </style>
  <div class="stage">
    <div class="stack">
      <div class="layer l1">L7 · application</div>
      <div class="layer l2">L4 · TCP</div>
      <div class="layer l3">L3 · IP</div>
      <div class="layer l4">L2 · Ethernet</div>
    </div>
  </div>
</figure>
```

## Gotchas

- **`transform-style: preserve-3d`** on the parent is required;
  without it, children flatten into 2D.
- **Don't over-rotate** — 20-30° gives perceptible 3D without making
  text unreadable. >45° loses legibility.
- **Mobile**: a 3D scene can feel claustrophobic at 375px; consider
  flattening (`@media (max-width: 480px) { transform: none }`).
- **Accessibility**: 3D transforms make screen-reader order
  unchanged, but a low-vision reader may struggle with skewed text.
  Provide a textual summary in `figcaption`.
