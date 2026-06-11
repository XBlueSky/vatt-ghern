# Fact-check Brief — what each checker sub-agent receives

This file documents the contract between the parent routine and each
fact-check sub-agent dispatched in Step 7.6a. The parent constructs
one of these per post (1 roundup + N deep-stories). The standard the
checker applies lives in `fact-check.md`.

## The brief, as Markdown

```
You are fact-checking ONE post for vatt'ghern's daily-news routine.
Your job is adversarial: for every load-bearing claim, actively try
to show the cited source does NOT support it. A claim earns
`verified` only when you re-fetched the source and found the support
at the stated strength. Emit JSON only.

## Post under check

- output_path:  {{path/to/post.html}}
- sidecar_path: {{path/to/post.11tydata.json}}
- date:         {{YYYY-MM-DD}}

## Required reading (in order)

1. skills/daily-news/references/fact-check.md — the standard: claim
   taxonomy, 出處四態 verdicts, hedge delta, source independence,
   timeliness, archiving, ledger schema, action matrix.
2. The post HTML at {{output_path}}
3. The sidecar JSON at {{sidecar_path}} — its `sources[]` array is
   the claim-support ground truth you verify against.

## Your task

1. **Extract** load-bearing factual claims from the post body
   (`number` / `quote` / `attribution` / `date-version` / `causal` /
   `superlative` per fact-check.md). Record total found in
   `coverage.candidate_claims`. Prioritize quotes and numbers, then
   attributions, then causal/superlative. Check at least 10 claims
   for a deep-story (all of them if fewer exist); for a roundup,
   check at least one claim per item lede.
2. **Re-fetch** every URL in the sidecar's `sources[]` with WebFetch.
   For each, also attempt one archive snapshot via
   `https://web.archive.org/save/<url>` and record the resulting
   snapshot URL (or null — never retry archiving).
3. **Verify** each claim against the fetched source text:
   - Quote the supporting passage verbatim into `evidence`, or state
     what you looked for and did not find.
   - Compare hedging strength (`hedge_delta`) — a hedged source
     behind an unhedged claim is NOT verified.
   - For multi-source claims, judge `independence`: do the sources
     have separate provenance, or do they echo one origin?
   - Classify `timeliness` and flag volatile claims with stale
     sources.
4. **Assign** verdict × load and the required `action` per the
   fact-check.md action matrix. Set every claim's `resolution` to
   "none-needed" when action is "none"; otherwise leave resolution
   exactly as the literal string "pending-fix" — the parent fills it
   after the fix loop.

## Hard rules

- Tools allowed: Read, WebFetch only. No Bash, no Edit, no Write, no
  Agent dispatch, no git operations.
- You may NOT modify any file. The parent writes your ledger to disk.
- Do NOT judge prose style, structure, or widget quality — other
  gates own those.
- Do NOT verify claims against your own knowledge. "I know this is
  true" is not evidence; only fetched source text is. If the source
  is unreachable, the verdict is `pending`, even when you are sure.
- Do NOT read other posts, exemplars, or reviewer outputs.

## Output format

Emit ONE valid JSON object matching fact-check.md § "Evidence ledger
schema". No prose outside the JSON. No markdown fence wrapping.
```

## Re-check variant (Step 7.6c rounds ≥ 2)

After the fix loop edits the post, the parent re-dispatches the
checker with the same brief PLUS:

```
## Re-check scope

This is round {{N}}. Verify ONLY the claims listed below (the fix
loop edited them); re-read the post body at their locations and
re-verdict each. Do not re-extract or re-check other claims.

{{claim id, original claim_text, action taken — one per line}}

Emit a JSON object with only the re-checked claims in `claims[]`,
`checker_rounds: {{N}}`, and the same coverage block as round 1.
```

The parent merges re-checked verdicts into the round-1 ledger and
updates `checker_rounds`.

## How parent uses these briefs

In Step 7.6a, parent dispatches **1 checker per post** — up to 4
Agent tool blocks (1 roundup + 3 deep-stories) in ONE response,
`subagent_type: general-purpose`, **`model: "opus"` required** (same
rationale as Steps 7b/7.5a: verdict judgment on hedge strength and
source independence is design-grade; if Opus is unavailable, report
BLOCKED rather than fall back). Parent writes each returned ledger to
`/tmp/vg-factcheck-YYYY-MM-DD/<slug>-ledger.json`, applies the action
matrix, runs the Step 7.6c fix loop, and finally validates with
`scripts/check-claim-ledger.mjs`.

## Why single checker (not dual)

Step 7.5 uses dual reviewers because numeric quality scores are
subjective and drift; a fact-check verdict is anchored to a fetched
document — "the source says X" is checkable by the human reviewer
from the `evidence` field. The adversarial stance + verbatim-evidence
requirement does the bias-control work that the second reviewer does
in 7.5. The PR body exposes every non-`verified` verdict, so a lazy
checker is visible at review time.
