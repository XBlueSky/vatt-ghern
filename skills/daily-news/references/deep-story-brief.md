# Deep-Story Brief — what a sub-agent receives in Step 7b

This file documents the contract between the parent routine and each
deep-story sub-agent dispatched in Step 7b. The parent constructs one
of these briefs per deep-story (≤3 per day) and dispatches them in
parallel via Claude Code's `Agent` tool.

## The brief, as Markdown

````
You are writing ONE deep-story for vatt'ghern's daily-news routine.

## Cluster brief

- news_id:        {{YYYY-MM-DD-NN}}
- primary_url:    {{canonical URL of the primary source}}
- variant_urls:   [{{URL}}, {{URL}}, ...]   (cross-source variants if any)
- title:          {{Chinese headline, ≤ 24 chars}}
- domain:         {{ai|systems|infra|web|backend}}
- archetype:      {{narrative|technical-deep-dive|investigation|comparison|explainer|freeform}}
- summary:        {{2-3 sentence English/Chinese brief of what to cover}}
- output_path:    src/posts/{{YYYY}}/{{MM}}/{{DD}}/deep-{{slug}}.html
- sidecar_path:   src/posts/{{YYYY}}/{{MM}}/{{DD}}/deep-{{slug}}.11tydata.json
- related_roundup: /{{YYYY}}/{{MM}}/{{DD}}/roundup/

## What to do

1. WebFetch every URL in (primary_url + variant_urls) to gather
   technical detail. Quote real numbers, RFC sections, code patterns,
   commit SHAs — material grounding is non-negotiable.
2. Read the archetype reference:
   skills/daily-news/references/archetypes/deep-{{archetype}}.md
3. Read the persona: skills/daily-news/references/persona.md
4. Read the design-system: skills/daily-news/references/design-system.md
5. Read the widget-isolation contract:
   skills/daily-news/references/widget-isolation.md
6. Write the HTML to {{output_path}} following the archetype's H2
   sequence, widget budget, and closer label. Use the design-system
   colors + typography. Inline SVG widgets MUST be ID-scoped per
   widget-isolation rules.
7. Write the sidecar to {{sidecar_path}} per the schema in
   references/archetypes.md § Sidecar spec. `sources[]` MUST include
   EVERY variant_url, not just the primary.
8. Report back: path written, character count, archetype deviations
   (if any) with reasoning.

## Hard rules

- 600-1200 lines of HTML.
- Persona invariants: `——` (CJK double em-dash) not `—`; `：` (CJK
  colon) not `:` in prose.
- Inline SVG widgets ID-scoped (id pattern: `vg-{{news-id}}-{{purpose}}`).
- ONLY tools: WebFetch, Read, Write. No Bash, no Edit on other days'
  posts, no Agent (no nested dispatch), no git operations.
- Do NOT read past posts; the parent already handled dedup in Step 3.

## What "report back" means

Return a status block:

- status: DONE | DONE_WITH_CONCERNS | BLOCKED
- output_path: <path>
- sidecar_path: <path>
- char_count: <number>
- archetype: <name>
- archetype_deviations: <list or "none">
- concerns: <list or "none">
````

## How the parent uses these briefs

In Step 7b, the parent dispatches each brief as a separate `Agent`
tool call with `subagent_type: general-purpose`. The parent's message
to each sub-agent is the full brief above, with `{{...}}` placeholders
substituted.

The parent issues all ≤3 dispatches in **one batch** (single message
with multiple Agent tool blocks) so they execute in parallel.

In Step 7c, the parent reads back each output file, runs the existing
archetype-check / html-validate / link-check / dedup tests, and folds
all outputs into the same PR.

## Why parallelise

A deep-story typically takes 30-60 seconds of generation time
(WebFetch + writing + SVG). Three sequential takes ≈90-180s. Three
parallel takes ≈60s (bottleneck = slowest sub-agent). For a daily
routine the user is waiting on, this is a 2-3× wallclock improvement.

## Why this is safe

- Each sub-agent writes to a distinct file (deep-<slug>.html). No
  shared state.
- The parent finalised dedup BEFORE dispatching. Sub-agents cannot
  introduce duplicates.
- The parent verifies QA AFTER all sub-agents return. A single failure
  surfaces clearly in Step 7c; partial successes can be re-dispatched
  individually.
