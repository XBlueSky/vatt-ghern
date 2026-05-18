# vatt-ghern

Public personal tech blog. Daily news authored by Claude routine. Hosted on
Cloudflare Pages.

- Live: https://vatt-ghern.pages.dev
- Codename: vatt'ghern (Elder Speech for "witcher")
- Sibling project: kaer-morhen (internal wiki; not a content source)

## Setup

```shell
nvm use            # node 20 per .nvmrc
npm install
npm run dev        # http://localhost:8080
```

## Build

```shell
npm run build      # writes _site/
npm run lint:html  # validates _site/**/*.html
```

## Deploy

Cloudflare Pages auto-builds:
- `main` → production at vatt-ghern.pages.dev
- PR / non-main branch → preview build, URL posted as PR comment

GitHub Actions runs `quality.yml` (build + html-validate) on PR.

## Sigil

Source PNG: `src/static/vg-sigil.png`. To regenerate webp variants:

```shell
npm run sigil
```

## Embeddable today card

`src/static/today.svg` is a 600×320 self-contained SVG with today's
roundup title + top 3 headlines + sigil. Rebuilt automatically before
each deploy. Pure SVG (no JS, no external assets), safe to embed in
GitHub READMEs and markdown surfaces.

```markdown
[![today on vatt-ghern](https://vatt-ghern.pages.dev/static/today.svg)](https://vatt-ghern.pages.dev/)
```

Regenerate manually:

```shell
npm run card
```

## Phase

This is Phase 1 (site shell). Phase 2 adds the daily-news skill. Phase 3
adds Claude Routine automation. See
`docs/superpowers/specs/2026-05-16-vatt-ghern-design.md` for the full plan.

## License

Personal project. © 2026 tonyhu. No broader license granted.
