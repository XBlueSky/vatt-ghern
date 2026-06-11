# Archetype: deep-technical-deep-dive

Structural exposition of a new design, algorithm, or protocol. Not
time-ordered. Reader emerges knowing how the thing is composed.

## When to pick technical-deep-dive

Pick when the topic is a *thing* whose internal structure rewards
explanation:

- New Postgres planner internals
- QUIC mechanics, congestion control variant
- New SIMD extension on a CPU
- New ML inference architecture (dual-path KV cache, etc.)
- Novel consensus algorithm
- A library's design philosophy

Distinguish from narrative: narrative says "first X happened, then Y";
technical-deep-dive says "this system has components A, B, C, and they
relate this way." The post does not move through time — it moves
through structure.

## Shape (the arc, not the wording)

Walk through the components, then close with what the assembled whole
unlocks. Name each H2 *after the actual component or concept*.

1. **Component 1** — free-named after the real thing.
2. **Component 2**
3. **Component 3** — (3-5 component sections total.)

### Example H2 sets

- Postgres 17 planner: `the new merge-append path` / `parallel-safe
  function whitelist` / `cost-model recalibration`
- QUIC v2 congestion: `the receive window state machine` / `BBR2
  bandwidth probe` / `loss-recovery interplay`
- CPU SIMD ext: `the new register file` / `predicate masks` /
  `permitted operand widths` / `interaction with existing AVX-512`

## Required structure (universal contract)

Hero block (see `archetypes.md § Hero contract` for full rules — opener
DOM-first but visually after h1; opener writes as a pull-quote, 1-2
sentences, self-contained):

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — 1-2 sentences: a counter-intuitive
  design choice, a clever trick, a constraint that drove the design}}</p>
  <h1 class="vg-post-title">{{TITLE}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro — one sentence on
  what this thing is and what problem it solves}}</p>

  <h2>{{COMPONENT_1_NAME}}</h2>
  <h2>{{COMPONENT_2_NAME}}</h2>
  <h2>{{COMPONENT_3_NAME}}</h2>
  <!-- 3-6 component sections total. -->

  <p class="vg-deep-closer"><strong>{{CLOSER_LABEL}}</strong>：{{one
  sentence on the new capability the components together unlock}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- 3-6 H2 elements
- Universal contract (opener, closer with `<strong>`)
- ≥1 inline `<svg>` (≥2 recommended)
- Drop cap recommended

### Closer label

Free. For deep-dives, common shapes (emphasis is on capability, not
methodology):

- `What this enables` — the canonical choice
- `What you can build` — when the closer points at applications
- `Why it matters` — used sparingly (this phrase belongs more to
  narrative; only pick when the closer truly steps back to context)
- `The unlock`

## Recommended widgets

1. **Architecture diagram**: show the components and their connections.
   ViewBox `0 0 720 280` or `0 0 880 360`. Boxes for components, lines
   for data flow.
2. **Data viz**: a measurement that proves the design works — throughput,
   memory profile, latency distribution. Real numbers from the source.

## Sidecar

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "technical-deep-dive",
  "...": "..."
}
```

## Engagement

Register: cool. The mechanism's elegance carries the post — your job
is to stage it, not to cheer for it. The reader's pull is "how can
that possibly work?", answered layer by layer.

- Hook patterns: the impossible number (a result that sounds wrong
  until the mechanism explains it); the constraint that should make
  the design infeasible.
- Tension sources: the gap between the headline result and the
  reader's mental cost model; each layer of the descent resolving one
  piece and exposing the next.
- Pacing: alternate dense mechanism paragraphs with one-line
  landings. Numbers do the emotional work; adjectives do not.
