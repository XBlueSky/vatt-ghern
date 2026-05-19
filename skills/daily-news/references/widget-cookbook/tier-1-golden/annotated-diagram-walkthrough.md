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

## Complete working HTML + JS (paste-and-modify)

Pure-CSS implementation using `:has()` + radio buttons (no JS required):

```html
<figure class="vg-w-annotated-EXAMPLE">
  <style>
    .vg-w-annotated-EXAMPLE { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-3); align-items: start; }
    .vg-w-annotated-EXAMPLE svg { width: 100%; height: auto; }
    .vg-w-annotated-EXAMPLE input[type="radio"] { position: absolute; opacity: 0; pointer-events: none; }
    .vg-w-annotated-EXAMPLE label { cursor: pointer; }
    .vg-w-annotated-EXAMPLE .component { fill: var(--bg-soft); stroke: var(--muted-2); stroke-width: 1.5; transition: all 200ms; }
    .vg-w-annotated-EXAMPLE label:hover .component { stroke: var(--accent); }
    .vg-w-annotated-EXAMPLE .detail { padding: var(--s-2); border-left: 2px solid var(--accent); display: none; }
    .vg-w-annotated-EXAMPLE .detail h3 { margin: 0 0 var(--s-1) 0; font-family: var(--sans); font-size: var(--fs-sm); text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-text); }
    .vg-w-annotated-EXAMPLE .detail p { margin: 0 0 var(--s-1) 0; font-family: var(--serif); font-size: var(--fs-sm); }
    .vg-w-annotated-EXAMPLE:has(#vg-w-annotated-EXAMPLE-r1:checked) .component-1 { fill: var(--accent); fill-opacity: 0.2; stroke: var(--accent); }
    .vg-w-annotated-EXAMPLE:has(#vg-w-annotated-EXAMPLE-r2:checked) .component-2 { fill: var(--accent); fill-opacity: 0.2; stroke: var(--accent); }
    .vg-w-annotated-EXAMPLE:has(#vg-w-annotated-EXAMPLE-r3:checked) .component-3 { fill: var(--accent); fill-opacity: 0.2; stroke: var(--accent); }
    .vg-w-annotated-EXAMPLE:has(#vg-w-annotated-EXAMPLE-r1:checked) .detail-1 { display: block; }
    .vg-w-annotated-EXAMPLE:has(#vg-w-annotated-EXAMPLE-r2:checked) .detail-2 { display: block; }
    .vg-w-annotated-EXAMPLE:has(#vg-w-annotated-EXAMPLE-r3:checked) .detail-3 { display: block; }
  </style>

  <input type="radio" id="vg-w-annotated-EXAMPLE-r1" name="vg-w-annotated-EXAMPLE-sel" checked />
  <input type="radio" id="vg-w-annotated-EXAMPLE-r2" name="vg-w-annotated-EXAMPLE-sel" />
  <input type="radio" id="vg-w-annotated-EXAMPLE-r3" name="vg-w-annotated-EXAMPLE-sel" />

  <svg viewBox="0 0 480 200">
    <label for="vg-w-annotated-EXAMPLE-r1">
      <rect class="component component-1" x="20" y="60" width="120" height="80" />
      <text x="80" y="105" text-anchor="middle" font-family="EB Garamond, serif" font-size="14" fill="var(--ink)">Router</text>
    </label>
    <label for="vg-w-annotated-EXAMPLE-r2">
      <rect class="component component-2" x="180" y="60" width="120" height="80" />
      <text x="240" y="105" text-anchor="middle" font-family="EB Garamond, serif" font-size="14" fill="var(--ink)">Worker</text>
    </label>
    <label for="vg-w-annotated-EXAMPLE-r3">
      <rect class="component component-3" x="340" y="60" width="120" height="80" />
      <text x="400" y="105" text-anchor="middle" font-family="EB Garamond, serif" font-size="14" fill="var(--ink)">Store</text>
    </label>
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
</figure>
```

## Adjustable axes

1. **More components** — duplicate the `<input>` / `<rect>` / `<label>`
   / `<div class="detail">` set per component.
2. **Switch to JS-driven selection** — if you need more than ~6 states,
   the pure-CSS `:has()` selector list gets unwieldy. Use a minimal JS
   handler that toggles a single `data-selected="N"` attribute on the
   root.
3. **Add edges with annotations** — describe what flows on each edge
   (request format, response format, timeout, retry).
4. **Highlight non-obvious dependencies** — when a component is
   selected, also dim the components it depends on transitively.

## Common variations for different domains

- **Backend**: microservice graph with bounded contexts
- **Systems**: kernel subsystem boundaries
- **Web**: browser process model (renderer / GPU / network)
- **AI**: transformer block (attention / FFN / residual / norm)
- **Infra**: K8s control plane (API server / etcd / scheduler / controller-manager)

## Anti-patterns specific to this template

- **Generic labels** ("Component A", "Component B") — name the actual
  thing. If you can't name it, you don't know enough about the
  architecture to write the post.
- **Detail panel restating the diagram** — the detail should add
  responsibility, invariants, what-it-does-not-know — not just rename
  the box.
- **All components clickable but only one has detail** — either every
  component has a detail panel or remove the affordance.
