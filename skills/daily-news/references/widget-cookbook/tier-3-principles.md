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

- **Widget density ≥ 1.2 widgets per 1000 CJK chars** of prose.
  - 4000-char post → 5 widgets
  - 5000-char post → 6 widgets
  - 6000-char post → 7-8 widgets
  - 7000-char post → 8-9 widgets
  - The longer the post, the more widgets it needs. A 7000-char post
    with 3 widgets is a wall of text with token decoration; the
    contract requires it to either grow widgets or trim prose.
- **Hard floor: ≥ 5 widgets total per deep-story**, regardless of length.
- **≥ 1 must be a Tier 1 hero widget** with genuine interaction (input,
  drag, canvas loop, scroll-driven, or sortable data).
- **Each widget carries a conceptual question** recorded in the sidecar
  JSON's `widget_questions` array.
- **Prose ≥ 4000 CJK chars** (see §11 for "density > length"). Widget
  code (inside `<script>`, `<style>`, `<svg>`, `<canvas>`) does NOT
  count toward this floor.

The previous contract said "≥ 3 widgets" — sub-agents read this as a
target rather than a floor and stopped at 3-4, producing prose-heavy
posts. The density rule binds widget count to prose length so a post
can never grow to wall-of-text shape.

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

## 10. Test in dark mode + mobile + keyboard

Before declaring a widget done, mentally verify:

- Does every `stroke`/`fill` use a `var(--token)` so dark mode works?
- Does the widget reflow / clip gracefully at 375px viewport?
- Are tap targets ≥ 32px square on mobile?
- Does the widget make sense without colour (colour-blind reader)?
- **Keyboard a11y**: every clickable element (SVG `<rect>`, `<g>` with click
  handler, any non-native interactive) must have `role="button"`,
  `tabindex="0"`, `aria-label`, AND a `keydown` listener that triggers the
  same click action on Enter/Space. SVG elements aren't keyboard-accessible
  by default — without these four, sighted-mouse-only readers work, but
  keyboard / screen-reader users can't interact at all.

Example for an SVG clickable `<rect>`:

```html
<rect class="component" data-target="…-r1" role="button" tabindex="0" aria-label="select Router" x="…" y="…" width="…" height="…" />
```

```js
rect.addEventListener('click', () => { /* set radio.checked */ });
rect.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    rect.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
});
```

The Step 8.5 Playwright self-review catches some of this, but the author
should catch it first.

## 11. Density > length

The prose floor is 4000 CJK chars (≈ 1300 中文字 ≈ 5-7 分鐘讀完). This is a
*floor*, not a target. **Do not write to a length quota.** A 4500-char
post with 4 high-density widgets answering 4 sharp conceptual questions
beats an 8000-char post that hits the same target but pads with
meta-reflection and "why this matters" repetition.

Signs you're padding for length:

- A paragraph that restates what the previous paragraph just said
- "Meta" framing ("this section was about X, the next section will be about Y")
- "Why this is important" without adding new information
- Re-explaining what the widget right above already showed
- Listing 7 takeaways when 3 cover the substance

If you find yourself writing these to hit the floor, **stop and cut a
widget instead** — fewer high-density widgets often produces a tighter,
more informative post than more widgets with thin prose between them.
The contract requires ≥ 3 widgets; nothing forces more.

Reference points for "right length":

- Bartosz Ciechanowski's `ciechanow.ski` posts: ~8000-12000 English words, 30-50 widgets — extreme density, extreme craft
- Distill.pub article: ~4000-8000 English words, 5-15 widgets — middle ground
- vatt'ghern deep-story target: ~4000-6000 CJK chars, 3-5 widgets — what we ship daily

If your post is creeping past 6000 CJK chars, ask: is every paragraph
earning its place? If 20% could be cut without losing substance, cut it.

## 12. Mobile layout contract

