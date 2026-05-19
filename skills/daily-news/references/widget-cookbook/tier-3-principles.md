# Tier 3 — Design Principles (mindset)

> Required reading for every deep-story sub-agent before authoring widgets.
> Without this file, the cookbook produces "things that move" instead of
> "things that teach". The cookbook templates are the *what*; this file is
> the *why*.

## 1. Every interactive widget answers a conceptual question

The question takes a fixed shape:

- "How sensitive is X to Y?" (parameter sweep)
- "Why is A slower than B?" (mechanism comparison)
- "What happens at step N when it fails?" (state-space probing)
- "What does the dynamic behaviour look like over time?" (animation)
- "Which component owns this responsibility?" (architecture walk)

**Write the question before writing the widget.** If you cannot phrase the
question in one sentence, the widget should not exist. The question goes
into the sidecar JSON's `widget_questions` array — every widget you ship
contributes one entry.

## 2. Information density > visual flourish

A single dense diagram showing six related variables beats six animations
each showing one. Tufte's data-ink ratio applies: every pixel that doesn't
encode data is overhead.

A widget that takes 100 lines of JS to wobble two boxes around is *worse*
than a 30-line static SVG that names all six components and labels the
flow between them.

## 3. Static first — interaction only when meaningful

Default target: this static SVG is Edward-Tufte-grade. Interaction earns
its place only when the *act of interacting* teaches a concept that the
static form cannot.

Counter-example: a "click to reveal more text" widget. The reveal is not
teaching anything — the text could just be there. Either show the text,
or design an interaction that lets the reader *manipulate* the concept.

## 4. Conceptual handles, not buttons (Ciechanowski)

When the reader manipulates a widget, the feeling should be "I am directly
manipulating the concept itself", not "I am pressing buttons that trigger
animations".

- Bad: `[Next step ▸]` button that advances a 5-step animation.
- Good: A draggable packet that you slide along a network path, and the
  surrounding state updates as the packet moves.

If you find yourself adding a "next" button, ask: what's the underlying
continuous variable, and can I let the reader drag *that*?

## 5. Delete default animations

No fade-ins, no entrance transitions, no easings unless tied to a
conceptual question. The browser's default animation aesthetic (300ms
ease-out everything) is noise.

Animation belongs where time is the variable: showing how a queue fills
up, how a congestion window grows, how a build graph traverses.

## 6. Per-deep-story widget budget

- **≥ 3 widgets total per deep-story.**
- **≥ 1 must be a Tier 1 hero widget** with genuine interaction (input,
  drag, canvas loop, scroll-driven, or sortable data).
- **Each widget carries a conceptual question** recorded in the sidecar
  JSON's `widget_questions` array.
- **Prose ≥ 500 lines** (HTML inside `<p>`, `<h2>`, etc.). Widget code
  (inside `<script>`, `<style>`, `<svg>`, `<canvas>`) does NOT count
  against the prose budget — old "600-1200 lines of HTML" caused
  sub-agents to skimp on widget code to stay in budget.

## 7. The conceptual question is the spec

When you pick a Tier-1 template or Tier-2 snippet, you are picking a *form*.
The conceptual question is the *content*. The cookbook tells you "here is
how to make a draggable range input that drives a chart" — your job is to
decide what variable goes on the slider and what response curve goes on
the chart, by knowing what conceptual question the post is answering.

## 8. Anti-patterns to avoid (see anti-examples.md for full list)

- Hover changes colour but adds no information → decoration
- Three near-identical charts that differ only in colour → repetition
- Animation that is purely a fade-in or slide-in → noise
- "Chart" whose data is hardcoded values picked to look right → fake
- Slider whose range is 1-10 but only 3 values change behaviour → deception
- Widget that mirrors what the prose just said in pictures → redundant

## 9. When no template fits cleanly

The cookbook is suggestions, not commandments. If your story genuinely
needs a widget shape that none of the 5 Tier-1 templates produce, write a
custom widget and STILL record a conceptual question for it. Free shape
> forced fit. (Same principle as `freeform` archetype.)

## 10. Test in dark mode + mobile

Before declaring a widget done, mentally verify:

- Does every `stroke`/`fill` use a `var(--token)` so dark mode works?
- Does the widget reflow / clip gracefully at 375px viewport?
- Are tap targets ≥ 32px square on mobile?
- Does the widget make sense without colour (colour-blind reader)?

The Step 8.5 Playwright self-review catches some of this, but the author
should catch it first.
