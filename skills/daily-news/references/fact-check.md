# Fact-check layer — Step 7.6 spec

This file is the standard the Step 7.6 fact-check gate applies. The
sub-agent contract (the brief each checker receives) lives in
`fact-check-brief.md`; the mechanical validation lives in
`scripts/check-claim-ledger.mjs`. Read this file before constructing
briefs or judging ledger output.

## Why this layer exists

The pipeline already judges *how the prose reads* (Step 7.5 rubric,
Axis 8 + the Step 8 scanner) and *how the page renders* (Step 8.5).
Nothing re-opens the cited sources and verifies that what the post
**asserts** is actually **in** them. Deep-story authors WebFetch
sources once, then write 600–1200 lines from working memory — the
classic failure modes are:

- **Citation drift**: the post cites a source for a claim the source
  never makes (the author conflated two paragraphs, or remembered a
  number wrong).
- **Paraphrase inflation**: the source hedges（"may reduce latency in
  some workloads"）, the post asserts（「把延遲砍半」）. The words are
  new, the epistemic strength silently upgraded.
- **Echo corroboration**: two "independent" sources both restate the
  same upstream press release; the post presents them as independent
  confirmation. Step 5.0 clustering groups same-story variants but
  never judges whether variants are *independent reporting*.
- **Fabricated texture**: zh-tw-prose.md §1 already forbids inventing
  numbers/scenes/quotes, but §1 is an author-side rule with no
  verifier. This layer is the verifier.

The fix is structural, not just post-hoc: the evidence ledger is built
**while reading** (Step 7b), not reconstructed afterwards. Reading
notes separate the source's words from the author's interpretation at
the moment of reading; the post may only assert what the notes
contain; verification then has two cheap-to-expensive stages — trace
(post → notes) and authenticity (notes → re-fetched sources). The
ledger is also the internalization record: its perspective fields
(mechanism / tradeoff / reader_use) answer at reading time the
questions rubric Axes 4/5 will ask at review time, and its `spine` is
the argument backbone the Axis 2 reviewer checks the post against.

Verification is a **gate, not a score**. LLM judges inflate numeric
scores (the reason rubric scores are advisory + human-final); a
fact-check verdict is closer to a mechanical fact — either the source
supports the sentence or it does not. That is why this layer emits
per-claim verdicts and required actions, not a 0–10 axis.

## The authoring discipline (Step 7b: read → structure → write)

- **Read**: for every source fetched, write notes into the ledger as
  you read — `quote` (verbatim, original language), `hedge` (the
  source's own strength: hedged/asserted), `interpretation` (your
  reading, physically separate from the quote), `timeliness`. Attempt
  one Wayback snapshot per source URL at read time
  (`https://web.archive.org/save/<url>`; record null on failure, never
  retry). Fill one `perspective` set per source: what mechanism does
  this teach (Axis 4)? what tradeoff? what does a Taiwanese engineer
  reader do with it (Axis 5)?
- **Structure**: before drafting, distil the `spine` — a 5–7 point
  argument backbone — from the perspective fields. Read your
  archetype's Engagement section for register/hook/tension guidance.
- **Write**: numbers, quotes, attributions, and causal assertions may
  only come from the notes' fact layer. Material not in the notes:
  re-read the source and add a note, or mark the sentence as
  inference（出處四態的「推斷」）. Never upgrade a note's hedge
  strength in prose.

## What counts as a check-worthy claim

The checker does NOT verify every sentence. It extracts **load-bearing
factual claims** — assertions whose falsity would damage the post:

| type | examples |
|---|---|
| `number` | latencies, throughput, percentages, prices, dataset sizes, line counts |
| `quote` | anything inside 「」 attributed to a person/document |
| `attribution` | "X 團隊說/決定/發現…", "RFC 9000 §3.2 規定…" |
| `date-version` | release dates, version numbers, timeline orderings |
| `causal` | "因為 A 所以 B" where the causal link is presented as the source's finding |
| `superlative` | "第一個", "最大的", "唯一" — absolute claims |

