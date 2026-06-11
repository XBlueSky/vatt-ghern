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

## Shape (the arc, not the wording)

1. **The puzzle** — the counter-intuitive observation itself, stated
   precisely enough for the reader to feel the wrongness.
2. **Candidate 1** — what we suspected and why. How we tested it. Why
   it turned out wrong (or partially right).
3. **Candidate 2** — (1-3 candidates total.)
4. **Resolution** — the real root cause. Why it's plausible. Why the
   wrong candidates pointed elsewhere.

Name H2s for the *actual hypotheses and observations*, not the generic
labels `observation` / `hypothesis: ...` / `the truth`. A reader
should know from H2 alone what the puzzle is and what each candidate
proposed.

### Example H2 sets

- Cache-then-slower regression: `the 30% slowdown after we added the
  cache` / `theory: cache miss path is expensive` / `theory: lock
  contention on cache eviction` / `the cause: per-request allocations
  on the hit path`
- 10x traffic spike no one launched: `traffic doubled overnight, no
  campaign ran` / `theory: bot scrape` / `theory: leaked share-link` /
  `theory: client retry storm` / `the cause: a Slack share preview
  unfurled for 200k users`

## Required structure (universal contract)

Hero block (see `archetypes.md § Hero contract` for full rules — opener
DOM-first but visually after h1; opener writes as a pull-quote, 1-2
sentences, self-contained):

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — 1-2 sentences: the counter-intuitive
  observation itself, stated as the puzzle}}</p>
  <h1 class="vg-post-title">{{TITLE}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro — set up the
  puzzle, hint that "we thought X, it turned out not to be X"}}</p>

  <h2>{{PUZZLE_NAMED_FOR_TOPIC}}</h2>
  <!-- Widget #1 often goes here: metrics chart showing the surprise. -->

  <h2>{{CANDIDATE_1_NAMED_FOR_TOPIC}}</h2>
  <h2>{{CANDIDATE_2_NAMED_FOR_TOPIC}}</h2>
  <!-- 1-3 candidate sections. -->

  <h2>{{RESOLUTION_NAMED_FOR_TOPIC}}</h2>
  <!-- Widget #2 often goes here: flame graph, call stack, or sequence
       revealing the cause. -->

  <p class="vg-deep-closer"><strong>{{CLOSER_LABEL}}</strong>：{{one
  sentence methodology lesson — "next time you see X, look at Y first"}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- 3-6 H2 elements (puzzle + 1-3 candidates + resolution)
- Universal contract (opener, closer with `<strong>`)
- ≥1 inline `<svg>` (≥2 recommended)
- Drop cap recommended

### Closer label

Free. For investigations, common shapes:

- `Take-away` — the methodology lesson
- `The lesson` — emphasises craft
- `Next time` — when the post is about what to check first
- `What we missed`

## Recommended widgets

1. **Metrics chart**: show the anomaly visually. ViewBox commonly
   `0 0 720 240` or `0 0 880 280`. Y-axis for the metric, X-axis for
   time / config / parameter. Mark the surprising point. See
   `widget-isolation.md § 5` for breakout sizing.
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

## Engagement

Register: suspense. The post is a hypothesis elimination — open
questions pull the reader forward, so do not answer up-front what the
structure is designed to converge on.

- Hook patterns: the symptom that contradicts intuition; two facts
  that cannot both be true.
- Tension sources: each ruled-out hypothesis narrows the space; the
  cost of the wrong answer; partial evidence pointing two ways.
- Pacing: end sections on the next open question. The convergence
  section is the payoff — spend the word budget there, not on the
  setup.
