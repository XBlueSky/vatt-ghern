# Decisions

Advisory modules invoked by the daily-news routine in SKILL.md Steps 3,
4, 5, and 5.0. Each module is a pure function (no I/O outside its CLI
shim) that takes JSON-shaped input and returns JSON-shaped advice.
Claude in the routine reads the advice, MAY override on editorial
grounds, and records overrides in the PR body under
`### Advisory overrides`.

Module list:

- `score.mjs` — adds +2 domain-coverage bonus to a Claude-supplied
  subjective score (0–8); clamps to 10.
- `cover-domains.mjs` — selects up to 10 items, ≥4 distinct domains,
  ≤6 per domain. Emits skipped + capped diagnostics.
- `cluster.mjs` — groups candidates that look like the same story
  (canonical URL OR title token-Jaccard ≥ 0.6, transitive union-find).
- `pick-archetype.mjs` — encodes the archetype decision tree from
  `references/archetypes.md` / SKILL.md Step 5.

Each module ships with a golden test under `tests/decisions/` and a
fixture under `tests/fixtures/decisions/`. The fixture freezes today's
(bootstrap date 2026-05-19) actual data. Any output drift triggers a
test failure with a JSON diff; the author either updates the fixture
(intended change) or fixes the regression (unintended change).
