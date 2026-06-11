# NOTICE — zh-tw-terms.json licensing

`zh-tw-terms.json` in this directory is a derivative work and is
licensed **CC BY-SA 4.0** (unlike the rest of this repository, which
is MIT).

Attribution chain:

- Lexicon copied from
  [kevintsengtw/stop-slop-zh-tw](https://github.com/kevintsengtw/stop-slop-zh-tw)
  (`data/terms.json`), CC BY-SA 4.0.
- Which in turn derives its term mappings from
  [frank890417/taiwan-md](https://github.com/frank890417/taiwan-md)
  ([taiwan.md](https://taiwan.md)), CC BY-SA 4.0.

Local modifications: `mode` values may be adjusted (auto ⇄ flag) based
on calibration against this site's corpus, and local guard entries may
be added with `mode: "ok"` (correct Taiwan compounds — e.g. 演算法 —
that contain zh-CN auto substrings; the scanner consumes them silently
so the substring cannot false-fire). Schema:
`{from, to, mode: "auto"|"flag"|"ok", cat, note?}`.

The scanner code that consumes this file
(`skills/daily-news/scripts/check-zh-prose.mjs`) and the prose
reference (`references/zh-tw-prose.md`) are original works — concepts
learned from the upstream projects, text written fresh — and remain
MIT like the rest of the repository.
