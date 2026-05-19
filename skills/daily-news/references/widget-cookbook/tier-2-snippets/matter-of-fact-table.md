# Tier 2 — Matter-of-Fact Table

> Data tables with Spectral serif headers, tabular numerals, and
> minimal chrome. Optional client-side sortable.

## When to use

- Side-by-side comparison of 3-8 options across 3-6 attributes
- Benchmark results (system, p50, p99, memory)
- Truth table / configuration matrix

## Complete snippet (paste-and-tweak)

```html
<figure class="vg-w-table-EXAMPLE">
  <style>
    .vg-w-table-EXAMPLE table { width: 100%; border-collapse: collapse; font-family: var(--serif); font-size: var(--fs-sm); }
    .vg-w-table-EXAMPLE thead th { font-family: var(--sans); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.05em; text-align: left; padding: var(--s-1) var(--s-2); border-bottom: 1.5px solid var(--ink); color: var(--muted); cursor: pointer; user-select: none; }
    .vg-w-table-EXAMPLE thead th[data-sort] { color: var(--accent-text); }
    .vg-w-table-EXAMPLE tbody td { padding: var(--s-1) var(--s-2); border-bottom: 1px solid var(--line); }
    .vg-w-table-EXAMPLE td.num { font-variant-numeric: tabular-nums; text-align: right; }
  </style>
  <table>
    <thead>
      <tr>
        <th data-key="name">option</th>
        <th data-key="p50" class="num">p50</th>
        <th data-key="p99" class="num">p99</th>
        <th data-key="mem" class="num">mem</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>A</td><td class="num">12.4</td><td class="num">87.0</td><td class="num">120</td></tr>
      <tr><td>B</td><td class="num">11.9</td><td class="num">82.1</td><td class="num">130</td></tr>
      <tr><td>C</td><td class="num">10.7</td><td class="num">23.4</td><td class="num">180</td></tr>
    </tbody>
  </table>
  <script>
    (function () {
      const root = document.querySelector('.vg-w-table-EXAMPLE');
      const headers = root.querySelectorAll('thead th');
      const tbody = root.querySelector('tbody');
      let activeKey = null, asc = true;
      headers.forEach(h => h.addEventListener('click', () => {
        const key = h.dataset.key;
        if (activeKey === key) asc = !asc; else { activeKey = key; asc = true; }
        headers.forEach(x => x.removeAttribute('data-sort'));
        h.setAttribute('data-sort', asc ? 'asc' : 'desc');
        const rows = [...tbody.querySelectorAll('tr')];
        const idx = [...headers].indexOf(h);
        rows.sort((a, b) => {
          const av = a.children[idx].textContent.trim();
          const bv = b.children[idx].textContent.trim();
          const an = Number(av), bn = Number(bv);
          const cmp = !Number.isNaN(an) && !Number.isNaN(bn) ? an - bn : av.localeCompare(bv);
          return asc ? cmp : -cmp;
        });
        rows.forEach(r => tbody.appendChild(r));
      }));
    })();
  </script>
</figure>
```

## Gotchas

- **Tabular numerals** (`font-variant-numeric: tabular-nums`) keep
  digit widths consistent — critical for vertically-aligned numbers.
- **Right-align numerics** for visual scan; left-align text columns.
- **Don't sort by default** — let the reader pick. If you must
  pre-sort, mark the column so the reader knows.
- **Skip sortable** if there are ≤ 5 rows — sorting adds chrome
  without value.
- **Keep header chrome quiet** — uppercase Manrope at fs-xs with
  letter-spacing reads as "header" without screaming.
