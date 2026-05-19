# Tier 1 — Interactive Parameter Demo

> Hero template for posts that answer "how sensitive is X to Y?" or
> "what happens at extreme values?".

## When to pick this template

Pick when the post's central insight is a relationship between two or
three variables, and the reader will internalise the relationship by
sweeping one variable and watching another respond.

Examples:
- **Algorithmic**: drag input size N, watch O(N log N) vs O(N²) diverge
- **Systems**: drag RTT, watch TCP throughput collapse under loss
- **Caching**: drag working-set size, watch L1 → L2 → DRAM cliff
- **CAP**: drag consistency level, watch p99 latency curve
- **Crypto**: drag key length, watch brute-force cost grow

## Conceptual question it answers

"How does Y respond when I change X?" — with bonus: "what's the
non-obvious shape of the response?" (linear, exponential, cliff,
plateau).

## Complete working HTML + JS (paste-and-modify)

```html
<figure class="vg-w-param-demo-EXAMPLE">
  <style>
    .vg-w-param-demo-EXAMPLE { display: grid; grid-template-rows: auto 1fr auto; gap: var(--s-2); }
    .vg-w-param-demo-EXAMPLE .controls { display: flex; align-items: center; gap: var(--s-2); font-family: var(--sans); font-size: var(--fs-sm); color: var(--muted); }
    .vg-w-param-demo-EXAMPLE .controls input { flex: 1; accent-color: var(--accent); }
    .vg-w-param-demo-EXAMPLE .readout { font-variant-numeric: tabular-nums; color: var(--ink); min-width: 8ch; text-align: right; }
    .vg-w-param-demo-EXAMPLE svg { width: 100%; height: auto; }
    .vg-w-param-demo-EXAMPLE figcaption { font-family: var(--scribed); font-size: var(--fs-sm); color: var(--muted); }
  </style>

  <div class="controls">
    <label for="vg-w-param-demo-EXAMPLE-x">N =</label>
    <input id="vg-w-param-demo-EXAMPLE-x" type="range" min="1" max="100" value="20" />
    <span class="readout" id="vg-w-param-demo-EXAMPLE-x-readout">20</span>
  </div>

  <svg viewBox="0 0 720 280" preserveAspectRatio="xMidYMid meet">
    <!-- axes -->
    <line x1="60" y1="240" x2="700" y2="240" stroke="var(--muted-2)" stroke-width="1" />
    <line x1="60" y1="20"  x2="60"  y2="240" stroke="var(--muted-2)" stroke-width="1" />
    <text x="380" y="270" text-anchor="middle" font-family="EB Garamond, serif" font-size="14" fill="var(--muted)">N (input size)</text>
    <text x="20"  y="130" text-anchor="middle" font-family="EB Garamond, serif" font-size="14" fill="var(--muted)" transform="rotate(-90 20 130)">cost (relative)</text>

    <!-- two curves: O(N log N) and O(N^2) -->
    <path id="vg-w-param-demo-EXAMPLE-curve-a" fill="none" stroke="var(--accent)" stroke-width="2" />
    <path id="vg-w-param-demo-EXAMPLE-curve-b" fill="none" stroke="var(--sage)"   stroke-width="2" />

    <!-- value markers at current N -->
    <circle id="vg-w-param-demo-EXAMPLE-dot-a" r="4" fill="var(--accent)" />
    <circle id="vg-w-param-demo-EXAMPLE-dot-b" r="4" fill="var(--sage)" />

    <!-- legend -->
    <g font-family="Manrope, sans-serif" font-size="12">
      <rect x="500" y="30" width="12" height="2" fill="var(--accent)" />
      <text x="520" y="34" fill="var(--ink)">O(N log N)</text>
      <rect x="500" y="50" width="12" height="2" fill="var(--sage)" />
      <text x="520" y="54" fill="var(--ink)">O(N²)</text>
    </g>
  </svg>

  <figcaption>Both curves are normalised so N=1 maps to cost=1. The cliff isn't in the formula; it's in your patience.</figcaption>

  <script>
    (function () {
      const root = document.querySelector('.vg-w-param-demo-EXAMPLE');
      const input = root.querySelector('input');
      const readout = root.querySelector('.readout');
      const pathA = root.querySelector('#vg-w-param-demo-EXAMPLE-curve-a');
      const pathB = root.querySelector('#vg-w-param-demo-EXAMPLE-curve-b');
      const dotA = root.querySelector('#vg-w-param-demo-EXAMPLE-dot-a');
      const dotB = root.querySelector('#vg-w-param-demo-EXAMPLE-dot-b');

      // viewBox: x ∈ [60, 700], y ∈ [240, 20] (inverted)
      const X0 = 60, X1 = 700, Y0 = 240, Y1 = 20;
      const N_MAX = 100;

      // Normalise so N=N_MAX, O(N²) maps to top of plot.
      const Y_MAX_A = N_MAX * Math.log2(N_MAX);
      const Y_MAX_B = N_MAX * N_MAX;

      function xOf(n) { return X0 + (n / N_MAX) * (X1 - X0); }
      function yOfA(n) { return Y0 - (n * Math.log2(Math.max(1, n)) / Y_MAX_A) * (Y0 - Y1); }
      function yOfB(n) { return Y0 - (n * n / Y_MAX_B) * (Y0 - Y1); }

      // Build paths once (they don't depend on the slider).
      const ptsA = [], ptsB = [];
      for (let n = 1; n <= N_MAX; n++) {
        ptsA.push(`${n === 1 ? 'M' : 'L'} ${xOf(n).toFixed(1)} ${yOfA(n).toFixed(1)}`);
        ptsB.push(`${n === 1 ? 'M' : 'L'} ${xOf(n).toFixed(1)} ${yOfB(n).toFixed(1)}`);
      }
      pathA.setAttribute('d', ptsA.join(' '));
      pathB.setAttribute('d', ptsB.join(' '));

      function update() {
        const n = Number(input.value);
        readout.textContent = String(n);
        dotA.setAttribute('cx', xOf(n)); dotA.setAttribute('cy', yOfA(n));
        dotB.setAttribute('cx', xOf(n)); dotB.setAttribute('cy', yOfB(n));
      }

      input.addEventListener('input', update);
      update();
    })();
  </script>
</figure>
```

