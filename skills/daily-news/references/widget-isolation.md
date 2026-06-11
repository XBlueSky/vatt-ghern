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

## Catalog widgets (reusable, summoned via `{% widget %}`)

Beyond inline figures (authored fresh per post), vatt-ghern has reusable
**catalog widgets** that any post can summon with `{% widget "name" %}`. The
list of available catalog widgets lives in `widget-catalog.md` (auto-generated
from the sidecars — read it during deep-story authoring, step 5.5). A catalog
widget is three files:

- `src/_includes/widgets/<name>.njk` — partial: one `<style>` block (every
  selector prefixed `.vg-w-<name>`), markup wrapped in `.vg-w-<name>__shell`,
  affordance hint as first child, **no `<script>`**.
- `src/static/widgets/<name>.js` — IIFE with guard
  `window.__vgWidget_<name>__bound`, `init(root)` per instance, per-instance
  state deep-copy (`INITIAL.map(...)`), `root.querySelector*` only. Target the
  main SVG via `svg.vg-w-<name>-main`, never bare `querySelector('svg')` (the
  first child is the affordance icon — same trap as Rule "Selector gotcha").
- `src/_includes/widgets/<name>.widget.json` — sidecar: `name`, `title`,
  `summary`, `suits`, `interactive`, `instance_state`, `key_idioms`.

The `{% widget %}` shortcode wraps the partial in
`<figure class="vg-w-<name>" data-widget data-pagefind-ignore>` and injects a
deduped `<script src="/static/widgets/<name>.js" defer>` once per page. The
`vg-w-<name>` class means catalog widgets are counted by the ≥5-widget enforcer
in `tests/archetype-check.mjs`, and the injected script satisfies the
≥1-interactive rule — summoning a catalog widget never makes a post fail the
contract. In the sidecar, a summoned catalog widget is recorded in
`widget_templates` as `catalog:<name>`; `tests/archetype-check.mjs` verifies that
reference resolves to a real trio.

After adding or editing a catalog widget, run `npm run widgets:catalog` to
refresh `widget-catalog.md`. Inspect any catalog widget in isolation at
`/widget-tests/<name>/` (renders it twice for an independence check). Browse all
catalog widgets and cookbook demos at `/widgets/`. The structural contract for a
catalog widget is enforced by `tests/widget-catalog-check.mjs`.

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

## Allowed JS toolkit (D-mode sandbox)

The previous rules ("Rule 3: JS as IIFE", "Rule 6: no external assets")
state what is BANNED. This section states what is AFFORDED. Sub-agents
should not self-censor inside these allowances.

### DOM access (scoped to widget root)

- `document.querySelector` / `document.querySelectorAll` — prefer the
  widget root as the starting point (`root.querySelector(...)`)
- `element.addEventListener` — scoped to widget elements only;
  never `document.addEventListener` without filtering on target
- `element.appendChild`, `element.removeChild`, `element.replaceChild`
- `element.setAttribute`, `element.removeAttribute`
- `element.classList.add` / `remove` / `toggle`
- `element.style.setProperty('--name', value)` for CSS custom property writes