Every widget MUST work at **375px viewport width** (iPhone SE / small
phone). Sub-agents repeatedly default to desktop-only patterns that
silently break on mobile: sticky in 2-column grids that hide the
sticky element below the fold; tap targets too small for fingers;
canvas aspect ratios that crush detail; scroll-driven widgets that
go inert because the observer margin doesn't match phone viewport
height.

### 12.1 Required patterns

**A. Two-column grids collapse to one column at ≤720px**

```css
.vg-w-EXAMPLE { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-3); }
@media (max-width: 720px) {
  .vg-w-EXAMPLE { grid-template-columns: 1fr; }
}
```

**B. `position: sticky` in 2-col grid: at mobile, flip to sticky-top**

Desktop layout `[prose | sticky figure]` works: reader scrolls prose
on the left, the figure on the right stays put and updates as stages
activate. At mobile the grid collapses — `.stages` ends up *above*
`.figure-sticky` in source order, which means the figure sits below
the entire scroll-driven narrative and never gets seen until after
all the stage prose has scrolled past. The scroll-driven mechanism
becomes pure decoration.

**Wrong** (what we previously recommended):

```css
@media (max-width: 720px) {
  .vg-w-EXAMPLE .figure-sticky { position: static; }   /* breaks scroll-driven */
}
```

**Right** — pin the figure to the *top* of the viewport at mobile,
re-order it above the stages with `order: -1`, and cap its height to
~50vh so the prose underneath still has reading space:

```css
.vg-w-EXAMPLE .figure-sticky { position: sticky; top: var(--s-4); }
@media (max-width: 720px) {
  .vg-w-EXAMPLE { grid-template-columns: 1fr; }
  .vg-w-EXAMPLE .figure-sticky {
    position: sticky;
    top: var(--vg-header-h);   /* offset below the sticky site chrome (~100px) */
    order: -1;                 /* lift figure above stages */
    max-height: 55vh;
    background: var(--bg);     /* opaque so prose underneath doesn't bleed through */
    z-index: 1;
    padding: var(--s-2) 0;
    margin-bottom: var(--s-2);
  }
  .vg-w-EXAMPLE .figure-sticky svg { max-height: 50vh; }
}
```

This is the standard "scrollytelling" pattern used by Distill.pub /
Pudding / NYT Interactive: figure pinned just below the site header,
prose scrolls below, figure updates as stages activate (via
IntersectionObserver per §12.1.E).

