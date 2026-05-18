# Contributing

vatt-ghern is a personal blog, so external contributions are unusual —
but if you're forking the skill or proposing a fix, here's the
contract.

## Commit conventions

Conventional Commits. Scope is usually `daily-news`, sometimes
`product`, `docs`, `chore`. Examples:

```
feat(daily-news): cluster candidates by URL/title similarity
fix(deps): re-resolve lucide-static via public registry
docs(product): note parallel deep-story dispatch in pipeline section
chore(daily-news): warm sitemap-diff baseline
```

Run conventional types: `feat`, `fix`, `chore`, `docs`, `test`,
`refactor`, `perf`, `style`, `ci`.

## CJK typography rules (non-negotiable in post prose)

- **`——`** (CJK double em-dash) not `—` (Latin single).
  `archetype-check.mjs` enforces this in built post bodies.
- **`：`** (CJK full-width colon) not `:` inside CJK card titles.
  Lint catches it.
- **Latin technical terms stay un-translated**. `fsync()`, `io_uring`,
  `commit`, `cron` are English in flowing CJK prose. Don't transliterate.

## Quality gate

Every PR runs:

- `npm run build` — Eleventy must complete with zero warnings.
- `npm run lint:html` — html-validate on `_site/**/*.html`.
- `npm test` — `node --test tests/*.mjs` (sources registry, clustering,
  OG coverage, link check).
- `node tests/archetype-check.mjs _site/` — archetype structural rules.
- `node skills/daily-news/scripts/check-dup.mjs <new posts dir>` —
  7-day dedup against `news_id` / canonical URL / title similarity.

Cloudflare Pages also builds a preview and links it in the PR thread.

## Code conventions

- ESM only (`"type": "module"` in package.json). No CommonJS.
- Node 20+, all built-ins available.
- Prefer `node:test` over external test runners.
- Files in `skills/daily-news/scripts/` use the same path-resolution
  idiom as `load-context.mjs` (`dirname(fileURLToPath(import.meta.url))`).
- Fetchers in `skills/daily-news/scripts/fetchers/` follow the uniform
  contract: `async fetch(record, ctx) -> {candidates, deferred?, state_diff?}`.

## CSS conventions

- All colours via OKLCH tokens defined in `src/static/site.css` —
  never hardcode hex/rgb. Light + dark themes share the same token
  names; dark mode overrides values in `[data-theme="dark"]`.
- Component classes use `.vg-*` prefix.
- Inline SVG widgets scoped per `skills/daily-news/references/widget-isolation.md`.

## What a PR usually looks like

The `.github/pull_request_template.md` ships the standard structure:
Summary (2-3 bullets) + Test plan (checklist of verification steps).
Keep summary short — the diff speaks for itself; the summary
articulates the *why*.
