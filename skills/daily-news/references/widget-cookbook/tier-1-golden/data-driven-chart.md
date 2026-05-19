# Tier 1 — Data-Driven Chart

> Hero template for posts that need to show real numerical data — not
> illustrative shapes. Axis ticks, labels, and curves are computed
> programmatically from the data, not hand-drawn.

## When to pick this template

Pick when the post makes a quantitative claim ("v25.11 is 3× faster on
p99") and the reader needs to see the *shape* of the supporting data:
distribution, regression, comparison across versions, etc.

Examples:
- P50/P99 across 6 versions
- Latency CDF before vs after fix
- Throughput-vs-concurrency curve
- Memory-over-time during workload

## Conceptual question it answers

"What is the actual shape of the data behind this claim, and where
are the tail observations?"

## Complete working HTML + JS (paste-and-modify)

```html
<figure class="vg-w-chart-EXAMPLE">
  <style>
    .vg-w-chart-EXAMPLE { display: grid; gap: var(--s-2); }
    .vg-w-chart-EXAMPLE svg { width: 100%; height: auto; }
    .vg-w-chart-EXAMPLE figcaption { font-family: var(--scribed); font-size: var(--fs-sm); color: var(--muted); }
  </style>

  <svg viewBox="0 0 720 320" preserveAspectRatio="xMidYMid meet">
    <g id="vg-w-chart-EXAMPLE-axes"></g>
    <g id="vg-w-chart-EXAMPLE-series"></g>
  </svg>

  <figcaption>p50 / p99 latency across 6 release versions. Data: <a href="https://example.com/benchmarks">benchmark suite</a>.</figcaption>

  <script>
    (function () {
      const root = document.querySelector('.vg-w-chart-EXAMPLE');
      const axesG = root.querySelector('#vg-w-chart-EXAMPLE-axes');
      const seriesG = root.querySelector('#vg-w-chart-EXAMPLE-series');

      // Real data — replace with your post's actual measurements.
      // Each entry: [version label, p50 ms, p99 ms]
      const data = [
        ['24.6', 12.4, 87.0],
        ['24.8', 11.9, 82.1],
        ['24.10', 11.5, 78.8],
        ['25.0', 11.2, 74.5],
        ['25.6', 10.9, 41.2],   // ← the regression
        ['25.11', 10.7, 23.4],
      ];

      // Plot box
      const X0 = 70, X1 = 690, Y0 = 280, Y1 = 30;

      // Y axis: 0 → ceil(max p99 / 10) * 10
      const maxY = Math.ceil(Math.max(...data.map(d => d[2])) / 10) * 10;
      const yOf = v => Y0 - (v / maxY) * (Y0 - Y1);

      // X axis: categorical (versions), evenly spaced
      const xOf = i => X0 + (i + 0.5) * (X1 - X0) / data.length;

      // Helper: SVG namespace
      const NS = 'http://www.w3.org/2000/svg';
      function el(tag, attrs) {
        const e = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
        return e;
      }

      // Axes
      axesG.appendChild(el('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, stroke: 'var(--muted-2)', 'stroke-width': 1 }));
      axesG.appendChild(el('line', { x1: X0, y1: Y0, x2: X0, y2: Y1, stroke: 'var(--muted-2)', 'stroke-width': 1 }));

      // Y ticks every ten units
      for (let v = 0; v <= maxY; v += 10) {
        const y = yOf(v);
        axesG.appendChild(el('line', { x1: X0 - 4, y1: y, x2: X0, y2: y, stroke: 'var(--muted-2)' }));
        const t = el('text', { x: X0 - 8, y: y + 4, 'text-anchor': 'end', 'font-family': 'Manrope, sans-serif', 'font-size': 11, fill: 'var(--muted)' });
        t.textContent = String(v);
        axesG.appendChild(t);
      }

      // X tick labels
      data.forEach((d, i) => {
        const t = el('text', { x: xOf(i), y: Y0 + 18, 'text-anchor': 'middle', 'font-family': 'Manrope, sans-serif', 'font-size': 11, fill: 'var(--muted)' });
        t.textContent = d[0];
        axesG.appendChild(t);
      });

      // Y axis label
      const yl = el('text', { x: 16, y: (Y0 + Y1) / 2, 'text-anchor': 'middle', 'font-family': 'EB Garamond, serif', 'font-size': 13, fill: 'var(--muted)', transform: `rotate(-90 16 ${(Y0 + Y1) / 2})` });
      yl.textContent = 'latency (ms)';
      axesG.appendChild(yl);

      // p50 series (line)
      const p50Path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i)} ${yOf(d[1])}`).join(' ');
      seriesG.appendChild(el('path', { d: p50Path, fill: 'none', stroke: 'var(--sage-deep)', 'stroke-width': 1.5 }));
      data.forEach((d, i) => seriesG.appendChild(el('circle', { cx: xOf(i), cy: yOf(d[1]), r: 3, fill: 'var(--sage-deep)' })));

      // p99 series (line, accent)
      const p99Path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i)} ${yOf(d[2])}`).join(' ');
      seriesG.appendChild(el('path', { d: p99Path, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 1.5 }));
      data.forEach((d, i) => seriesG.appendChild(el('circle', { cx: xOf(i), cy: yOf(d[2]), r: 3, fill: 'var(--accent)' })));

      // Legend
      const lg = el('g', { 'font-family': 'Manrope, sans-serif', 'font-size': 12 });
      lg.appendChild(el('rect', { x: 540, y: 40, width: 12, height: 2, fill: 'var(--sage-deep)' }));
      const l1 = el('text', { x: 560, y: 44, fill: 'var(--ink)' }); l1.textContent = 'p50'; lg.appendChild(l1);
      lg.appendChild(el('rect', { x: 540, y: 60, width: 12, height: 2, fill: 'var(--accent)' }));
      const l2 = el('text', { x: 560, y: 64, fill: 'var(--ink)' }); l2.textContent = 'p99'; lg.appendChild(l2);
      seriesG.appendChild(lg);
    })();
  </script>
</figure>
```

## Adjustable axes

1. **Replace `data` array** with the post's real measurements. Cite the
   source in the figcaption.
2. **Switch to log Y axis** when the data spans 3+ orders. Replace
   `yOf(v)` with `yOf(v) = Y0 - (Math.log10(v) / Math.log10(maxY)) * (Y0 - Y1)`
   and use log-spaced ticks.
3. **Switch to bar chart** — replace the `<path>` with `<rect>` per
   data point.
4. **Add CDF** — sort data ascending, plot index/N on X and value on Y.
5. **Highlight a specific point** — circle one observation with a
   larger ring and an annotation arrow.

## Common variations for different domains

- **AI**: training loss curves across hyperparam settings
- **Systems**: throughput vs concurrency curve
- **Infra**: tail latency CDF (linear-X, log-Y for the tail)
- **Web**: web vitals over a deployment window
- **Backend**: query plan cost comparison

## Anti-patterns specific to this template

- **Hardcoded data that "looks right"** — see Anti-Examples C1. If
  there is no real source, don't pretend.
- **Y axis not starting at 0 (for non-CDF charts)** without explicit
  note — visually exaggerates differences.
- **No units on Y axis label** — "latency" is not enough; "latency
  (ms)" is.
- **Same colour for multiple series** — colour-blind reader cannot
  distinguish; use shape (dashed line) or position as backup.
- **Lines passing through points with no markers** — readers cannot
  tell where the observations are.
