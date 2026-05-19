# Tier 2 — Timeline Scrubber

> Horizontal time axis with a draggable handle; the figure updates to
> show the state at the scrub position.

## When to use

- Walk a reader through a sequence of events with precise control
- Inspect "state at time T" for any T
- Annotated incident timeline with hover detail

## Complete snippet (paste-and-tweak)

```html
<figure class="vg-w-scrub-EXAMPLE">
  <style>
    .vg-w-scrub-EXAMPLE { display: grid; gap: var(--s-2); }
    .vg-w-scrub-EXAMPLE svg { width: 100%; height: auto; }
    .vg-w-scrub-EXAMPLE .state { font-family: var(--serif); font-size: var(--fs-sm); padding: var(--s-2); background: var(--bg-soft); border-left: 2px solid var(--accent); }
  </style>

  <svg viewBox="0 0 720 80">
    <line x1="40" y1="40" x2="680" y2="40" stroke="var(--muted-2)" stroke-width="1.5" />
    <!-- Event markers -->
    <g id="vg-w-scrub-EXAMPLE-events"></g>
    <!-- Scrub handle -->
    <line id="vg-w-scrub-EXAMPLE-handle-line" x1="40" y1="20" x2="40" y2="60" stroke="var(--accent)" stroke-width="2" />
    <circle id="vg-w-scrub-EXAMPLE-handle" cx="40" cy="40" r="8" fill="var(--accent)" cursor="grab" />
    <text id="vg-w-scrub-EXAMPLE-clock" x="40" y="14" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11" fill="var(--ink)">t=0:00</text>
  </svg>

  <div class="state" id="vg-w-scrub-EXAMPLE-state">scrub to inspect state at each moment</div>

  <script>
    (function () {
      const root = document.querySelector('.vg-w-scrub-EXAMPLE');
      const svg = root.querySelector('svg');
      const handle = root.querySelector('#vg-w-scrub-EXAMPLE-handle');
      const handleLine = root.querySelector('#vg-w-scrub-EXAMPLE-handle-line');
      const clock = root.querySelector('#vg-w-scrub-EXAMPLE-clock');
      const stateDiv = root.querySelector('#vg-w-scrub-EXAMPLE-state');
      const eventsG = root.querySelector('#vg-w-scrub-EXAMPLE-events');

      // Event timeline: [t in seconds, label, state description]
      const events = [
        [0,   'start',    'system idle, all queues empty'],
        [60,  'spike',    'request rate triples'],
        [120, 'queue',    'queue depth at 80% capacity'],
        [180, 'reject',   'first 503 returned; queue saturated'],
        [240, 'autoscale','new replica online, queue draining'],
        [300, 'recovered','queue depth back below 10%'],
      ];
      const T_MAX = 300;
      const X0 = 40, X1 = 680;
      const xOf = t => X0 + (t / T_MAX) * (X1 - X0);

      // Place event markers
      for (const [t, label] of events) {
        const NS = 'http://www.w3.org/2000/svg';
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', xOf(t)); c.setAttribute('cy', 40); c.setAttribute('r', 4);
        c.setAttribute('fill', 'var(--muted)');
        eventsG.appendChild(c);
        const tx = document.createElementNS(NS, 'text');
        tx.setAttribute('x', xOf(t)); tx.setAttribute('y', 70);
        tx.setAttribute('text-anchor', 'middle');
        tx.setAttribute('font-family', 'Manrope, sans-serif');
        tx.setAttribute('font-size', 10);
        tx.setAttribute('fill', 'var(--muted)');
        tx.textContent = label;
        eventsG.appendChild(tx);
      }

      function clamp(x) { return Math.max(X0, Math.min(X1, x)); }
      function clientToSvgX(clientX) {
        const pt = svg.createSVGPoint();
        pt.x = clientX; pt.y = 0;
        const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
        return clamp(svgPt.x);
      }
      function fmtTime(t) {
        const m = Math.floor(t / 60), s = Math.floor(t % 60);
        return `t=${m}:${String(s).padStart(2, '0')}`;
      }
      function update(x) {
        handle.setAttribute('cx', x);
        handleLine.setAttribute('x1', x); handleLine.setAttribute('x2', x);
        clock.setAttribute('x', x);
        const t = ((x - X0) / (X1 - X0)) * T_MAX;
        clock.textContent = fmtTime(t);
        // find the latest event whose time <= t
        let active = events[0];
        for (const e of events) if (e[0] <= t) active = e;
        stateDiv.textContent = active[2];
      }

      let dragging = false;
      handle.addEventListener('pointerdown', (e) => {
        dragging = true;
        handle.setPointerCapture(e.pointerId);
      });
      handle.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        update(clientToSvgX(e.clientX));
      });
      handle.addEventListener('pointerup', () => { dragging = false; });

      update(X0);
    })();
  </script>
</figure>
```

## Gotchas

- **Discrete events on a continuous axis**: the scrubber is
  continuous but events are at discrete times — find the latest event
  ≤ t and display its state.
- **Click anywhere on the line to jump**: extend the `pointerdown`
  listener to the entire `<svg>` not just the handle.
- **Mobile tap target**: handle radius ≥ 8 in viewBox; if viewBox is
  pixel-equivalent at mobile width, that's ≥ 16px tap area (still
  small; increase to 12 for safety).
- **Event labels overlapping**: at low timeline width, labels collide.
  Stagger label `y` positions or omit labels for adjacent events.