Priority when the post has more claims than the checker can verify:
quotes and numbers first (highest damage when wrong), then
attributions, then causal/superlative. **No silent caps** — the
ledger's `coverage` block records how many candidate claims were
found, how many checked, how many dropped as low-load. A deep-story
normally yields 10–25 checked claims; a roundup yields at least one
per item (each lede's "what happened" sentence is a claim).

## Verdict — 出處四態

Every checked claim gets exactly one verdict:

- **`verified`（已核實）** — the checker re-fetched the source and
  found the claim supported *at the stated strength*. `evidence` must
  quote the supporting source passage verbatim.
- **`pending`（待核實）** — the source could not be re-fetched
  (paywall, 404, fetch failure), so support is unknown. Not an
  accusation — but a high-load pending claim needs an alternate
  source or a hedge before publish.
- **`inferred`（推斷）** — the claim is the *author's* synthesis, not
  in any source. Legitimate only when the text marks it as inference
  (「合理的推測是…」「照這個節奏推算…」). Unmarked inference
  presented as sourced fact requires action.
- **`unverifiable`（不可核實）** — the checker re-fetched the source
  and the claim is NOT there, or contradicts what is there. This
  includes hedge inflation severe enough to change meaning. A trace
  failure — a sourced-sounding claim with no backing note and no
  inference marking — is also `unverifiable` without any fetch (see
  § Trace stage).

`verdict` and `load` are **orthogonal** — a verdict states what the
evidence shows; `load`（high / medium / low）states how much the post
leans on the claim (in the hook or closer, repeated, drives the
argument = high; one passing mention in a list = low). The action
matrix below crosses them.

## Hedge delta

For every `verified`-candidate claim, compare epistemic strength
between the note's recorded `hedge` field and the post sentence:

- `none` — same strength.
- `inflated` — note records `hedge: "hedged"`, but the post asserts
  ("may/early results suggest/in our benchmark" → 「是/已經/砍半」).
  An inflated claim is **not** `verified`; verdict becomes
  `unverifiable` when the unhedged version is not in the source, with
  `hedge_delta: "inflated"` recording why.
- `deflated` — post is weaker than the note's hedge. Never an error;
  record it and move on.

## Source independence

When a claim cites ≥2 sources, judge whether they are independent:

- `corroborated` — sources with separate provenance (vendor postmortem
  + third-party reproduction; paper + independent benchmark).
- `echo` — both trace to one origin (two outlets rewriting the same
  announcement; a blog citing the other cited blog). Echo counts as
  **one** source. If the post's prose presents echo as independent
  confirmation（「多方證實」), that sentence needs the `correct`
  action.
- `single-source` — only one source exists. Fine, as long as the prose
  doesn't pretend otherwise; high-load single-source claims should
  carry visible attribution in the text（「按 X 的說法」）.

## Timeliness（時效分層）

Classify each note's shelf life (claims inherit it through their bound notes):

- `durable` — protocol semantics, historical events, algorithmic facts.
- `annual` — pricing, market share, "current version" statements;
  fine for a daily post, flag if the source is > 1 year old.
- `volatile` — anything that can change within weeks (ongoing
  incident status, unreleased-product claims, leadership statements
  mid-controversy). A volatile claim whose only source predates the
  post by months gets `action: "hedge"` with a dated attribution
  （「截至 6 月 10 日」）.

## Archiving discipline

Link rot makes every future re-verification impossible, so the
**author** archives **at read time** (Step 7b): for each source URL,
attempt a Wayback snapshot via `https://web.archive.org/save/<url>` (a
plain WebFetch GET triggers Save Page Now) and record the snapshot URL
in `sources[].archive_url`. The checker fills gaps for any source the
author left null. Archive failure is non-blocking — record `null` and
continue; the gate warns but does not fail on a null archive. Never let
archiving anxiety consume the read budget: one attempt per URL, move
on.

## Evidence ledger schema

One ledger per deep-story, committed next to the post at
`src/posts/YYYY/MM/DD/deep-<slug>.ledger.json`. Ledgers are excluded
from the 11ty build (the posts passthrough already excludes JSON) and
are PR-review evidence.

