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

## Shape (the arc, not the wording)

A four-to-five beat ladder. Each beat moves the reader one rung up.
Name each H2 *after the actual concept being taught* — generic names
make every explainer feel like the same post.

1. **Concrete case** — a scenario the reader already understands; the
   need behind the concept.
2. **The gap** — why existing tools / approaches don't solve the case
   well. (Optional: collapse into 1 if the gap is obvious.)
3. **The idea** — the new concept stated plainly; the smallest possible
   formulation.
4. **The worked example** — concrete code, real numbers, or a step-by-
   step. The reader sees the idea *actually do something*. Must
   materialise as `<pre><code>` or `<svg>` somewhere in the body —
   prose alone fails the test.
5. **Applicability** — where the idea earns its place; what it costs.

### Example H2 sets — pick names that name the topic

- io_uring explainer: `the workload that breaks epoll` / `why thread
  pools and async don't fix it` / `submission and completion rings` /
  `a 30-line example` / `where it pays off`
- CRDT explainer: `two laptops, no internet` / `last-write-wins eats
  edits` / `merge as commutative union` / `a counter you can split` /
  `what CRDTs can't fix`
- Zig std.Io explainer: `the 10K-request problem` / `threads vs async,
  the false choice` / `std.Io as a vtable` / `a worked echo server` /
  `where this lands`

## Required structure (universal contract)

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

  <h2>{{CONCRETE_CASE_NAMED_FOR_TOPIC}}</h2>
  <h2>{{GAP_NAMED_FOR_TOPIC}}</h2>
  <h2>{{IDEA_NAMED_FOR_TOPIC}}</h2>
  <h2>{{WORKED_EXAMPLE_NAMED_FOR_TOPIC}}</h2>
  <!-- This section MUST contain <pre><code> or <svg>. -->
  <h2>{{APPLICABILITY_NAMED_FOR_TOPIC}}</h2>

  <p class="vg-deep-closer"><strong>{{CLOSER_LABEL}}</strong>：{{one-line
  mental model — the sentence the reader keeps}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- 4-6 H2 elements (phrasing free)
- Body must contain `<pre><code>` or `<svg>` (the worked example must
  be concrete, not just prose)
- Universal contract (opener, closer with `<strong>`)
- ≥1 inline `<svg>` widget (≥2 recommended)
- Drop cap recommended

### Closer label

Free. For explainers, common shapes:

- `Take-away` — the mental model in one line
- `The model` — when the closer crystallises a way of seeing
- `Mental model`
- `Plain words` — when the post's value is the simplest possible
  rephrasing

## Recommended widgets

1. **Conceptual diagram**: visualises the new abstraction at its most
   distilled form. Boxes, arrows, labels in plain words.
2. **Before/after or worked example diagram**: shows the old approach
   next to the new approach, OR walks through one concrete instance
   step by step.

## Sidecar

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "explainer",
  "...": "..."
}
```
