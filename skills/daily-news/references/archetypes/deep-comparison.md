# Archetype: deep-comparison

Two or more options laid side by side to help the reader choose.

## When to pick comparison

Pick when the topic is a selection / migration / shootout:

- A vs B selection (Redis vs DragonFly, Postgres vs ClickHouse for X)
- Version-N vs version-M migration ("should I upgrade to Postgres 17?")
- Library shootouts (which gRPC implementation, which HTTP client)
- Tooling decisions (which CI? which container runtime?)

Distinguish from technical-deep-dive: deep-dive explains ONE thing.
Comparison weighs MULTIPLE things and reaches a recommendation.

## Required structure

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — why this comparison matters
  *now* (a deadline, a deprecation, a release that changes the
  calculation)}}</p>
  <h1 class="vg-post-title">{{TITLE — typically contains "vs" or
  "之間如何選"}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro — name the options
  by full name, state the selection stakes}}</p>

  <!-- An at-a-glance comparison widget: HTML <table> or
       SVG with class "vg-w-comparison-*" — required (see below). -->

  <h2>dimension: {{DIMENSION_1_NAME}}</h2>
  <!-- e.g., "dimension: write throughput" or "dimension: developer
       ergonomics". How each option fares on this axis. -->

  <h2>dimension: {{DIMENSION_2_NAME}}</h2>

  <h2>dimension: {{DIMENSION_3_NAME}}</h2>
  <!-- 3 to 5 dimension sections required. -->

  <h2>how to choose</h2>
  <!-- The decision. "If your situation is X, pick A; if Y, pick B."
       Concrete enough that a reader can self-classify and walk away
       with the answer. -->

  <p class="vg-deep-closer"><strong>Take-away</strong>：{{one sentence —
  typically "for 80% of cases pick X; only in scenario Z does Y win"}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- ≥3 H2 elements matching `dimension: ...` (lowercase prefix, colon,
  space, then the dimension name)
- Exactly 1 H2 with text `how to choose`
- `how to choose` must be the last H2 before the closer
- Total H2 count: 4 to 6 (3-5 dimensions + 1 how-to-choose)
- ≥1 HTML `<table>` element OR ≥1 `<svg>` with a class matching
  `vg-w-comparison-*`
- Closer label is `Take-away`
- ≥2 inline `<svg>` widgets total (the comparison-shaped one counts)
- Universal contract from `deep-freeform.md`

## Recommended widgets

1. **At-a-glance comparison**: HTML `<table>` with rows for criteria
   and columns for options, OR SVG row-of-cells with checks/X marks.
2. **Per-dimension visualization**: in one of the dimension H2 sections,
   a chart that visualizes the gap (throughput bars, latency CDFs).

## Sidecar

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "comparison",
  "...": "..."
}
```