```jsonc
{
  "output_path": "src/posts/2026/06/12/deep-foo.html",
  "spine": [
    "1. …",                     // 5-7 point argument backbone,
    "2. …"                      // distilled from perspective fields
  ],
  "sources": [
    {
      "url": "https://example.com/post",
      "fetch_status": "ok",       // ok | failed — author records the read-time fetch; checker overwrites with the re-fetch result
      "archive_url": "https://web.archive.org/web/…",  // attempted at READ time; null allowed
      "published": "2026-06-10",                        // or null
      "perspective": {            // ≥1 set per source (not per quote)
        "mechanism": "what this source teaches, as a mechanism",
        "tradeoff": "the tradeoff behind it",
        "reader_use": "what a Taiwanese engineer does with it"
      }
    }
  ],
  "notes": [
    {
      "id": "n01",
      "url": "https://example.com/post",
      "quote": "verbatim source text — original language, no translation",
      "hedge": "hedged",          // hedged | asserted — source's own strength
      "interpretation": "author's reading — physically separate from quote",
      "timeliness": "volatile"    // durable | annual | volatile
    }
  ],
  "claims": [                     // filled by the Step 7.6 checker
    {
      "id": "c01",
      "claim_text": "verbatim span from the post",
      "location": "under H2「…」",
      "type": "number",           // number|quote|attribution|date-version|causal|superlative
      "load": "high",             // high|medium|low
      "note_ids": ["n01"],        // trace target; [] = trace failure
      "independence": "single-source",  // corroborated|echo|single-source
      "verdict": "verified",      // verified|pending|inferred|unverifiable（出處四態）
      "hedge_delta": "none",      // none|inflated|deflated (post vs. note's hedge)
      "evidence": "verbatim source quote, or null",
      "note": "",
      "action": "none",           // none|correct|hedge|mark-inferred|delete
      "resolution": "none-needed" // none-needed|corrected|hedged|marked-inferred|deleted|accepted-with-flag
    }
  ],
  "checked_at": "2026-06-12",
  "checker_rounds": 1,
  "coverage": { "candidate_claims": 31, "checked": 24, "dropped_low_load": 7 }
}
```

**Roundup variant**: `roundup.ledger.json` is claims-only — no
`notes[]`, no `spine`, no `perspective` — produced by the checker
post-hoc and committed like the deep-story ledgers. The mechanical gate
skips spine and trace rules for it. Minimum: ≥1 claim per item lede.

## Trace stage

Before authenticity checking, every load-bearing claim extracted from
the post binds to `note_ids`. An empty binding is a trace failure
unless the verdict is `inferred` (the claim is the author's marked
synthesis). Trace failures go to the fix loop: add the missing note by
re-reading the source, or rewrite/mark the sentence. The mechanical
gate (`check-claim-ledger.mjs`) enforces the binding; the checker's
honesty about it is auditable because the notes' quotes are verbatim.
Deleted claims keep their empty binding as a historical record — the
mechanical gate exempts `resolution: "deleted"` from the trace rule.

## Action matrix — verdict × load

| verdict | high load | medium / low load |
|---|---|---|
| `verified` | `none` | `none` |
| `pending` | find alternate source (re-verdict) OR `hedge` with visible attribution; `accepted-with-flag` allowed ONLY at medium/low | `hedge` or `accepted-with-flag` (PR body lists it) |
| `inferred` (unmarked) | `mark-inferred` or `delete` | `mark-inferred` or `delete` |
| `unverifiable` | `correct` (rewrite to what the source actually says) or `delete`. NEVER `accepted-with-flag`. | `correct` or `delete` |

Plus two cross-cutting rules:

- `hedge_delta: "inflated"` → the fix restores the source's hedging
  strength (`correct`), regardless of load.
- `independence: "echo"` presented in prose as multi-source
  confirmation → `correct` the presenting sentence.

**Fix discipline** (mirrors zh-tw-prose.md §1): every fix is deletion,
hedging, marking as inference, or correcting *to what the source
actually says*. A fix may NOT introduce new facts, numbers, or quotes
that the checker has not verified. Trace failures may be fixed by
adding a note — but only with a verbatim quote from a re-fetched
source. The Step 7.6c retry brief repeats this constraint verbatim.

## What this layer is NOT

- Not a re-score of rubric Axis 3. Axis 3 judges grounding *texture*
  (does the prose cite concrete material); Step 7.6 verifies grounding
  *truth* (is the cited material real). A post can score 9 on Axis 3
  and fail Step 7.6 — that is the layer working as designed.
- Not a style pass. If the checker finds prose problems, it ignores
  them; Steps 7.5/8 own prose.
- Not a search for new material. The checker verifies against the
  ledger's `sources[]` (plus alternate sources it finds when chasing
  a `pending` claim); it never feeds new color back into the post.
