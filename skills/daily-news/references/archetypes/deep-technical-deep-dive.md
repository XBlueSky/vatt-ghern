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

## Required structure

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — a counter-intuitive design choice,
  a clever trick, a constraint that drove the design}}</p>
  <h1 class="vg-post-title">{{TITLE}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro — one sentence on
  what this thing is and what problem it solves}}</p>

  <h2>{{COMPONENT_1_NAME}}</h2>
  <!-- First component / concept. Free-named after the actual thing. -->

  <h2>{{COMPONENT_2_NAME}}</h2>
  <!-- Second component. -->

  <h2>{{COMPONENT_3_NAME}}</h2>
  <!-- Third. (3-5 component sections total.) -->

  <p class="vg-deep-closer"><strong>What this enables</strong>：{{one
  sentence on the new capability the components together unlock}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- 3 to 5 H2 elements in the body
- H2 text is free-named (use the actual component / concept name in
  English). **Banned H2 names**: `what happened`, `why it matters`,
  `so what`, `observation`, `the truth`, `how to choose`, `the core
  idea` — these belong to other archetypes.
- Closer label is `What this enables` (not `Take-away` — the
  emphasis is on capability, not conclusion)
- ≥2 inline `<svg>` widgets
- Universal contract from `deep-freeform.md`

## Recommended widgets

1. **Architecture diagram**: show the components and their connections.
   ViewBox `0 0 480 200` or `0 0 720 240`. Boxes for components, lines
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