**Selector gotcha — DO NOT use `root.querySelector('svg')` blindly**
(added 2026-05-21 after PR #30 scrubber bug). Interactive figures now
carry an inline `<p class="vg-w-affordance"><svg>` as the first child
(see `design-system.md` § Interactive-affordance hint), so a bare
`querySelector('svg')` will return the **14×14 lucide affordance
icon** instead of the figure's main SVG. Always target the main SVG
with an explicit class or id:

```html
<svg class="vg-w-foo-main" viewBox="0 0 720 360"> ... </svg>
```

```js
const svg = root.querySelector('svg.vg-w-foo-main');
// OR target a child you'll mutate by id instead, never the svg itself
const axes = root.querySelector('#vg-w-foo-axes');
```

Same applies to `querySelector('p')`, `querySelector('img')` etc. for
the same reason — the affordance hint always renders first.

### Rendering primitives

- Canvas 2D context (`canvas.getContext('2d')`) and its drawing methods
- SVG namespace creation via
  `document.createElementNS('http://www.w3.org/2000/svg', tag)`
- Direct SVG attribute manipulation
- CSS custom property reads (`getComputedStyle(el).getPropertyValue(...)`)

### Calculation + data

- All of `Math.*`, `Array.*` methods (`map`, `filter`, `reduce`, `sort`)
- `Map`, `Set`, plain object literals
- `JSON.parse`, `JSON.stringify`
- `Number.isFinite`, `Number.isNaN`, `Number.parseFloat`

### Timing / async

- `requestAnimationFrame` (prefer over `setInterval`)
- `setTimeout` (with bounded delay, e.g., ≤ 60s)
- `Promise` for sequencing
- `await` inside an async IIFE (`(async () => { ... })()`)

### Observers

- `IntersectionObserver`
- `ResizeObserver`
- `MutationObserver` (rare; usually not needed)

### Pointer / input

- `pointerdown` / `pointermove` / `pointerup` (unify mouse + touch)
- `setPointerCapture` for drag tracking outside element bounds
- `wheel` (with `preventDefault` only inside the widget)
- `keydown` (scoped to focused widget elements, e.g., a focused `<button>`)

### Explicitly banned

- `fetch`, `XMLHttpRequest` (widgets are static; no network)
- `eval`, `new Function(...)`
- `document.write`
- `<script src="...">` (external CDN load — see Rule 6)
- ES module `import` (no CDN, no inline modules with imports)
- `window.X = ...` (no globals — see Rule 3)

## Allowed CSS toolkit (modern features safe to use)

- `@container` (container queries) — see Tier-2 snippet `css-container-query`
- `:has()` selector — broadly supported in 2026
- `@scroll-timeline` / `animation-timeline: scroll()` — provide
  `@supports not` fallback
- `view-transition-name` + `::view-transition-*` pseudo-elements
- `anchor-positioning` — provide fallback
- CSS custom properties for interpolated values
- `clip-path: polygon(...)` and `inset()`
- `aspect-ratio`
- `accent-color`

## Per-widget budget (soft limits)

If a single widget exceeds these, split into two widgets:

- Inline JS: ~250 lines (including comments)
- Inline CSS (in `<style>`): ~150 lines
- Inline SVG markup: ~300 lines

The budget reflects "one widget = one conceptual question". Widgets
that exceed the budget usually try to answer multiple questions and
benefit from being split.

## Post-level `<style>` block — limited allowance

Previously banned in `design-system.md` (Anti-patterns section).
**Updated rule**: each widget MAY emit one post-level `<style>` block
IFF every selector starts with `.vg-w-<widget-id>`. This enables:

- Grid layouts that don't fit inside an SVG `<style>`
- Container queries (`@container` cannot live inside an SVG)
- View-transition-name on non-SVG elements

Example (allowed):

```html
<figure class="vg-w-chart-foo">
  <style>
    .vg-w-chart-foo { display: grid; gap: var(--s-2); }
    .vg-w-chart-foo .controls { display: flex; gap: var(--s-2); }
    .vg-w-chart-foo svg { width: 100%; height: auto; }
  </style>
  <!-- ... -->
</figure>
```

Example (banned — leaks beyond widget):

```html
<style>
  figure { display: grid; }     /* affects all <figure> on the page */
  .controls { display: flex; }  /* affects any .controls, anywhere */
</style>
```

The `tests/archetype-check.mjs` enforcer rule changes from "any
post-level `<style>` is a failure" to "any selector in a post-level
`<style>` that does not start with `.vg-w-` is a failure".

## Canvas sizing (DPR-aware)

For `<canvas>` elements:

```html
<canvas style="width: 100%; height: auto; aspect-ratio: 16/9"></canvas>
<script>
  (function () {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    new ResizeObserver(resize).observe(canvas);
    resize();
  })();
</script>
```

CSS controls the display size; JS sets the backing-store size to
`displaySize × devicePixelRatio` for crisp rendering on retina screens.

## Mobile layout — required patterns

Every widget MUST work at 375px viewport. See tier-3-principles §12 for
the full Mobile Layout Contract. The mandatory patterns are:

1. **Two-column grids collapse at ≤720px** — `@media (max-width: 720px) { .vg-w-X { grid-template-columns: 1fr } }`
2. **`position: sticky` drops at mobile** — `@media (max-width: 720px) { .vg-w-X .figure-sticky { position: static } }`
3. **Tap targets ≥ 32px** — range inputs `height: 36px`, buttons `min-height: 44px`, drag handles wrapped in 32px-wide hit areas
4. **Canvas aspect-ratio adjusts at mobile** — `@media (max-width: 720px) { canvas { aspect-ratio: 4/3 } }` (was 16/9 at desktop)
5. **Scroll-driven IntersectionObserver rootMargin scales with viewport** — `isMobile ? '-25%' : '-40%'`
6. **`touch-action: none` on draggable elements** — prevents page scroll fighting your drag
7. **Tables `overflow-x: auto` + `min-width: 480px`** — better to scroll horizontally than to crush columns

The `tests/archetype-check.mjs` enforcer does not yet test these
mechanically (no headless mobile rendering). The author is responsible
for self-checking at 375px in dev tools or Playwright before declaring
DONE. See anti-examples §F4-F6 for common mobile breaks to avoid.

## Mobile summary contract (data-mobile-summary)

Interactive widgets are desktop-only. On coarse-pointer devices (phones,
tablets) the build hides every `vg-w-*` figure and shows an auto-injected
summary card instead (`scripts/mobile-card-transform.mjs`). Author
obligations — enforced by `tests/archetype-check.mjs`:

1. Every `<figure class="vg-w-...">` MUST carry `data-mobile-summary`，
   20–80 字。寫這個 widget 要傳達的 takeaway（結論本身），不是外觀描述。
   手機讀者只會看到這句話。禁用半形冒號、Latin em-dash 與半形雙引號
   （要引用就用「」；archetype-check 與 build 都會以字元長度檢查）。
   CJK 雙破折號「——」（成對）與 Latin 程式碼內的半形冒號（如 `std::sort`、`13:43`）不在禁用範圍；禁的是緊鄰 CJK 的單個半形冒號與單個 Latin em-dash。
   GOOD: `data-mobile-summary="同樣 1000 token，diffusion 八次迭代全部出齊，autoregressive 要走 1000 步，吞吐量差距由此而來。"`
   BAD:  `data-mobile-summary="本圖以滑桿展示去噪過程的動畫效果。"`（外觀描述，讀者學不到結論）
2. 純靜態、無互動、小螢幕可讀的 figure 可用 `data-mobile="keep"` 退出
   置換（figure 在觸控裝置照常顯示，不注入卡片）。
3. Widget JS 不得在觸控裝置初始化。IIFE 第一行：
   `if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;`
4. 不要手寫 `.vg-mobile-card` / `.vg-mobile-notice` markup——它們由 build
   注入，手寫會造成重複。
5. 互動 widget 必須以 `<figure class="vg-w-...">` 包裹才會參與 mobile 置換；`<div class="vg-w-...">` 形式的 widget（如 tabs）不會被換成摘要卡，會在觸控裝置上原樣顯示，也不受本契約檢查。新 widget 一律用 `<figure>`。
