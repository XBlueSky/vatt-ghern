# Tier 1 — Annotated Diagram Walkthrough

> Hero template for posts that explain a multi-component architecture
> by inviting the reader to inspect each component's responsibility.

## When to pick this template

Pick when the post's central content is *how parts compose*, and the
reader benefits from selecting a component to read its detailed role.

Examples:
- Distributed system architecture (router, queue, worker, store)
- Compiler pipeline (lexer → parser → typecheck → codegen)
- Protocol stack (L4 → L3 → L2 → L1, or QUIC layers)
- Storage hierarchy (L1 → L2 → DRAM → NVMe → tape)

## Conceptual question it answers

"Which component owns each responsibility, and what does each one
*not* know about the others?"

## ⚠️ Important: HTML `<label>` does NOT work inside `<svg>`

A naïve attempt is to wrap SVG `<rect>` elements in HTML `<label
for="…">` so radio inputs drive selection without any JS. **This does
not render**: the SVG namespace doesn't recognise HTML `<label>`, so
the wrapped `<rect>` becomes an orphan with `getBoundingClientRect()`
zero — the box is silently invisible. CSS resolves, the DOM exists,
but nothing is painted. See `anti-examples.md § A4`.

The template below uses radio `<input>` for state, CSS `:has()` for
highlight + detail-panel show/hide, and a small JS handler to toggle
the right radio when the reader clicks a `<rect>`. JS does only one
thing (set `radio.checked = true`); CSS does the rest.

## Complete working HTML + JS (paste-and-modify)

```html
<figure class="vg-w-annotated-EXAMPLE">
  <style>
    .vg-w-annotated-EXAMPLE { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-3); align-items: start; }
    .vg-w-annotated-EXAMPLE svg { width: 100%; height: auto; }
    .vg-w-annotated-EXAMPLE input[type="radio"] { position: absolute; opacity: 0; pointer-events: none; }
    .vg-w-annotated-EXAMPLE .component { fill: var(--bg-soft); stroke: var(--muted-2); stroke-width: 1.5; cursor: pointer; transition: fill 200ms, stroke 200ms; }
    .vg-w-annotated-EXAMPLE .component:hover { stroke: var(--accent); }
    .vg-w-annotated-EXAMPLE .component-text { pointer-events: none; }
    .vg-w-annotated-EXAMPLE .detail { padding: var(--s-2); border-left: 2px solid var(--accent); display: none; }
    .vg-w-annotated-EXAMPLE .detail h3 { margin: 0 0 var(--s-1) 0; font-family: var(--sans); font-size: var(--fs-sm); text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-text); }
    .vg-w-annotated-EXAMPLE .detail p { margin: 0 0 var(--s-1) 0; font-family: var(--serif); font-size: var(--fs-sm); }
    .vg-w-annotated-EXAMPLE:has(#vg-w-annotated-EXAMPLE-r1:checked) .component-1 { fill: var(--accent); fill-opacity: 0.2; stroke: var(--accent); }
    .vg-w-annotated-EXAMPLE:has(#vg-w-annotated-EXAMPLE-r2:checked) .component-2 { fill: var(--accent); fill-opacity: 0.2; stroke: var(--accent); }
    .vg-w-annotated-EXAMPLE:has(#vg-w-annotated-EXAMPLE-r3:checked) .component-3 { fill: var(--accent); fill-opacity: 0.2; stroke: var(--accent); }
    .vg-w-annotated-EXAMPLE:has(#vg-w-annotated-EXAMPLE-r1:checked) .detail-1 { display: block; }
    .vg-w-annotated-EXAMPLE:has(#vg-w-annotated-EXAMPLE-r2:checked) .detail-2 { display: block; }
    .vg-w-annotated-EXAMPLE:has(#vg-w-annotated-EXAMPLE-r3:checked) .detail-3 { display: block; }
    @media (max-width: 720px) {
      .vg-w-annotated-EXAMPLE { grid-template-columns: 1fr; }
    }
  </style>

  <input type="radio" id="vg-w-annotated-EXAMPLE-r1" name="vg-w-annotated-EXAMPLE-sel" checked />
  <input type="radio" id="vg-w-annotated-EXAMPLE-r2" name="vg-w-annotated-EXAMPLE-sel" />
  <input type="radio" id="vg-w-annotated-EXAMPLE-r3" name="vg-w-annotated-EXAMPLE-sel" />

  <svg viewBox="0 0 480 200">
    <!-- Component 1: Router -->
    <rect class="component component-1" data-target="vg-w-annotated-EXAMPLE-r1" role="button" tabindex="0" aria-label="select component 1" x="20" y="60" width="120" height="80" />
    <text class="component-text" x="80" y="105" text-anchor="middle" font-family="EB Garamond, serif" font-size="14" fill="var(--ink)">Router</text>

    <!-- Component 2: Worker -->
    <rect class="component component-2" data-target="vg-w-annotated-EXAMPLE-r2" role="button" tabindex="0" aria-label="select component 2" x="180" y="60" width="120" height="80" />
    <text class="component-text" x="240" y="105" text-anchor="middle" font-family="EB Garamond, serif" font-size="14" fill="var(--ink)">Worker</text>

    <!-- Component 3: Store -->
    <rect class="component component-3" data-target="vg-w-annotated-EXAMPLE-r3" role="button" tabindex="0" aria-label="select component 3" x="340" y="60" width="120" height="80" />
    <text class="component-text" x="400" y="105" text-anchor="middle" font-family="EB Garamond, serif" font-size="14" fill="var(--ink)">Store</text>

    <line x1="140" y1="100" x2="180" y2="100" stroke="currentColor" stroke-width="1.5" marker-end="url(#vg-w-annotated-EXAMPLE-arrow)" />
    <line x1="300" y1="100" x2="340" y2="100" stroke="currentColor" stroke-width="1.5" marker-end="url(#vg-w-annotated-EXAMPLE-arrow)" />
    <defs>
      <marker id="vg-w-annotated-EXAMPLE-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
      </marker>
    </defs>
  </svg>

  <div>
    <div class="detail detail-1">
      <h3>Router · responsibility</h3>
      <p>Validates the request envelope, picks a worker based on key
         hash, forwards. Does NOT inspect payload semantics.</p>
      <p><strong>Does not know</strong>: the schema of work items.</p>
    </div>
    <div class="detail detail-2">
      <h3>Worker · responsibility</h3>
      <p>Executes the work item against the payload schema. Returns
         result or error. Does NOT decide retry policy.</p>
      <p><strong>Does not know</strong>: which router selected it.</p>
    </div>
    <div class="detail detail-3">
      <h3>Store · responsibility</h3>
      <p>Persists the result keyed by request id. Provides idempotent
         writes. Does NOT enforce schema beyond bytes-in / bytes-out.</p>
      <p><strong>Does not know</strong>: the meaning of the bytes.</p>
    </div>
  </div>

  <script>
    (function () {
      const root = document.querySelector('.vg-w-annotated-EXAMPLE');
      root.querySelectorAll('.component').forEach((rect) => {
        rect.addEventListener('click', () => {
          const targetId = rect.getAttribute('data-target');
          const radio = root.querySelector('#' + targetId);
          if (radio) radio.checked = true;
        });
        // Keyboard a11y: rect has tabindex="0" + role="button"; Enter/Space triggers click
        rect.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            rect.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        });
      });
    })();
  </script>
</figure>
```

