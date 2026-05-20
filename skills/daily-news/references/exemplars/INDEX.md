# Exemplar Library — INDEX

This directory holds one exemplar deep-story per archetype, picked from
posts that scored highest on the content-quality rubric (axes 1-6).
The author sub-agent in Step 7a reads its archetype's exemplar + its
annotation BEFORE drafting.

## Files

For each archetype the library has two files:

- `<archetype>.html` — verbatim copy of an exemplar post
- `<archetype>.md` — annotation explaining why this is the exemplar

## Status (updated when exemplars are picked from audit)

| Archetype | Status | Source post (if present) |
|---|---|---|
| narrative | present | src/posts/2026/05/19/deep-notion-vector-search.html |
| technical-deep-dive | present | src/posts/2026/05/19/deep-modal-cold-starts.html |
| investigation | empty | - |
| comparison | present | src/posts/2026/05/17/deep-cpp26-simd-critique.html |
| explainer | present | src/posts/2026/05/20/deep-turso-quint-sqlite.html |
| freeform | present | src/posts/2026/05/20/deep-meta-reel-friends.html |

When status is `<empty>`, the author sub-agent's archetype-fallback
applies (skip the exemplar read, proceed with rubric + archetype
reference only).

## How to consume an exemplar (author sub-agent reading guidance)

**This is a calibration on the quality bar, not a template.**

Do:
- Read the exemplar HTML and annotation in full before drafting
- Notice the level of specificity in the opener, the kind of
  material grounding in each H2, the closing tone
- Hold the bar at "this level of finish" while writing your own

Do NOT:
- Copy H2 phrasings
- Mimic the opener structure
- Replicate widget choices
- Reuse the closer's punchline

The annotation's "Watch-for" section calls out things even the
exemplar didn't fully achieve, to reinforce don't-clone framing.

## How exemplars are picked

Mechanical algorithm (see `scripts/content-audit.mjs` output for the
pick rationale):

1. For each archetype, find all posts in the audit set with that
   archetype.
2. Pick the one with the highest sum of axes 1-6.
3. Ties broken by domain diversity (prefer the post in a domain no
   other exemplar already covers).
4. If no archetype-matching post has all six axes >= 7, that archetype
   has no exemplar; fallback applies.

User reviews picks and may swap individual entries before commit.

## Annotation format

Each `<archetype>.md` annotation has three short sections:

```markdown
# Exemplar: <slug> — <archetype>

**Why this is the exemplar:** ~3 sentences. References rubric axes
this post scored highest on; calls out specific HTML elements
(opener line, an H2 phrasing, a paragraph) worth noting.

**Watch-for:** ~2 sentences. Things this exemplar did NOT fully
achieve. Author should not mistake the exemplar for a ceiling.

**Source:** original post path. Audit score row.
```

## When to refresh exemplars

- When the rubric file changes (re-run audit on new exemplars)
- When new posts score notably higher than existing exemplars
- Annually as a hygiene pass

Annotations may drift relative to current post content if a retrofit
later rewrites the exemplar post. Re-generate annotation after any
exemplar source post is rewritten.
