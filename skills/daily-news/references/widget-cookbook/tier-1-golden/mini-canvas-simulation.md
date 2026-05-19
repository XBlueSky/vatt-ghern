# Tier 1 — Mini Canvas Simulation

> Hero template for posts where the central insight is the *dynamic
> behaviour* of a system over time.

## When to pick this template

Pick when the concept is fundamentally about time-evolution or
state-change-under-load, and a static figure cannot capture the
intuition. Canvas (not SVG) because we redraw 60 times per second.

Examples:
- TCP congestion window growth (slow-start, fast retransmit)
- Queue overflow (M/M/1, M/M/c) under varying load
- Cache eviction policies (LRU vs LFU vs ARC) on a trace
- Raft log replication / leader election
- Particle-based illustrations (Brownian motion, lock-step physics)

## Conceptual question it answers

"What does this dynamic behaviour look like over time, and how does
changing input X affect the trajectory?"

## Complete working HTML + JS (paste-and-modify)

```html
<figure class="vg-w-canvas-EXAMPLE">
  <style>
    .vg-w-canvas-EXAMPLE { display: grid; grid-template-rows: auto 1fr auto; gap: var(--s-2); }
    .vg-w-canvas-EXAMPLE .toolbar { display: flex; align-items: center; gap: var(--s-2); font-family: var(--sans); font-size: var(--fs-sm); color: var(--muted); }
    .vg-w-canvas-EXAMPLE button { font-family: var(--sans); font-size: var(--fs-sm); padding: 4px 12px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); cursor: pointer; }
    .vg-w-canvas-EXAMPLE button:hover { border-color: var(--accent); color: var(--accent-text); }
    .vg-w-canvas-EXAMPLE canvas { width: 100%; height: auto; aspect-ratio: 16 / 9; display: block; }
    .vg-w-canvas-EXAMPLE figcaption { font-family: var(--scribed); font-size: var(--fs-sm); color: var(--muted); }
  </style>

  <div class="toolbar">
    <button id="vg-w-canvas-EXAMPLE-toggle">▷ play</button>
    <button id="vg-w-canvas-EXAMPLE-reset">↺ reset</button>
    <span style="margin-left: auto" id="vg-w-canvas-EXAMPLE-clock">t = 0.00s</span>
  </div>

  <canvas id="vg-w-canvas-EXAMPLE-canvas"></canvas>

  <figcaption>Queue arrivals (Poisson λ=2/s) into a single FIFO server. Watch the queue depth track load and recover.</figcaption>

  <script>
    (function () {
      const root = document.querySelector('.vg-w-canvas-EXAMPLE');
      const canvas = root.querySelector('canvas');
      const toggle = root.querySelector('#vg-w-canvas-EXAMPLE-toggle');
      const reset = root.querySelector('#vg-w-canvas-EXAMPLE-reset');
      const clock = root.querySelector('#vg-w-canvas-EXAMPLE-clock');
      const ctx = canvas.getContext('2d');

      // DPR-aware sizing
      function resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      window.addEventListener('resize', resize);
      resize();

      // Model state
      let running = false;
      let t = 0;
      let queue = []; // each entry = arrival time
      let serving = null; // current item being served (or null)
      const ARRIVAL_RATE = 2.0;  // λ per second
      const SERVICE_RATE = 1.8;  // μ per second
      let nextArrival = -Math.log(Math.random()) / ARRIVAL_RATE;

      function step(dt) {
        t += dt;
        while (nextArrival < t) {
          queue.push(nextArrival);
          nextArrival += -Math.log(Math.random()) / ARRIVAL_RATE;
        }
        if (!serving && queue.length > 0) {
          serving = { startedAt: t, duration: -Math.log(Math.random()) / SERVICE_RATE };
          queue.shift();
        }
        if (serving && t - serving.startedAt >= serving.duration) {
          serving = null;
        }
      }

      function draw() {
        const W = canvas.getBoundingClientRect().width;
        const H = canvas.getBoundingClientRect().height;
        ctx.clearRect(0, 0, W, H);

        // axes / labels
        ctx.font = '14px "EB Garamond", serif';
        ctx.fillStyle = getCssVar('--muted');
        ctx.fillText('queue', 12, 20);
        ctx.fillText('server', W - 80, 20);

        // queue boxes
        const boxW = 24, boxH = 24, gap = 4;
        for (let i = 0; i < Math.min(queue.length, 12); i++) {
          ctx.fillStyle = getCssVar('--accent');
          ctx.globalAlpha = 0.6;
          ctx.fillRect(20 + i * (boxW + gap), H / 2 - boxH / 2, boxW, boxH);
        }
        ctx.globalAlpha = 1;

        // server box
        ctx.strokeStyle = getCssVar('--ink');
        ctx.lineWidth = 1.5;
        ctx.strokeRect(W - 100, H / 2 - 30, 80, 60);
        if (serving) {
          ctx.fillStyle = getCssVar('--sage');
          ctx.fillRect(W - 96, H / 2 - 26, 72, 52);
        }

        // queue length history
        // (omitted for brevity — implement as ring buffer + polyline if desired)
      }

      function getCssVar(name) {
        return getComputedStyle(root).getPropertyValue(name).trim() || '#000';
      }

      let last = performance.now();
      function frame(now) {
        const dt = Math.min(0.1, (now - last) / 1000);
        last = now;
        if (running) step(dt);
        draw();
        clock.textContent = `t = ${t.toFixed(2)}s · queue: ${queue.length}`;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);

      toggle.addEventListener('click', () => {
        running = !running;
        toggle.textContent = running ? '⏸ pause' : '▷ play';
        last = performance.now();
      });
      reset.addEventListener('click', () => {
        running = false;
        toggle.textContent = '▷ play';
        t = 0;
        queue = [];
        serving = null;
        nextArrival = -Math.log(Math.random()) / ARRIVAL_RATE;
      });
    })();
  </script>
</figure>
```

## Adjustable axes

1. **Adjust the model** — replace `ARRIVAL_RATE` and `SERVICE_RATE`
   with sliders so the reader can probe the M/M/1 cliff.
2. **Add multiple servers** — extend `serving` to an array of size c.
3. **Plot queue length history** — keep a ring buffer of (t, depth)
   points; draw as a polyline beneath the queue boxes.
4. **Switch to a different model** — TCP CW (slow-start), particle
   simulation, leader election state machine.
5. **Add a "step" button** — pause + advance one event for inspection.

## Common variations for different domains

- **Systems**: cache eviction (LRU vs LFU on a trace)
- **Infra**: load balancer (round-robin vs least-conn under burst)
- **Web**: connection pool exhaustion
- **AI**: SGD step (loss landscape descent)
- **Backend**: 2-phase commit timing diagram

## Anti-patterns specific to this template

- **No reset button** — reader can't restart from t=0.
- **No pause button** — reader can't inspect a frame.
- **Wall time not shown** — reader has no sense of progress / rate.
- **Speed mismatch** — too fast to follow (lower the rate parameters)
  or too slow to be interesting (raise them). Aim for ~5-20s loop.
- **Hardcoded random seed pretending to be deterministic** — pick
  random or deterministic explicitly; don't fake one as the other.