## Why this pattern is SVG-safe

- `<rect>` lives inside `<svg>` (no HTML `<label>` wrapping), so the
  SVG renderer paints it normally.
- `data-target="…"` attribute on the rect names the radio id it should
  activate.
- A 6-line IIFE wires `click` on each `.component` to set the
  corresponding `radio.checked = true`. No event delegation on
  `document`; no globals; scoped to widget root per
  `widget-isolation.md` Rule 3.
- CSS `:has(#vg-w-…-r2:checked)` still drives the highlight and the
  detail-panel visibility — the JS only flips one boolean.
- The `.component-text` rule sets `pointer-events: none` on the
  centered `<text>` so clicks on the label fall through to the rect
  underneath.
- Inputs are still in the DOM (`position: absolute; opacity: 0`) for
  screen readers, keyboard activation via Tab + Space, and the
  `:checked` CSS state.

## Adjustable axes

1. **More components** — duplicate the `<input>`, `<rect class="component component-N">`, `<text>`, and `<div class="detail detail-N">` set per component. Add the matching `:has(…-rN:checked)` CSS rules for `.component-N` and `.detail-N`.
2. **JS-driven selection if >6 states** — pure-CSS `:has()` selector list gets unwieldy past 5-6 components. Replace the radios entirely with a single `data-selected="N"` attribute on the root; toggle it from JS and switch all `:has(...)` rules to attribute selectors `[data-selected="N"]`.
3. **Add edges with annotations** — describe what flows on each edge (request format, response format, timeout, retry). Make edges also clickable if the flow is the interesting part.
4. **Highlight non-obvious dependencies** — when a component is selected, also dim the components it depends on transitively (add more `.component-N.dim-by-M` CSS rules).
5. **Keyboard accessibility** — radios already get keyboard focus. Add `:focus-visible` outline on `.component` for visible mouse-keyboard parity.

## Common variations for different domains

- **Backend**: microservice graph with bounded contexts
- **Systems**: kernel subsystem boundaries
- **Web**: browser process model (renderer / GPU / network)
- **AI**: transformer block (attention / FFN / residual / norm)
- **Infra**: K8s control plane (API server / etcd / scheduler / controller-manager)

## Anti-patterns specific to this template

- **`<label>` inside `<svg>`** — see warning at top of this file. Always use the `data-target` + JS click pattern shown above.
- **Generic labels** ("Component A", "Component B") — name the actual thing. If you can't name it, you don't know enough about the architecture to write the post.
- **Detail panel restating the diagram** — the detail should add responsibility, invariants, what-it-does-not-know — not just rename the box.
- **All components clickable but only one has detail** — either every component has a detail panel or remove the affordance.
- **Hover changes colour but click does nothing** — pick one affordance and honour it. If clicking is the action, the hover state should preview "I am clickable", not "I am decoration".
