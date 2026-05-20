# Tier 1 — Scroll-Driven Explanation

> Hero template for posts that walk through a multi-stage process where
> each stage builds on the previous.

## When to pick this template

Pick when the post explains a process that has clearly delineated stages
and the natural reading order is "stage 1 → stage 2 → stage 3", with
the reader benefiting from seeing the *state at each stage* alongside
the prose.

Examples:
- CVE attack chain (initial access → privilege escalation → exfiltration)
- DNS resolution flow (root → TLD → authoritative → cache)
- QUIC handshake (ClientHello → ServerHello → 0-RTT data)
- Bazel build graph traversal (sources → genrules → outputs)

## Conceptual question it answers

"At each stage of this process, what is the state, and how does the
state change?"

## Complete working HTML + JS (paste-and-modify)

```html
<figure class="vg-w-scroll-EXAMPLE">
  <style>
    .vg-w-scroll-EXAMPLE { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-3); align-items: start; }
    .vg-w-scroll-EXAMPLE .stages { display: flex; flex-direction: column; gap: var(--s-3); }
    .vg-w-scroll-EXAMPLE .stage { padding: var(--s-2); border-left: 2px solid var(--muted-2); transition: border-color 200ms; }
    .vg-w-scroll-EXAMPLE .stage.active { border-color: var(--accent); }
    .vg-w-scroll-EXAMPLE .stage h3 { margin: 0 0 var(--s-1) 0; font-family: var(--sans); font-size: var(--fs-sm); text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink); }
    .vg-w-scroll-EXAMPLE .stage p { margin: 0; font-family: var(--serif); font-size: var(--fs-sm); }
    .vg-w-scroll-EXAMPLE .figure-sticky { position: sticky; top: var(--s-4); }
    .vg-w-scroll-EXAMPLE svg { width: 100%; height: auto; }
    @media (max-width: 720px) {
      .vg-w-scroll-EXAMPLE { grid-template-columns: 1fr; }
      .vg-w-scroll-EXAMPLE .figure-sticky { position: static; }
    }
  </style>

  <div class="stages">
    <section class="stage" data-stage="1">
      <h3>Stage 1 · TITLE</h3>
      <p>2-3 sentence description of what happens at this stage.</p>
    </section>
    <section class="stage" data-stage="2">
      <h3>Stage 2 · TITLE</h3>
      <p>2-3 sentence description.</p>
    </section>
    <section class="stage" data-stage="3">
      <h3>Stage 3 · TITLE</h3>
      <p>2-3 sentence description.</p>
    </section>
    <section class="stage" data-stage="4">
      <h3>Stage 4 · TITLE</h3>
      <p>2-3 sentence description.</p>
    </section>
  </div>

  <div class="figure-sticky">
    <svg viewBox="0 0 400 400">
      <!-- four overlapping diagrams; only the active stage is shown -->
      <g id="vg-w-scroll-EXAMPLE-stage-1">
        <rect x="50" y="50" width="100" height="60" fill="none" stroke="var(--ink)" stroke-width="1.5" />
        <text x="100" y="85" text-anchor="middle" font-family="EB Garamond, serif" font-size="14" fill="var(--ink)">init state</text>
      </g>
      <g id="vg-w-scroll-EXAMPLE-stage-2" style="opacity:0">
        <rect x="50" y="50" width="100" height="60" fill="var(--accent)" fill-opacity="0.15" stroke="var(--accent)" stroke-width="1.5" />
        <rect x="250" y="50" width="100" height="60" fill="none" stroke="var(--ink)" stroke-width="1.5" />
        <line x1="150" y1="80" x2="250" y2="80" stroke="var(--accent)" stroke-width="2" marker-end="url(#vg-w-scroll-EXAMPLE-arrow)" />
      </g>
      <g id="vg-w-scroll-EXAMPLE-stage-3" style="opacity:0">
        <!-- … -->
      </g>
      <g id="vg-w-scroll-EXAMPLE-stage-4" style="opacity:0">
        <!-- … -->
      </g>
      <defs>
        <marker id="vg-w-scroll-EXAMPLE-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" />
        </marker>
      </defs>
    </svg>
  </div>

  <script>
    (function () {
      const root = document.querySelector('.vg-w-scroll-EXAMPLE');
      const stages = root.querySelectorAll('.stage');
      const groups = {
        1: root.querySelector('#vg-w-scroll-EXAMPLE-stage-1'),
        2: root.querySelector('#vg-w-scroll-EXAMPLE-stage-2'),
        3: root.querySelector('#vg-w-scroll-EXAMPLE-stage-3'),
        4: root.querySelector('#vg-w-scroll-EXAMPLE-stage-4'),
      };

      function show(stage) {
        for (const s of stages) s.classList.toggle('active', s.dataset.stage === String(stage));
        for (const k of Object.keys(groups)) groups[k].style.opacity = String(k === String(stage) ? 1 : 0);
      }

      // rootMargin scales with viewport: phone (≤720px) needs narrower margin
      // because the shorter viewport otherwise leaves no stage active mid-scroll.
      // See tier-3-principles §12.1.E.
      const isMobile = window.matchMedia('(max-width: 720px)').matches;
      const rootMargin = isMobile ? '-25% 0px -25% 0px' : '-40% 0px -40% 0px';
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) show(e.target.dataset.stage);
        }
      }, { rootMargin, threshold: 0 });

      for (const s of stages) io.observe(s);
      show(1);
    })();
  </script>
</figure>
```

## Adjustable axes

1. **More stages** — duplicate the `<section class="stage">` and the
   `<g id="vg-w-scroll-EXAMPLE-stage-N">`. Update the `groups` map in JS.
2. **Single SVG with cumulative state** — instead of swapping `opacity`,
   add elements to a single growing diagram. The `show()` function
   reveals each successive element.
3. **Replace `IntersectionObserver` with pure CSS scroll timeline** —
   use `animation-timeline: scroll(--y root)` with named ranges per
   stage. Browser support is the trade-off (see Tier 2 snippet
   `css-scroll-timeline.md`).
4. **Add a stage indicator** — a vertical progress bar on the left
   that tracks which stage is active.

## Common variations for different domains

- **Systems**: kernel boot stages, NUMA-aware allocation phases
- **Infra**: TLS handshake states, DNS query path
- **Web**: HTTP/3 connection migration, paint timing milestones
- **AI**: training loop phases (forward → loss → backward → update)
- **Backend**: 2PC stages, saga rollback

## Anti-patterns specific to this template

- **Stages with no spatial change** — if every stage shows the same
  diagram with different labels, scroll-driven adds no value. Either
  introduce spatial change or switch to a static labelled figure.
- **Sticky figure clipping below the fold** — verify the sticky figure
  fits in viewport height (≤ 60vh recommended).
- **Stage descriptions duplicating prose** — the stage text in the
  widget should *complement* the surrounding prose, not repeat it.
