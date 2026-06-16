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
- ledger_path:    src/posts/{{YYYY}}/{{MM}}/{{DD}}/deep-{{slug}}.ledger.json
- related_roundup: /{{YYYY}}/{{MM}}/{{DD}}/roundup/
- recent_widgets: [{{template-id}}, ...]   (heroes + supports used by recent
                  and same-day deep-stories; the parent fills this in Step 7a.
                  Use it to rotate widget choices — see step 9. May be empty.)

## What to do

1. WebFetch every URL in (primary_url + variant_urls) and build your
   reading ledger AS YOU READ (schema: fact-check.md § Evidence
   ledger). Per source: attempt one Wayback snapshot
   (https://web.archive.org/save/<url>; null on failure, never retry)
   and fill one perspective set (mechanism / tradeoff / reader_use).
   Per fact worth using: one note — verbatim quote (original
   language), the source's own hedge strength, and your
   interpretation in a SEPARATE field. The post may only assert what
   the notes contain; material grounding is non-negotiable.
1.5 Read skills/daily-news/references/fact-check.md § "The authoring
   discipline" — the full read → structure → write contract. The
   Step 7.6 checker will trace every load-bearing claim in your post
   back to these notes and re-fetch the sources to verify your
   quotes; a quote that is not really in the source kills the post.
2. Read the archetype reference:
   skills/daily-news/references/archetypes/deep-{{archetype}}.md
3. Read the persona: skills/daily-news/references/persona.md
3.5 Read the zh-TW prose rules:
   skills/daily-news/references/zh-tw-prose.md — apply while drafting.
   The Step 8 scanner and reviewer Axis 8 are backstops, not the fix.
4. Read the design-system: skills/daily-news/references/design-system.md
5. Read the widget-isolation contract:
   skills/daily-news/references/widget-isolation.md
5.5 **Consult the catalog before hand-writing widgets.** Read
   skills/daily-news/references/widget-catalog.md — the list of finished,
   reusable catalog widgets. For each one, weigh its `suits` and summary
   against the concept questions this story must answer. For any CLEAN match:
   - Summon it with `{% widget "name" %}` (one line) instead of hand-writing.
   - It counts as one widget toward the ≥3 floor (and the ≥5 `vg-w-*` enforcer
     count): the shortcode emits a `<figure class="vg-w-<name>">` wrapper that
     the counter sees, and its injected `<script src>` satisfies the
     ≥1-interactive rule — summoning never makes the post fail the contract.
   - Record it in the sidecar like any widget (see step 11 accounting).
   Do NOT force a catalog widget where `suits` does not clearly match — a
   contrived summon is worse than a hand-written inline widget. When nothing
   matches, proceed to the cookbook steps and hand-write inline as usual.
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
   - **Rotate against `recent_widgets`.** If a template id in `recent_widgets`
     (above) is one of your candidate picks, prefer a different candidate that
     answers the same question — especially for the hero. Only repeat a
     `recent_widgets` entry if no other candidate genuinely fits the story. This
     is how the site avoids shipping the same hero / the same `tab-switcher` +
     `matter-of-fact-table` combo every day (see INDEX § Hero rotation and the
     Tier-2 "NOT defaults" note).
   - Read the detail pages for the picked Tier-1 and Tier-2 entries
   - In scratch (not the file), write a widget plan: each widget's
     conceptual question + the picked template/snippet + the
     data/state it operates on. If you cannot write a conceptual
     question for a widget, drop it.
9.5 **每個 widget 標 mobile tier**：在每個 `<figure class="vg-w-...">` 開
   標籤明確寫 `data-mobile="keep|static|swap"`（優先順序 keep > static >
   swap；archetype-check 硬性要求）。純靜態圖與真 table → `keep`；有控制
   項但預設畫面讀得懂 → `static`（加 `data-svg-scroll`，控制列標
   `data-vg-controls`）；互動本身是內容 → `swap`＋`data-mobile-summary`
   20–80 字 takeaway（寫結論本身，禁半形冒號、Latin em-dash、半形雙引號）。
   手機讀者看 keep/static 的靜態圖、swap 的摘要卡，所以 static widget 的
   預設狀態必須自成一張完整的圖。
   Catalog widget（`{% widget %}`）tier 預設 swap，可用 `mobile=` 覆寫。
   詳見 widget-isolation.md「Mobile tier contract」。
9.8 **Distil the thread-spine before drafting**: 5-7 points, the
   argument backbone, written into the ledger's `spine` array. Build
   it from your perspective fields, ordered for the archetype's arc
   (the archetype reference's Engagement section sets register, hook
   patterns, and tension sources). The Step 7.5 Axis 2 reviewer reads
   this spine and judges the post against it.
10. Write the HTML to {{output_path}} following the archetype's H2
    sequence, widget budget, and closer label. Use the design-system
    colors + typography. Each widget MUST have a `.vg-w-<widget-id>`
    class prefix on its root element. Claims (numbers/quotes/attributions/causal) only from your notes' fact layer; never upgrade a note's hedge; mark inferences as inferences（「合理的推測是…」）.
11. Write the sidecar to {{sidecar_path}} per the schema in
    references/archetypes.md § Sidecar spec. `sources[]` MUST include
    EVERY variant_url. Sidecar MUST include `widget_count`,
    `widget_questions`, and `widget_templates` fields. When a story mixes
    hand-written inline widgets and summoned catalog widgets, BOTH count in
    all three fields. For `widget_templates`: an inline widget contributes its
    cookbook template id (e.g. `data-driven-chart`); a summoned catalog widget
    contributes `catalog:<name>` (e.g. `catalog:feature-flags`) — the prefix
    distinguishes summoned-from-catalog from authored-from-template. `widget_count`
    must equal both `widget_questions.length` and `widget_templates.length`. The sidecar
    `summary` field MUST be Traditional Chinese (繁體中文), matching
    the post body's language — it surfaces in the homepage "Today's
    deep reads" cards and the RSS feed alongside the Chinese title.
    Mixing an English `summary` with a Chinese title produces a
    visibly inconsistent index card (PR #35, 2026-05-23 shipped one
    English sidecar summary and had to patch it post-merge).
11.5 Write the ledger to {{ledger_path}}: spine + sources (with
    fetch_status, perspective + archive_url) + notes. Leave `claims` as an empty
    array and `checker_rounds: 0` — the Step 7.6 checker fills them.
    Set `output_path` to {{output_path}}, `checked_at` to today.
11.8 **Pre-flight self-audit (mechanical, before reporting back).**
    Re-read your own written HTML + sidecar and check each item below.
    This is a MECHANICAL contract check — count and grep, NOT a quality
    judgment (quality is the Step 7.5 reviewer's job, downstream). If an
    item fails, FIX it now; if it genuinely cannot be fixed, report
    `DONE_WITH_CONCERNS` or `BLOCKED` and name the failing item. Record
    each result in the `preflight` block of the status report (Step 12).
    - `em_dash_check`: no Latin `—`/`–`, no half-width `：`, no
      half-width `"`/`"` anywhere in `.vg-post-body` prose (persona
      invariant). Widget code is exempt.
    - `widget_count_match`: count `<figure class="vg-w-...">` blocks;
      it MUST equal the sidecar's `widget_count`, `widget_questions.length`,
      and `widget_templates.length`.
    - `placeholder_check`: no `// ...`, `/* ... */`, `省略`, `以此類推`,
      `為簡潔起見`, `for brevity`, "rest follows the same pattern", and
      no unclosed `<script>`/`<svg>`/`<canvas>` in any widget (see the
      Hard rule).
    - `cjk_char_count_ok`: CJK chars in `.vg-post-body` (widget code
      excluded) ≥ 4000.
12. Report back: path written, character count, archetype deviations
    (if any) with reasoning, widget count, and widget templates used.

## Hard rules

- **Prose ≥ 4000 CJK chars** in `.vg-post-body` (widget code inside
  `<script>`, `<style>`, `<svg>`, `<canvas>` excluded) — the floor
  `tests/archetype-check.mjs` actually enforces. This is a *floor*,
  not a target: do NOT write to a length quota
  (widget-cookbook/tier-3-principles.md §11, density > length). The
  older "prose ≥ 500 lines" phrasing is retired — line counts rewarded
  padding and contradicted §11.
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
- Persona invariants in prose: `——` (CJK double em-dash) not Latin
  `—`/`–`; `：` (CJK colon) not `:`; full-width quotes `「」`/`『』` not
  half-width `"`/`"`. (Widget code is exempt; these apply to
  `.vg-post-body` prose, and are exactly what `em_dash_check` audits.)
- zh-tw-prose.md 鐵律：所有數字、場景、引語必須來自 source；去 AI 味
  靠刪與改寫，不靠補細節。zh-CN 用語與 AI 套話會被 Step 8 的
  check-zh-prose.mjs 機械擋下。
- Ledger discipline: every number/quote/attribution in the post
  traces to a note in {{ledger_path}}. Quote fields are verbatim
  source text — the checker re-fetches and looks for them. Inventing
  or "improving" a quote is the one unforgivable failure mode.
- Each widget has its `.vg-w-<widget-id>` class prefix. IDs inside
  the widget are prefixed with the widget id (see widget-isolation
  Rule 2).
- ONLY tools: WebFetch, Read, Write. No Bash, no Edit on other days'
  posts, no Agent (no nested dispatch), no git operations.
- Do NOT read past posts; the parent already handled dedup in Step 3.
- **No truncation placeholders.** Every widget `<script>`/`<svg>`/
  `<canvas>` must be complete — no `// ...`, `/* ... */`, `省略`,
  `以此類推`, `為簡潔起見`, `for brevity`, "rest follows the same
  pattern", and no unclosed tag. A widget that reaches the prose floor
  with text but ships a truncated chart is a failure.

## What "report back" means

Return a status block:

- status: DONE | DONE_WITH_CONCERNS | BLOCKED
- output_path: <path>
- sidecar_path: <path>
- ledger_path: <path>
- char_count: <number>
- cjk_char_count: <number>  (CJK chars in .vg-post-body, widget code excluded)
- archetype: <name>
- widget_count: <number>
- widget_templates: <list of cookbook ids used>
- archetype_deviations: <list or "none">
- note_count: <number>
- spine_points: <number>
- concerns: <list or "none">
- preflight:  (mechanical self-audit results — Step 11.8)
    em_dash_check: PASS | FAIL (<what was found>)
    widget_count_match: true | false (<figure count> vs <sidecar count>)
    placeholder_check: PASS | FAIL (<what was found>)
    cjk_char_count_ok: true | false (<count> vs 4000 floor)
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
all outputs into the same PR. The parent also reads each sub-agent's
`preflight` block: a sub-agent that reports `DONE` while any preflight
item is FAIL is treated as BLOCKED and re-dispatched. This pre-flight is
mechanical contract compliance, front-loaded to save a review round; it
does not substitute for the Step 7.5 judgment-quality review.

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
