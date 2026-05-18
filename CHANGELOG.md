# Changelog

All notable changes to this project will be documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this
project adheres to [SemVer](https://semver.org/) once a stable version
is cut. Until then, every merged PR shows up under `Unreleased`.

## Unreleased

### Added

- Code-block typography + PrismJS syntax highlight via a build-time
  Eleventy transform; sketch-of-an-algorithm pseudocode tier with left
  accent rule, top-right kind chip, and Spectral-italic comments (PR #7).
- LICENSE (MIT), CHANGELOG, CONTRIBUTING, SECURITY, PR template, issue
  templates, Dependabot config, CODEOWNERS, `.editorconfig`.

## 2026-05-18 — competitor borrowings (PR #6)

### Added

- **YAML-driven source registry** at `src/_data/sources.yml` (45 sources,
  five tiers) with `registry.mjs` loader and `list-sources.mjs` CLI.
- **Four new fetcher types** behind a dispatcher (`fetch-all.mjs`):
  arXiv Atom, Hugging Face Hub API, Anthropic + OpenAI sitemap-diff
  (state baseline at `src/_data/web-state.json`), Lobsters JSON.
  `html_index` sources route to Claude's WebFetch tool via a sentinel
  fetcher.
- **Cross-source clustering** (`cluster-candidates.mjs`): canonical URL
  match + title token-Jaccard ≥ 0.6 with union-find. SKILL.md Step 5.0
  folds clusters into one deep-story brief per unique story.
- **Parallel deep-story authoring**: SKILL.md Step 7 split into 7a/7b/7c
  — parent prepares ≤3 briefs, dispatches in parallel via Claude Code's
  `Agent` tool, verifies outputs.
- **Open Graph + JSON-LD + Twitter cards** on every page via
  `head-meta.njk`. Posts get `Article` JSON-LD; home gets `Blog`.
- **OG image generator** (`scripts/build-og.mjs`) using satori + wawoff2
  for Spectral (Latin) + LXGW WenKai TC (CJK) fallback. Wired into
  npm `prebuild`.
- **today.svg**: 600×320 self-contained SVG card showing today's
  roundup title + top 3 items + sigil. Embeddable in GitHub READMEs.
- **sitemap.xml + robots.txt**, with `<image:image>` children for every
  post URL (Google Image Search indexes post artwork).
- **search-index.json** built by Eleventy from collections; consumed by
  the MCP server.
- **Weekly + monthly rollup archetypes** with `/vatt-ghern:weekly` and
  `/vatt-ghern:monthly` slash commands. Reuse the deep-story shape but
  draw from past N days' sidecars via `load-past-roundups.mjs`.
- **MCP server** (`mcp/worker.mjs`): Cloudflare Worker exposing four
  tools — `list_posts`, `get_post`, `latest`, `search`.

### Notes

- New deps: `js-yaml`, `satori`, `wawoff2`.
- 27 tests: registry + fetchers + clustering + OG coverage.
- Build now writes 95 files (added: sitemap.xml, search-index.json, robots.txt, today.svg, 13 OG PNGs).

## Earlier

History prior to this CHANGELOG lives in `git log`. Tagged releases
will start once the routine has run autonomously for a full month.
