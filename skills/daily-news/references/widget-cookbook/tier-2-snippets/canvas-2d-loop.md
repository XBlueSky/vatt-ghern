# Tier 2 — Canvas 2D rAF Loop

> The minimal main loop for canvas animations, with pause/reset and
> DPR-aware sizing.

## When to use

- Anything with continuous time evolution (queues, particles,
  congestion windows, leader election timing)
- Frame rates ≥ 30 fps where re-rendering an SVG would be jank-prone
- Anti-aliased pixel rendering for plots with many points

## Complete snippet (paste-and-tweak)

```html
<figure class="vg-w-loop-EXAMPLE">
  <style>
    .vg-w-loop-EXAMPLE canvas { width: 100%; height: auto; aspect-ratio: 16 / 9; display: block; }
    .vg-w-loop-EXAMPLE .toolbar { display: flex; gap: var(--s-2); font-family: var(--sans); font-size: var(--fs-sm); }
    .vg-w-loop-EXAMPLE button { padding: 4px 12px; border: 1px solid var(--line); background: var(--bg); cursor: pointer; }
  </style>
  <div class="toolbar">
    <button data-act="toggle">▷ play</button>
    <button data-act="reset">↺ reset</button>
    <span data-clock style="margin-left: auto; font-variant-numeric: tabular-nums">t=0.00s</span>
  </div>
  <canvas></canvas>
  <script>
    (function () {
      const root = document.querySelector('.vg-w-loop-EXAMPLE');
      const canvas = root.querySelector('canvas');
      const toggleBtn = root.querySelector('[data-act=toggle]');
      const resetBtn = root.querySelector('[data-act=reset]');
      const clock = root.querySelector('[data-clock]');
      const ctx = canvas.getContext('2d');

      // DPR-aware sizing
      let cssW = 0, cssH = 0;
      function resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        cssW = rect.width; cssH = rect.height;
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const ro = new ResizeObserver(resize); ro.observe(canvas);

      // Model state
      let running = false, t = 0;
      function step(dt) { t += dt; /* model updates here */ }
      function draw() {
        ctx.clearRect(0, 0, cssW, cssH);
        // draw using cssW / cssH (logical CSS pixels)
        ctx.fillStyle = getComputedStyle(root).getPropertyValue('--accent').trim() || '#888';
        ctx.fillRect(20, 20, 100 + 50 * Math.sin(t), 40);
      }

      let last = performance.now();
      function frame(now) {
        const dt = Math.min(0.1, (now - last) / 1000); last = now;
        if (running) step(dt);
        draw();
        clock.textContent = `t=${t.toFixed(2)}s`;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);

      toggleBtn.addEventListener('click', () => {
        running = !running;
        toggleBtn.textContent = running ? '⏸ pause' : '▷ play';
        last = performance.now();
      });
      resetBtn.addEventListener('click', () => {
        running = false; toggleBtn.textContent = '▷ play'; t = 0;
      });
    })();
  </script>
</figure>
```

## Gotchas

- **Always cap `dt`** (`Math.min(0.1, ...)`) — tab switches can produce
  arbitrarily long frames; without the cap, the simulation jumps.
- **DPR-aware sizing**: setting `canvas.width = cssW * dpr` plus
  `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` gives crisp rendering on
  retina without making the canvas physically huge.
- **Don't `setInterval(loop, 16)`** — drifts under load, fights with
  the browser's compositor. Always `requestAnimationFrame`.
- **`getComputedStyle` is slow** in hot paths — cache the colour
  outside the draw function or read via CSS custom property.
