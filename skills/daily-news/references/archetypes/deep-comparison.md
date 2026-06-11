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

## Shape (the arc, not the wording)

A comparison post does two things: walks 3-5 axes, then offers a
decision rule. Name each axis H2 *after what the axis actually measures*
— a `dimension: ` prefix is one valid phrasing among many.

1. (Optional opener context paragraph + an at-a-glance table or SVG.)
2. **Axis 1** — name it for what it measures in this comparison.
3. **Axis 2**
4. **Axis 3** — (3-5 axes total.)
5. **Decision** — the choice rule. "If your situation is X, pick A;
   otherwise B." Concrete enough that a reader can self-classify.

### Example H2 sets

- Postgres vs ClickHouse for analytics: `query latency at 1B rows` /
  `write-path overhead` / `operational maturity` / `ecosystem you
  inherit` / `pick by workload`
- gRPC implementations shootout: `wire performance` / `language
  ergonomics` / `interop and tooling` / `community velocity` / `the
  call`
- Postgres 16 → 17 migration: `query-planner gains` / `replication
  changes` / `extension breakage risk` / `should you upgrade?`

## Required structure (universal contract)

Hero block (see `archetypes.md § Hero contract` for full rules — opener
DOM-first but visually after h1; opener writes as a pull-quote, 1-2
sentences, self-contained):

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — 1-2 sentences: why this comparison
  matters *now* (a deadline, a deprecation, a release that changes the
  calculation)}}</p>
  <h1 class="vg-post-title">{{TITLE — typically contains "vs" or
  "之間如何選"}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro — name the options
  by full name, state the selection stakes}}</p>

  <!-- An at-a-glance comparison: HTML <table> or
       SVG with class "vg-w-comparison-*" — required. -->

  <h2>{{AXIS_1_NAMED_FOR_WHAT_IT_MEASURES}}</h2>
  <h2>{{AXIS_2_NAMED_FOR_WHAT_IT_MEASURES}}</h2>
  <h2>{{AXIS_3_NAMED_FOR_WHAT_IT_MEASURES}}</h2>
  <!-- 3-5 axis sections. -->

  <h2>{{DECISION_H2 — e.g. "how to choose" or "pick by workload" or
  "the call"}}</h2>

  <p class="vg-deep-closer"><strong>{{CLOSER_LABEL}}</strong>：{{one
  sentence — typically "for 80% of cases pick X; only in scenario Z
  does Y win"}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- 4-6 H2 elements (3-5 axes + decision)
- `<table>` OR `<svg class="vg-w-comparison-...">` somewhere in body
- Universal contract (opener, closer with `<strong>`)
- ≥1 inline `<svg>` (≥2 recommended; the comparison-shaped one counts)
- Drop cap recommended

### Closer label

Free. For comparisons, common shapes:

- `Take-away` — the rule in one line
- `The call` — when the post is structured as a verdict
- `How to choose` — when the answer is conditional
- `Recommendation`

## Recommended widgets

1. **At-a-glance comparison**: HTML `<table>` with rows for criteria
   and columns for options, OR SVG row-of-cells with checks/X marks.
2. **Per-axis visualization**: in one of the axis H2 sections, a chart
   that visualizes the gap (throughput bars, latency CDFs).

## Sidecar

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "comparison",
  "...": "..."
}
```

## Engagement

Register: verdict tension without clickbait. State the criteria and
the contenders early — what you hold back is the per-axis outcome,
never the existence of an answer.

- Hook patterns: the choice the reader is actually facing this
  quarter; the default everyone picks for the wrong reason.
- Tension sources: axes that disagree (A wins on latency, B on
  operability); the scoreboard moment where the reader's guess gets
  corrected.
- Pacing: axis-by-axis cadence with numbers per axis; one clear
  pick at the end with its applicability boundary (per the closer).
