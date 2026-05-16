# Archetype: deep-investigation

A "why is this happening?" inquiry. A counter-intuitive observation
drives the story; hypotheses get falsified one by one until the truth
emerges.

## When to pick investigation

Pick when the news is a puzzle being solved:

- Bug hunts (someone found a weird crash, narrowed it down, found root cause)
- Surprising performance regressions (added cache → got slower; why?)
- Benchmarks that contradict expectation
- Metrics anomalies (sudden 10x traffic, not from any campaign — where from?)

Distinguish from narrative: narrative tells the timeline of what
happened externally. Investigation tells the *inquiry's* internal
structure — what we thought, what we tried, what was wrong, what was
right.

## Required structure

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — the counter-intuitive observation
  itself, stated as the puzzle}}</p>
  <h1 class="vg-post-title">{{TITLE}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro — set up the
  puzzle, hint that "we thought X, it turned out not to be X"}}</p>

  <h2>observation</h2>
  <!-- Describe the puzzle precisely. Widget #1: metrics chart showing
       the surprising thing. -->

  <h2>hypothesis: {{HYPOTHESIS_1_SHORT_NAME}}</h2>
  <!-- What we suspected and why. How we tested it. Why it turned out
       wrong (or partially right). -->

  <h2>hypothesis: {{HYPOTHESIS_2_SHORT_NAME}}</h2>
  <!-- (1 to 3 hypothesis sections total. At least 1 required.) -->

  <h2>the truth</h2>
  <!-- The real root cause. Why it's plausible. Why the wrong
       hypotheses pointed elsewhere. Widget #2: flame graph,
       call stack, or sequence diagram revealing the cause. -->

  <p class="vg-deep-closer"><strong>Take-away</strong>：{{one sentence
  methodology lesson — "next time you see X, look at Y first"}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- H2 sequence: `observation` first, `the truth` last, with one or more
  H2 elements starting with `hypothesis: ` between them
- All H2 text in lowercase English; `hypothesis: ` H2s use the literal
  prefix `hypothesis: ` (lowercase, colon, space) followed by a short
  name
- 1 to 3 `hypothesis: ...` sections
- Closer label is `Take-away`
- ≥2 inline `<svg>` widgets
- Universal contract from `deep-freeform.md`

## Recommended widgets

1. **Metrics chart**: show the anomaly visually. ViewBox commonly
   `0 0 480 160` or `0 0 600 200`. Y-axis for the metric, X-axis for
   time / config / parameter. Mark the surprising point.
2. **Flame graph or call sequence**: reveal the truth. Boxes for
   functions, dashed arrows for the unexpected path.

## Sidecar

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "investigation",
  "...": "..."
}
```