The `--vg-header-h` CSS variable is defined in `src/static/site.css`
(~100px). Using `top: 0` puts the figure *behind* the sticky site
chrome (vatt'ghern site header is `position: sticky; top: 0; z-index: 50`)
and its top half disappears under the header.

**C. Tap targets ≥ 44×44 px (Apple HIG) on mobile**

`range` input thumbs default to ~16px — too small. Either set
explicit height on the input or use `accent-color` with a larger
custom thumb. Slider tracks at ≥32px height. Buttons at ≥44px square.
SVG clickable rects at ≥44px in CSS pixels (not viewBox units —
account for SVG scale).

```css
.vg-w-EXAMPLE input[type="range"] { height: 36px; accent-color: var(--accent); }
.vg-w-EXAMPLE button { min-height: 44px; min-width: 44px; padding: var(--s-1) var(--s-2); }
```

**D-pre. SVG viewBox aspect: avoid 4:1+ for chart-shaped widgets**

A widget authored with `viewBox="0 0 880 200"` (4.4:1) looks good at
desktop where the figure is ~960px wide and the SVG is ~218px tall —
labels readable, axis ticks visible. At mobile (~343px wide), the same
viewBox renders at ~78px tall. Labels collide. Axes overlap. Charts
become unreadable.

**Guidance**: for any widget where labels need to be readable inside
the SVG (charts, timelines, scrubbers, annotated diagrams), prefer
viewBox aspect ratio between **2:1 and 3:2** (e.g., `0 0 720 320`,
`0 0 480 280`, `0 0 640 360`). Reserve wider aspects (4:1+) for
widgets where the SVG content is genuinely a wide strip (e.g., a
horizontal timeline with sparse markers and no per-marker text inside
the SVG — text goes in a stage panel beside it).

If a wide viewBox is already authored, the mobile crush can be
mitigated three ways (least to most invasive):
1. Add `preserveAspectRatio="xMidYMid slice"` to crop instead of
   letterbox at narrow widths
2. Add a `@media (max-width: 720px)` rule: `.vg-w-X svg { min-height: 220px }`
   plus explicit `max-height: 50vh` to bound height growth
3. Re-author with a taller viewBox (2:1 or 3:2 aspect)

**D-bis. SVG `<text>` doesn't wrap — budget char count per labelled box**

Unlike HTML, SVG `<text>` has no word-wrap behaviour by default; long
strings render as a single line and overflow whatever rect / annotation
container they were intended to label. PR #30 hit this in the
`vg-w-annotated-fides-stack` widget: four side-by-side rects of width
180 SVG units each held labels like
`security_label{integrity, confidentiality}` (42 chars at 11 px
JetBrains Mono ≈ 250 SVG units). The label from box 1 ran straight
through into box 2, visually merging four boxes into one illegible
strip.

**Char-width budget**: for a labelled rect of width W SVG units with
font-size F (px), a monospace label fits roughly
`W / (F × 0.6)` chars before overflow. A proportional font is ~10-15%
narrower per char.

| rect width | font-size | safe chars (mono) | safe chars (proportional) |
|---|---|---|---|
| 120 | 11 | ~18 | ~22 |
| 180 | 11 | ~27 | ~33 |
| 180 | 13 | ~23 | ~28 |
| 240 | 11 | ~36 | ~44 |
| 320 | 11 | ~48 | ~58 |

**Fix priorities** when a label exceeds the budget:

1. Shorten the label (drop redundant qualifiers — `security_label{...}`
   is fine; `security_label{integrity, confidentiality}` is too long).
2. Drop font-size by 1–2 px IF the resulting effective px on mobile
   stays ≥ 11 (see design-system § Mobile legibility floor).
3. Move the label OUTSIDE the rect (above / below) where it has the
   full SVG width to breathe.
4. Wrap manually with multiple `<text>` elements stacked by y.

**Do not** rely on `<foreignObject>` for wrapping — it works but is a
heavy hammer for what is usually a labelling discipline issue.

**Invariant** (caught by Step 8.5 mechanical check):
`text.getBBox().right` MUST NOT exceed the bounding `<rect>`'s right
edge by more than 2 SVG units. Same for siblings — label from box N
must not cross into box N+1's bbox.

**D. Canvas / SVG aspect-ratio adjusts at mobile**

Desktop 16:9 canvas (e.g., queue simulation) crushes to ~211px tall
at 375px viewport — labels overlap, animation cramped. Switch to a
taller aspect-ratio at mobile:

```css
.vg-w-EXAMPLE canvas { aspect-ratio: 16 / 9; }
@media (max-width: 720px) {
  .vg-w-EXAMPLE canvas { aspect-ratio: 4 / 3; }
}
```

**E. Scroll-driven explanation: IntersectionObserver rootMargin must
account for phone viewport**

Desktop `rootMargin: '-40% 0px -40% 0px'` gives a ~20vh activation
band. On 667px-tall mobile that's only ~133px — narrower than most
stage sections, so nothing activates between stages. Use viewport-
relative units that scale:

```js
const isMobile = window.matchMedia('(max-width: 720px)').matches;
const margin = isMobile ? '-50% 0px -40% 0px' : '-40% 0px -40% 0px';
const io = new IntersectionObserver(callback, { rootMargin: margin, threshold: 0 });
```

**F. before-after-slider divider: at least 32px hit area**

The visible divider line can be 2px; the *invisible* drag handle area
around it should be ≥32px wide for finger drag. Wrap the line in a
transparent grab strip:

```html
<div class="divider" style="position: absolute; top: 0; bottom: 0; width: 32px; transform: translateX(-50%); cursor: ew-resize; touch-action: none;">
  <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; transform: translateX(-50%); background: var(--accent);"></div>
</div>
```

**G. Tables: enable horizontal scroll at mobile, never let columns crush**

```css
.vg-w-EXAMPLE { overflow-x: auto; }
.vg-w-EXAMPLE table { min-width: 480px; }
```

A horizontally scrollable table beats a crushed-unreadable one.

### 12.2 Anti-patterns specific to mobile

- **`<input type="range">` without `touch-action: none`** — page scrolls when user tries to drag
- **`width: 480px` or any fixed pixel width** — never use; always `width: 100%` with `max-width` constraint
- **`@media (max-width: 480px)`** — too narrow a breakpoint; 720px catches more phones (and small tablets in portrait)
- **Hover-only affordances** — phones don't hover; expose via tap or always-visible
- **font-size below 14px** — unreadable on phones
- **`viewBox="0 0 480 200"`** — too narrow; SVG widgets should use 720+ width viewBox so labels have room when scaled down
- **`<figure ... style="margin: ...">` inline style** — NEVER set `margin` (or any horizontal margin) inline on a `<figure>`. Site CSS uses `margin-left: calc(50% - 50vw + var(--gutter))` on mobile to break the figure out of the prose column so SVG widgets fill the viewport. Inline styles have higher specificity and clobber this, leaving the figure shifted left with a gap on one side and the widget touching the opposite viewport edge. Put vertical spacing inside the widget's own `<style>` block keyed to `.vg-w-NAME { margin: var(--s-4) 0; }` if you must — but ideally rely on site.css's `margin-top/bottom: var(--s-4)` defaults and write nothing.

### 12.3 Self-check before declaring DONE

Resize your dev-server browser to 375px and scroll through. For each
widget verify:

1. Does it visibly render? (not 0×0, not clipped to invisibility)
2. Do interactive controls accept finger taps? (no 16px slider thumbs)
3. Is text legible? (≥14px on screen)
4. Does the widget make sense without horizontal scroll? (or does it scroll cleanly when needed)
5. For scroll-driven: do stages activate as you scroll? (not all-inert because rootMargin too tight)
6. **Figure horizontal symmetry**: at 375px viewport, the figure's left
   edge gap to viewport and right edge gap to viewport should match
   (typically ~16px each side). If `left=32, right=0` or vice versa,
   site.css's `margin-left: calc(...)` was clobbered — usually by an
   inline `style="margin: ..."` declaration (see §12.2). Measure with:

   ```js
   // Neutralize Playwright's simulated scrollbar gutter (mobile has overlay scrollbar = 0px)
   document.documentElement.style.overflow = 'hidden';
   document.body.style.cssText = 'overflow: auto; width: 100vw; max-width: 100vw;';

   // Select all post figures, not just ones with vg-w- on figure itself
   // (some widgets put vg-w- on inner svg/div; figure tag is bare)
   document.querySelectorAll('.vg-post-prose figure, .vg-post-body figure').forEach(f => {
     const r = f.getBoundingClientRect();
     const L = Math.round(r.left);
     const R = Math.round(window.innerWidth - r.right);
     const id = f.className || f.querySelector('[class*="vg-w-"]')?.className || '?';
     console.log(id, 'L=', L, 'R=', R, 'diff=', Math.abs(L-R));
   });
   ```

   Both numbers must be equal (within 1px). Don't trust visual judgement —
   a 32px asymmetry is easy to miss until someone overlays a centerline.
   Without the scrollbar-gutter neutralization above, Playwright reports a
   spurious 7.5–15px diff that doesn't exist on real mobile devices.

If any answer is "no", fix in the widget's own scoped CSS — do not
defer to "we'll fix mobile later". Mobile is half the readers; "later"
is "never".
