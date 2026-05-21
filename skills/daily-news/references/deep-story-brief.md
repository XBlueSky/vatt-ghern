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
6. **Read the widget cookbook entry point**:
   skills/daily-news/references/widget-cookbook/INDEX.md
7. **Read mandatory cookbook files**:
   - skills/daily-news/references/widget-cookbook/tier-3-principles.md
   - skills/daily-news/references/widget-cookbook/anti-examples.md
8. **Read the exemplar for your archetype** (calibration on what
   "good" looks like — NOT a template to clone):
   - skills/daily-news/references/exemplars/{{archetype}}.html
   - skills/daily-news/references/exemplars/{{archetype}}.md (annotation)
   If both files exist, read both fully. If they do NOT exist
   (empty exemplar slot for this archetype), skip this step and
   proceed — the rubric + archetype reference are enough.
   Do NOT copy H2 phrasings, opener structure, widget choices, or
   closer language from the exemplar. The annotation's
   "Watch-for" section reinforces this.
9. **Pick widgets from the cookbook**:
   - exactly 1 Tier-1 template as the post's hero widget
   - 2-4 Tier-2 snippets for supporting widgets
   - Read the detail pages for the picked Tier-1 and Tier-2 entries
   - In scratch (not the file), write a widget plan: each widget's
     conceptual question + the picked template/snippet + the
     data/state it operates on. If you cannot write a conceptual
     question for a widget, drop it.
10. Write the HTML to {{output_path}} following the archetype's H2
    sequence, widget budget, and closer label. Use the design-system
    colors + typography. Each widget MUST have a `.vg-w-<widget-id>`
    class prefix on its root element.
11. Write the sidecar to {{sidecar_path}} per the schema in
    references/archetypes.md § Sidecar spec. `sources[]` MUST include
    EVERY variant_url. Sidecar MUST include `widget_count`,
    `widget_questions`, and `widget_templates` fields.
12. Report back: path written, character count, archetype deviations
    (if any) with reasoning, widget count, and widget templates used.

## Hard rules

- **Prose ≥ 500 lines** (HTML inside `<p>`, `<h2>`, etc.). Widget
  markup inside `<script>`, `<style>`, `<svg>`, `<canvas>` does NOT
  count against the prose budget. The previous "600-1200 lines of
  HTML" rule caused sub-agents to skimp on widget code; that rule is
  removed.
- **≥ 3 widgets total**. ≥ 1 must be a Tier-1 (interactive) hero
  widget — that is, the widget includes at least one of: `<script>`
  (interactive logic), `<input>` (user input), `<canvas>` (loop).
  **Scroll-driven CSS (`animation-timeline: scroll()`) and the
  scroll-tied stage walkthrough pattern are BANNED 2026-05-21 — see
  `widget-cookbook/anti-examples.md` §G.** Use tabs
  (`tab-switcher-pure-css`) for staged narratives instead.
- **Banned widget templates** (REJECT if any appears in sidecar's
  `widget_templates`): `scroll-driven-explanation`,
  `css-scroll-timeline`. These will fail Step 7c verification.
- **Each widget carries a conceptual question** recorded in the
  sidecar's `widget_questions` array (one entry per widget).
- Persona invariants: `——` (CJK double em-dash) not `—`; `：` (CJK
  colon) not `:` in prose.
- Each widget has its `.vg-w-<widget-id>` class prefix. IDs inside
  the widget are prefixed with the widget id (see widget-isolation
  Rule 2).
- ONLY tools: WebFetch, Read, Write. No Bash, no Edit on other days'
  posts, no Agent (no nested dispatch), no git operations.
- Do NOT read past posts; the parent already handled dedup in Step 3.

## What "report back" means

Return a status block:

- status: DONE | DONE_WITH_CONCERNS | BLOCKED
- output_path: <path>
- sidecar_path: <path>
- char_count: <number>
- prose_line_count: <number>  (excludes <script>, <style>, <svg>, <canvas>)
- archetype: <name>
- widget_count: <number>
- widget_templates: <list of cookbook ids used>
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
