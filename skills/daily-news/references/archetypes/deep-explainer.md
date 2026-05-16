# Archetype: deep-explainer

Explains a concept from zero. Does NOT assume the reader knows the
prerequisites.

## When to pick explainer

Pick when the news triggers "what is X" — that is, the news depends on
a concept readers may not yet have:

- "What is CRDT" (because some new database uses CRDTs)
- "What is io_uring" (because some new performance trick relies on it)
- "Zero-knowledge proofs in plain words" (because some new protocol uses ZK)
- "SIMD, intuitively" (because some new compiler optimization vectorizes)
- New paradigm or technique becoming mainstream

Distinguish from technical-deep-dive: deep-dive assumes the reader
knows the surrounding concepts and explores ONE specific implementation
of an established idea. Explainer assumes the reader knows little and
walks them up the abstraction ladder.

## Required structure

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — "if you don't know X, you probably
  think it's Y" or "imagine the situation where..."}}</p>
  <h1 class="vg-post-title">{{TITLE — typically "what is X" or
  "X, in plain words"}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro — one sentence on
  what the reader will know after reading}}</p>

  <h2>start with a concrete case</h2>
  <!-- A scenario the reader already understands. No new concepts yet. -->

  <h2>where today's tools fall short</h2>
  <!-- Show why existing approaches fail to solve the scenario well. -->

  <h2>the core idea</h2>
  <!-- The new concept stated plainly. Widget #1: conceptual diagram. -->

  <h2>what it actually looks like</h2>
  <!-- Concrete example: simplified code or a worked example.
       Widget #2: before/after or worked-example diagram. -->

  <h2>when you'd reach for it</h2>
  <!-- Real situations where the concept earns its place. Limits and
       trade-offs. -->

  <p class="vg-deep-closer"><strong>Take-away</strong>：{{one-line
  mental model — the sentence the reader keeps}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- Exactly 5 H2 elements in the body
- H2 text matches exactly, in this exact order:
  1. `start with a concrete case`
  2. `where today's tools fall short`
  3. `the core idea`
  4. `what it actually looks like`
  5. `when you'd reach for it`
- The `what it actually looks like` section must contain a
  `<pre><code>...</code></pre>` OR an inline `<svg>` (a worked
  example must be concrete, not just prose)
- Closer label is `Take-away`
- ≥2 inline `<svg>` widgets
- Universal contract from `deep-freeform.md`

## Recommended widgets

1. **Conceptual diagram**: in `the core idea`. Visualizes the new
   abstraction at its most distilled form. Boxes, arrows, labels in
   plain words.
2. **Before/after or worked example**: in `what it actually looks like`.
   Shows the old approach next to the new approach, OR walks through
   one concrete instance step by step.

## Sidecar

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "explainer",
  "...": "..."
}
```
