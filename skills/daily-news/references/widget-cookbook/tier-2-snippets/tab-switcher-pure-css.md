# Tier 2 — Pure-CSS Tab Switcher

> Tabs using `:has()` + radio buttons. Zero JS. The selected tab's
> content is shown via CSS sibling/has selectors.

## When to use

- Show 2-5 alternative views of the same concept
- Hide secondary content behind labels (only when not redundant)
- "Code · diagram · prose" triple-view of a single idea

## Complete snippet (paste-and-tweak)

```html
<div class="vg-w-tabs-EXAMPLE">
  <style>
    .vg-w-tabs-EXAMPLE { display: grid; gap: var(--s-2); }
    .vg-w-tabs-EXAMPLE input[type="radio"] { position: absolute; opacity: 0; pointer-events: none; }
    .vg-w-tabs-EXAMPLE .tabs { display: flex; gap: var(--s-2); border-bottom: 1px solid var(--line); }
    .vg-w-tabs-EXAMPLE .tab { font-family: var(--sans); font-size: var(--fs-sm); padding: var(--s-1) var(--s-2); cursor: pointer; color: var(--muted); }
    .vg-w-tabs-EXAMPLE .panel { display: none; padding: var(--s-2); }
    .vg-w-tabs-EXAMPLE:has(#vg-w-tabs-EXAMPLE-t1:checked) .panel-1 { display: block; }
    .vg-w-tabs-EXAMPLE:has(#vg-w-tabs-EXAMPLE-t1:checked) [for="vg-w-tabs-EXAMPLE-t1"] { color: var(--accent-text); border-bottom: 2px solid var(--accent); }
    .vg-w-tabs-EXAMPLE:has(#vg-w-tabs-EXAMPLE-t2:checked) .panel-2 { display: block; }
    .vg-w-tabs-EXAMPLE:has(#vg-w-tabs-EXAMPLE-t2:checked) [for="vg-w-tabs-EXAMPLE-t2"] { color: var(--accent-text); border-bottom: 2px solid var(--accent); }
    .vg-w-tabs-EXAMPLE:has(#vg-w-tabs-EXAMPLE-t3:checked) .panel-3 { display: block; }
    .vg-w-tabs-EXAMPLE:has(#vg-w-tabs-EXAMPLE-t3:checked) [for="vg-w-tabs-EXAMPLE-t3"] { color: var(--accent-text); border-bottom: 2px solid var(--accent); }
  </style>
  <input type="radio" id="vg-w-tabs-EXAMPLE-t1" name="vg-w-tabs-EXAMPLE-sel" checked />
  <input type="radio" id="vg-w-tabs-EXAMPLE-t2" name="vg-w-tabs-EXAMPLE-sel" />
  <input type="radio" id="vg-w-tabs-EXAMPLE-t3" name="vg-w-tabs-EXAMPLE-sel" />
  <div class="tabs">
    <label class="tab" for="vg-w-tabs-EXAMPLE-t1">code</label>
    <label class="tab" for="vg-w-tabs-EXAMPLE-t2">diagram</label>
    <label class="tab" for="vg-w-tabs-EXAMPLE-t3">prose</label>
  </div>
  <div class="panel panel-1">code goes here</div>
  <div class="panel panel-2">diagram goes here</div>
  <div class="panel panel-3">prose goes here</div>
</div>
```

## Gotchas

- **All three views must add value** — if one is redundant with the
  surrounding prose, delete it.
- **`name` attribute on radios** must match across all in the group;
  use the widget id as the prefix to avoid collision with other
  widgets on the same page.
- **Don't use tabs when 2-3 things should be visible at once** —
  side-by-side is often better.
- **`:has()` browser support** is broad in 2026 (Chromium, Safari,
  Firefox). Safe.
