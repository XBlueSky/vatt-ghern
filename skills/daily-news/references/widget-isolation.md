# Widget Isolation Contract

Inline SVG widgets in posts share the page DOM with the site chrome and with
each other. Without discipline, two widgets on the same page (or one widget
crossing post pages) can collide via CSS specificity, ID collisions, or JS
global namespace pollution. This document defines the contract.

## Rules

### 1. Scope CSS by class prefix, never bare element selectors

If a widget needs custom styling beyond what `site.css` provides:

✅ OK: scope all rules under a per-widget class prefix.

```html
<svg class="vg-w-timeline-io-uring">
  <style>
    .vg-w-timeline-io-uring text { font-family: EB Garamond, serif; }
    .vg-w-timeline-io-uring circle { stroke-width: 1.5; }
  </style>
  <!-- ... -->
</svg>
```

❌ Bad: bare element selectors leak everywhere.

```html
<svg>
  <style>
    text { font-family: EB Garamond, serif; }  /* affects EVERY text in the document */
  </style>
</svg>
```

### 2. ID attributes must be unique across the page

Two SVGs on the same page each define `<defs><marker id="arrow">...</marker></defs>`,
the second one silently breaks because the first wins. Prefix IDs with the
widget instance id:

```html
<svg>
  <defs>
    <marker id="vg-w-timeline-io-uring-arrow" ...>...</marker>
  </defs>
  <line marker-end="url(#vg-w-timeline-io-uring-arrow)" />
</svg>
```

### 3. JS, if any, runs as IIFE — no globals

Avoid JS in widgets when possible. Phase 1 / 2 widgets are static SVG +
CSS. If interaction is genuinely needed (e.g., a "before / after" slider):

```html
<div class="vg-w-slider-async-engine">...</div>
<script>
(function () {
  const root = document.querySelector('.vg-w-slider-async-engine');
  // ...
})();
</script>
```

No `window.X = ...`. No `document.addEventListener('click', ...)` without
narrowly scoping target.

### 4. Prefer `currentColor` + design tokens over hardcoded values

Already covered in `design-system.md`. Reiterated here because widgets are
the most likely place for someone to drop in a `stroke="#ff6b35"` and break
dark mode.

### 5. ViewBox sizing — design for the desktop breakout width

Deep-story figures render inside `<figure>`, which breaks out of the
prose column on desktop. Current caps:

| Viewport | `<figure>` width |
|---|---|
| ≥1280 px | up to 960 px |
| 900-1279 px | up to 880 px |
| <900 px (mobile) | viewport-1× gutter (essentially full screen) |

Pick viewBox aspect + size for these widths. Common shapes:

- **Timeline / sequence (wide-flat)**: `viewBox="0 0 720 200"` or
  `0 0 880 240`. Lets time labels and event circles space out.
- **Architecture (wider, taller)**: `0 0 720 320` or `0 0 880 360`.
  Boxes + arrows for 3-6 components.
- **Bar chart / metric viz**: `0 0 720 240` or `0 0 880 280`. Y-axis
  labels need room.
- **Comparison row-of-cells**: `0 0 880 200` so each cell stays >100 px
  wide at desktop.

Avoid `0 0 480 200` and similar narrow viewBoxes inherited from older
posts — they leave half the available width empty on desktop.

Inline `<text>` element font-size should account for the rendered
width: at 960 px wide with `viewBox="0 0 880 …"`, a `font-size="14"`
text node renders ~15.3 px on screen — fine for labels but small for
chart titles. Use `font-size="16"` or `18` for titles, `12-14` for
labels.

### 6. No external assets

No `<image href="https://external.cdn/...">`, no `@font-face` from external
URLs in widget CSS, no `<script src="https://cdn...">`. Widgets stay
self-contained.

## Naming convention

Widget class prefix: `vg-w-<widget-type>-<topic-slug>`. Examples:

- `vg-w-timeline-io-uring-cve`
- `vg-w-arch-cloudflare-dns-routing`
- `vg-w-bench-postgres-17-vacuum`
- `vg-w-donut-todays-domains`

The `<topic-slug>` keeps two posts using the same widget type (two
timelines on the same day) from colliding.

## When widgets need to share styles

If two widgets on the same page genuinely share styles (e.g., the same
typography), put the shared rules in `site.css` under a generic class
(`.vg-w-shared-axis-text` or similar), and reference from each widget. Do
NOT have widget A's `<style>` define rules widget B depends on.

## Test enforcement

`tests/archetype-check.mjs` greps for:

- `style="` outside of SVG element (banned)
- `<style>` blocks without a `vg-w-*` selector prefix on every rule (banned)
- IDs that match `^[a-z]+-[0-9]$` without `vg-w-` prefix (warning — possible
  collision)
- `<script>` tags with `src=` attribute (banned in posts; bare script
  blocks allowed if IIFE)