## Adjustable axes

1. **Swap the functions** — replace `n*Math.log2(n)` and `n*n` with the
   curves your post is actually comparing. Latency vs concurrency,
   memory vs working-set, etc.
2. **Add a third curve** — duplicate the `path` + `circle` elements,
   pick another design token colour (`--ink-deep`).
3. **Switch the X axis to log scale** — replace `xOf(n)` with
   `xOf(n) = X0 + (Math.log2(n)/Math.log2(N_MAX)) * (X1-X0)`. Useful
   when the interesting behaviour spans 3+ orders of magnitude.
4. **Add multiple sliders** — duplicate the `controls` block with
   another `<input type="range">`. Useful for "RTT × loss rate"
   2-variable sweeps.
5. **Show readout in unit, not raw number** — change
   `readout.textContent = n` to a formatted string (`${n} ms`,
   `${(n*8).toFixed(1)} Mbps`).

## Common variations for different domains

- **AI**: drag temperature, watch logit distribution sharpness
- **Systems**: drag queue depth, watch tail latency
- **Infra**: drag replication factor, watch p99 read latency
- **Web**: drag connection count, watch HOL blocking
- **Backend**: drag pool size, watch contention probability

## Anti-patterns specific to this template

- **Slider whose movement only changes a number, not the chart shape.**
  The chart should visibly *redraw* as the slider moves; if it doesn't,
  delete the slider and use the static figure.
- **Hardcoded data points.** Use a real formula or real benchmark
  numbers. If you must use simulated data, say so in the figcaption.
- **Curve labelled "approximate"** without explaining what was
  approximated. Either source the real curve or admit the figure is
  illustrative.
