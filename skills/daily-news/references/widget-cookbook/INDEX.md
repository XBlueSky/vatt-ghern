# Widget Cookbook — Index

> Entry point for daily-news deep-story sub-agents. Read this file,
> then read `tier-3-principles.md` and `anti-examples.md` in full.
> Then pick exactly 1 Tier-1 hero template and 2-4 Tier-2 snippets,
> and read only those.

## How to use this cookbook

1. **Read `tier-3-principles.md` in full.** Without the design
   principles, the templates produce "things that move" instead of
   "things that teach".
2. **Read `anti-examples.md` in full.** Distill-grade output is as
   much about what you don't ship as what you do.
3. **Skim this INDEX** and pick:
   - exactly **1 Tier-1 template** as your post's hero widget
   - **2-4 Tier-2 snippets** for supporting widgets
4. **Read only the Tier-1 detail page you picked** and **only the
   Tier-2 snippets you picked**. Do not read the entire cookbook.
5. **Write a widget plan in scratch** (not in the post file):
   for each widget you intend to ship, write its conceptual question
   in one sentence. If you cannot, drop that widget.
6. **Record in the sidecar JSON**:
   - `widget_count`: total widget count (≥ 3)
   - `widget_questions`: one entry per widget, the conceptual question
   - `widget_templates`: the template/snippet identifiers you used

## Tier 1 — Hero templates (pick exactly 1 per deep-story)

Each Tier-1 template is a complete copy-and-modify example with
adjustable axes, common variations per domain, and template-specific
anti-patterns.

| Template id | One-line purpose | Best fit |
|---|---|---|
| `interactive-param-demo` | Slider drives a real curve; reader sweeps a continuous variable. Answers "how sensitive is X to Y?" | investigation, explainer |
| `mini-canvas-simulation` | Canvas + rAF loop showing dynamic behaviour over time. Answers "what does this look like over time?" | narrative, explainer |
| `annotated-diagram-walkthrough` | Architecture diagram where each component reveals its responsibility on selection. Answers "which component owns what?" | technical-deep-dive |
| `data-driven-chart` | Real numerical data plotted with programmatic axes, ticks, series. Answers "what's the shape of the data?" | comparison, investigation |

> **BANNED**: `scroll-driven-explanation` was banned 2026-05-21 after repeated
> failures (sticky figure leaving viewport, fragile observer margins).
> Use a tab-driven walkthrough (`tab-switcher-pure-css`) for staged
> narratives instead.

Detailed pages:
- `tier-1-golden/interactive-param-demo.md`
- `tier-1-golden/mini-canvas-simulation.md`
- `tier-1-golden/annotated-diagram-walkthrough.md`
- `tier-1-golden/data-driven-chart.md`

## Tier 2 — Capability snippets (pick 2-4 per deep-story)

Snippets are smaller patterns. Some are zero parts of Tier-1 templates
(observers, animation, canvas loop); some are standalone capabilities
(tables, tabs, 3D transforms).

### Observers + animation foundations

| Snippet id | One-line purpose |
|---|---|
| `intersection-observer-reveal` | Fire callback when element enters viewport |
| `web-animations-api` | `element.animate()` for precise timing control |
| `canvas-2d-loop` | rAF main loop + pause/reset + DPR-aware sizing |
| `svg-path-morph` | Interpolate between two SVG `d` attributes |
| `range-input-binding` | `<input type=range>` → live readout + redraw callback |

### Pointer + modern CSS

| Snippet id | One-line purpose |
|---|---|
| `draggable-svg-handle` | Pointer events + viewBox clamping inside an SVG |
| `css-container-query` | `@container` for self-adapting widget layout |
| `css-3d-transform` | `perspective` + `rotateX/Y` for layered structural diagrams |
| `view-transition-api` | `document.startViewTransition()` for state-swap animations |

### Data display + UI patterns

| Snippet id | One-line purpose |
|---|---|
| `matter-of-fact-table` | Spectral + tabular-nums data table; optional sortable JS |
| `tab-switcher-pure-css` | Tabs via `:has()` + radio inputs (no JS) |
| `tooltip-popover-anchor` | Hover-detail using CSS anchor positioning |
| `before-after-slider` | Two figures overlaid; drag divider to reveal diff |
| `timeline-scrubber` | Horizontal time axis with draggable scrub handle |
| `stack-cards-svg-fallback` | N-item stack with HTML cards (mobile) + SVG diagram (desktop) — RWD-safe alternative to `data-svg-scroll` for discrete-item widgets |

Detailed pages: all live under `tier-2-snippets/<id>.md`.

## Picking guidance by archetype

| Archetype | Typical hero choice | Typical Tier-2 supports |
|---|---|---|
| `narrative` | annotated-diagram-walkthrough OR mini-canvas-simulation | tab-switcher-pure-css, timeline-scrubber, intersection-observer-reveal |
| `technical-deep-dive` | annotated-diagram-walkthrough | css-3d-transform, tab-switcher-pure-css |
| `investigation` | interactive-param-demo OR data-driven-chart | range-input-binding, matter-of-fact-table |
| `comparison` | data-driven-chart | matter-of-fact-table, before-after-slider |
| `explainer` | interactive-param-demo OR mini-canvas-simulation | range-input-binding, canvas-2d-loop |
| `freeform` | any | any |

The mapping is suggestive, not normative. Pick what fits the story.

## Mandatory feedback loop

This cookbook evolves monthly based on what works. After each daily
publish, the sidecar's `widget_templates` field records which template
fired. The monthly audit (per spec section 8) mines this to surface
underused templates, missing capabilities, and weak conceptual
questions. Adjust cookbook content accordingly.

## When no template fits cleanly

The cookbook is suggestions, not commandments. If a story genuinely
needs a widget shape that none of these templates produces, write a
custom widget and still record a conceptual question for it. Free
shape > forced fit. (Same principle as `freeform` archetype.)

But: before going custom, double-check you've understood the existing
templates. The cookbook covers a wide enough surface that custom
widgets should be rare.
