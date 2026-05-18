# vatt-ghern

[![Quality](https://github.com/XBlueSky/vatt-ghern/actions/workflows/quality.yml/badge.svg)](https://github.com/XBlueSky/vatt-ghern/actions/workflows/quality.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-20-339933?logo=node.js&logoColor=white)](./.nvmrc)
[![Eleventy](https://img.shields.io/badge/built%20with-Eleventy%203-000?logo=11ty)](https://www.11ty.dev/)
[![Cloudflare Pages](https://img.shields.io/badge/hosted%20on-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://vatt-ghern.pages.dev)

Public personal tech blog. Daily news authored by a Claude routine.
Bespoke HTML deep-stories, persona-driven editing, CJK typography,
hosted on Cloudflare Pages.

[![today on vatt-ghern](https://vatt-ghern.pages.dev/static/today.svg)](https://vatt-ghern.pages.dev/)

- **Live**: <https://vatt-ghern.pages.dev>
- **RSS**: <https://vatt-ghern.pages.dev/feed.xml>
- **Codename**: vatt'ghern (Elder Speech for "witcher")
- **Sibling**: kaer-morhen (internal wiki — not a content source)

## What's inside

| Surface | What it is |
|---|---|
| `src/posts/YYYY/MM/DD/` | Bespoke HTML for one daily roundup + up to three deep-stories |
| `src/_includes/layouts/` | Nunjucks layouts (base, post, archetype) |
| `src/_data/sources.yml` | 45 priority-tiered sources the daily-news skill crawls |
| `skills/daily-news/` | Claude skill: persona, archetypes, source dispatcher, anti-dup |
| `commands/` | Slash commands: `/vatt-ghern:daily-news`, `:weekly`, `:monthly` |
| `mcp/` | Cloudflare Worker exposing the archive over MCP |
| `scripts/` | Build helpers (OG image, today.svg card, sigil) |

## Setup

```shell
nvm use            # node 20 per .nvmrc
npm install
npm run dev        # http://localhost:8080
```

## Build

```shell
npm run build      # writes _site/  (runs prebuild: OG + today.svg)
npm run lint:html  # validates _site/**/*.html
npm test           # node --test tests/*.mjs
```

Useful one-offs:

```shell
npm run og                                    # rebuild OG images
npm run card                                  # rebuild today.svg
npm run social                                # rebuild repo social preview
npm run sigil                                 # rebuild sigil webp variants
npm run sources:list                          # list daily-news sources
npm run sources:dry-run -- --type=arxiv       # dry-fetch one source type
```

The repo's GitHub social preview image is `src/static/social-preview.png`
(1280×640). After regenerating, upload via the GitHub web UI at
*Settings → Social preview*.

## Deploy

Cloudflare Pages auto-builds:

- `main` → production at <https://vatt-ghern.pages.dev>
- PR / non-main branch → preview build, URL posted as PR comment

GitHub Actions runs `.github/workflows/quality.yml` (build + html-validate) on every PR.

## Daily news routine

The Claude routine (or `/vatt-ghern:daily-news` slash command) executes
the [`daily-news` skill](./skills/daily-news/SKILL.md) which:

1. Loads context from the past 7 days of posts (dedup baseline)
2. Fetches from `src/_data/sources.yml` via `scripts/fetch-all.mjs`
3. Clusters cross-source variants and scores candidates
4. Picks today's 10 (domain coverage) + up to 3 deep-story clusters
5. Authors bespoke HTML for each, in parallel sub-agents
6. Runs the QA gate (archetype-check, html-validate, link-check, dedup)
7. Opens a PR for human review

Weekly + monthly rollups follow the same machinery via
`/vatt-ghern:weekly` and `/vatt-ghern:monthly`.

## MCP server

`mcp/worker.mjs` is a thin Cloudflare Worker that exposes the archive
over MCP — `list_posts`, `get_post`, `latest`, `search`. See
[`mcp/README.md`](./mcp/README.md) for tool schemas and Claude Desktop
config.

## License

[MIT](./LICENSE) © 2026 Tony Hu.

The MIT licence applies to all code and templates. Authored prose
inside `src/posts/**` carries the author's voice — please credit if you
quote at length.

## Related docs

- [`DESIGN.md`](./DESIGN.md) — design rationale (typography, OKLCH palette, sigil)
- [`PRODUCT.md`](./PRODUCT.md) — product vision, anti-references, pipeline notes
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — commit conventions, CJK typography rules
- [`SECURITY.md`](./SECURITY.md) — how to report vulnerabilities
