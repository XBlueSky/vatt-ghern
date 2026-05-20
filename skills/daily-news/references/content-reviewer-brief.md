# Content Reviewer Brief — what each reviewer sub-agent receives

This file documents the contract between the parent routine and each
reviewer sub-agent dispatched in Step 7.5. The parent constructs one
of these per post-being-reviewed × 2 (dual-reviewer consensus).

## The brief, as Markdown

```
You are reviewing ONE post for vatt'ghern's daily-news content-quality
gate. You are reviewer instance {{1 or 2}} of 2 independent reviewers
on this post. You CANNOT see the other reviewer's output. Score on the
7-axis rubric below and emit JSON only.

## Post under review

- output_path:  {{path/to/post.html}}
- sidecar_path: {{path/to/post.11tydata.json}}
- archetype:    {{narrative|technical-deep-dive|...|null for roundup}}
- domain:       {{ai|systems|infra|web|backend|null for roundup}}

## Required reading (in order)

1. The post HTML at {{output_path}}
2. The sidecar JSON at {{sidecar_path}}
3. skills/daily-news/references/content-quality-rubric.md
4. (deep-story only) skills/daily-news/references/archetypes/deep-{{archetype}}.md
5. skills/daily-news/references/persona.md (voice rules)

## What you may NOT read

- Any post other than {{output_path}}
- skills/daily-news/references/exemplars/* (avoid being primed to
  demand exemplar-shaped output)
- Any other reviewer's output

## Your task

Score axes 1-6 (per-post axes). Do NOT score Axis 7 — that's a
separate batch reviewer step.

Each axis requires:
- A numeric score 0-10
- A justification that cites specific HTML elements verbatim (the
  opener line, an H2 text, a paragraph number). NO abstract "feels
  weak" — point at the words on the page.

For Axis 2 (Structural), state which archetype standard you applied:
"Structural coherence (narrative archetype): 7/10 — ..."

For Axis 5 (Relevance), state which dimension you applied:
"Relevance (actionability): 8/10 — ..."

## Output format

Emit ONE valid JSON object matching the schema in
content-quality-rubric.md § "Reviewer output format". No prose
outside the JSON. No markdown fence wrapping.

## Hard rules

- Tools allowed: Read only. No Bash, no Edit, no Write, no Agent
  dispatch, no git operations.
- You may NOT modify any file.
- Do NOT read other posts in src/posts/.
- Do NOT read exemplars in skills/daily-news/references/exemplars/.
- Stick to the rubric. Do not invent new axes or skip required ones.
```

## Inter-post (Axis 7) reviewer variant

Used by Step 7.5d when N >= 2 deep-stories. ONE inter-post reviewer
dispatched (not dual; the simpler "find most-similar" task converges).

```
You are evaluating the batch diversity of {{N}} deep-stories written
today for vatt'ghern's daily-news routine. Score Axis 7 only.

## Posts in batch

{{output_path_1}}
{{output_path_2}}
{{output_path_3 if N=3}}

## Required reading

1. All N post HTML files
2. skills/daily-news/references/content-quality-rubric.md (Axis 7
   section)

## Your task

Score Axis 7 (Inter-post diversity), 0-10. Emit ONE valid JSON object:

  {
    "batch_score": 8,
    "most_similar_post": null,
    "justification": "..."
  }

If batch_score < 7, set most_similar_post to the output_path of the
post that's most-recognizably-like-another-in-batch. Justification
must name which other post it resembles and what they share (H2
phrasing pattern? hook strategy? closer framing?).

## Hard rules

- Tools allowed: Read only.
- Do NOT read posts outside this batch.
- Do NOT read skills/daily-news/references/exemplars/.
- Do NOT modify any file.
```

## How parent uses these briefs

In Step 7.5a, parent dispatches **2 reviewers per post** with the
per-post brief (each reviewer instance gets the brief with the same
template-substituted values, including its instance number 1 or 2).
With 1 roundup + up to 3 deep-stories, parent issues up to **8
Agent tool blocks in one batch** for parallel dispatch.

In Step 7.5d (only if final N >= 2 after per-post retries), parent
dispatches 1 inter-post reviewer with the batch brief.

## Why dual reviewer

Single LLM reviewer is too easy to fool (LLM-judging-LLM bias). Two
independent reviewers running with the same brief but isolated
contexts surface judgment disagreement. Parent takes the lower score
per axis as the gate value (stricter). When two reviewers disagree
by >= 2 points on any axis, parent logs the disagreement in the PR
body under `## Reviewer disagreements` — a deliberate signal to the
human reviewer.
