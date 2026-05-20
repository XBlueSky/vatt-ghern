# Content Quality Rubric — 7 axes

This file is the single source of truth for the content-quality gate in
Step 7.5 of the daily-news routine. The reviewer sub-agent reads this
file plus the post's archetype reference and scores each axis 0-10 with
a required justification citing specific HTML elements (H2 text, opener
quote, paragraph number).

## Score band semantics

- **9-10**: Excellent. No retry needed.
- **7-8**: PASS-with-notes. No retry, but logged.
- **4-6**: IMPORTANT. Retry up to 3 rounds.
- **0-3**: BLOCKING. Retry up to 5 rounds. If still blocking, drop post.

## Axis 1 — Hook strength

The `<p class="vg-deep-opener">` is what the reader sees first
(pull-quote treatment). Must stand alone.

- **9-10**: Specific scene, named number, real quote, or
  counter-intuitive observation. Independent of title. Self-contained
  (no back-reference like `因此` / `所以` / `之後`).
- **7-8**: Concrete but slightly generic; title overlap or one mild
  back-reference.
- **4-6**: Topic-summary opener ("this post is about CDC"); abstract
  framing; title largely paraphrased.
- **0-3**: Restates title verbatim; opens with back-reference; no
  specific material.

Justification must quote the opener verbatim.

## Axis 2 — Structural coherence (archetype-aware)

Reviewer reads
`skills/daily-news/references/archetypes/deep-<archetype>.md` to know
the standard for this post's archetype. Standards switch:

| Archetype | What measures | Good | Bad |
|---|---|---|---|
| `narrative` | Story arc: setup → 轉折 → 後果 | event → response → legacy | timeline without tension |
| `investigation` | Suspense: question → hypotheses → elimination → convergence | "why X?" → 3 hypotheses tested → 1 locked | answer up-front |
| `technical-deep-dive` | Layered: 概覽 → 機制 → trade-off → 邊界 | whole picture → layers → failure modes | API details first |
| `comparison` | Compare-clarity: 選項列舉 → trade-off → 結論 | same-axis A/B with numbers | incompatible axes |
| `explainer` | Layered build: prereq → concept → example → 邊界 | starts where reader is | assumes knowledge |
| `freeform` | Coherence: each section serves one argument | all converge to one takeaway | sections unrelated |

- **9-10**: All structural beats for this archetype present, in order, well-paced. No missing pieces.
- **7-8**: Structure present but one beat is thin (e.g., narrative's resolution段太短, comparison's conclusion lacks a clear pick).
- **4-6**: Two or more structural beats missing or out of order; or the structure of a different archetype was forced onto this post.
- **0-3**: No discernible structure for the chosen archetype; reads as random points stitched together.

Reviewer states which standard was used:
"Structural coherence (technical-deep-dive archetype): 8/10 — ..."

## Axis 3 — Material grounding

- **9-10**: Real RFC sections, commit SHAs, benchmark numbers, direct
  quotes with attribution, code patterns shown.
- **7-8**: Some real numbers/IDs, occasional paraphrase.
- **4-6**: Mostly paraphrase with occasional concrete reference.
- **0-3**: All paraphrase. Nothing verifiable.

Justification must cite specific material (e.g., "para 7 names RFC 9000
§3.2", "no specific numbers anywhere in body").

## Axis 4 — Depth vs. paraphrase

- **9-10**: Each H2 teaches a mechanism (why X works this way) or
  analyzes a trade-off (why X over Y). Adds layer the source didn't say.
- **7-8**: Most H2s explain mechanism; one or two are summary.
- **4-6**: Half summary, half mechanism.
- **0-3**: Entire post is "source said X, then they did Y" — no
  analytical layer.

Justification must point at the H2 that best demonstrates depth and the
H2 that is most paraphrase-like.

## Axis 5 — Relevance (domain-aware)

Standard switches by `domain` from the sidecar:

- `infra` / `web` / `backend` / `systems` → **Short-term
  actionability**: would the reader change a config, library, or patch
  plan this week?
- `ai` → **Landscape awareness**: does this change the reader's
  mental model of where AI is heading, even if they're not shipping
  ML code?

Grey-zone domains (e.g., Rust async paper in `systems`): reviewer
picks one in justification and notes the choice; PR human reviewer
may override.

- **9-10**: Concrete decision (actionability) or clear mental model
  shift (landscape).
- **7-8**: Clear takeaway in chosen dimension; some hedging.
- **4-6**: Implicit takeaway; reader has to infer.
- **0-3**: No discernible takeaway in either dimension.

Reviewer states which dimension was used.

## Axis 6 — Intra-post anti-template

- **9-10**: H2s named after actual topic. Opener, closer, body
  language feels written-for-this-post.
- **7-8**: One H2 leans on a generic phrasing pattern; rest specific.
- **4-6**: Multiple generic H2 patterns ("what happened" / "why it
  matters" / "so what"). Generic closer.
- **0-3**: Fill-in-the-blanks template.

Justification must list each H2 verbatim and mark each as
specific/generic.

## Axis 7 — Inter-post diversity (BATCH AXIS; N ≥ 2 only)

Evaluates the batch of N deep-stories written that day. Does NOT
contribute to any single post's per-post blocking score.

- **9-10**: Each post has its own voice. H2 patterns differ. Hooks
  use different rhetorical strategies.
- **7-8**: Most diverse; one pair has notable similarity.
- **4-6**: Two of N posts share recognizable shape.
- **0-3**: All N posts sound like the same writer wrote the same post
  N times.

Inter-post handling:
- Evaluated AFTER all per-post 1-6 axes settle.
- If batch_score < 7: identify the most-similar post; retry that one
  only with "find another angle" instruction.
- Inter-post retry budget: 2 rounds max.
- N = 1: skipped entirely.

Justification must identify `most_similar_post: <output_path>` when
score < 7.

## Reviewer output format

Reviewer sub-agent emits a single JSON object per post:

```jsonc
{
  "output_path": "src/posts/YYYY/MM/DD/<slug>.html",
  "archetype": "narrative", // or technical-deep-dive | investigation | comparison | explainer | freeform | null (roundup)
  "domain": "ai", // or systems | infra | web | backend | null (roundup)
  "axes": {
    "hook": {"score": 8, "justification": "..."},
    "structural": {"score": 7, "justification": "...", "standard_used": "narrative"},
    "material": {"score": 9, "justification": "..."},
    "depth": {"score": 8, "justification": "..."},
    "relevance": {"score": 7, "justification": "...", "dimension_used": "actionability"},
    "anti_template": {"score": 9, "justification": "..."}
  },
  "overall": "PASS" // or PASS-with-notes | IMPORTANT | BLOCKING
}
```

`overall` derivation:
- Any axis ≤ 3 → `BLOCKING`
- Otherwise any axis 4-6 → `IMPORTANT`
- Otherwise any axis 7-8 → `PASS-with-notes`
- All ≥ 9 → `PASS`

For the inter-post (Axis 7) reviewer, output format is:

```json
{
  "batch_score": 5,
  "most_similar_post": "src/posts/.../deep-foo.html",
  "justification": "..."
}
```

`most_similar_post` is `null` when `batch_score >= 7`.

## What this rubric does NOT score

- Mechanical structure (Step 8 / archetype-check / publish.mjs)
- Visual rendering (Step 8.5)
- Source selection (Step 3 scoring rubric)
- Dedup against past days (Step 3 + Step 8)

These have their own gates. The content rubric assumes those have
already passed.
