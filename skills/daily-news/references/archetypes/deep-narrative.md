# Archetype: deep-narrative

Tells what happened as a time-ordered story.

## When to pick narrative

Pick when the topic is event-driven and has a clear time sequence:

- CVE chains (vulnerability disclosed → exploit appears → patch lands)
- Production-incident postmortems (oncall paged → investigation → fix)
- Acquisition / re-org sagas
- Release-week wrap-ups (release-day → adoption → community reaction)
- Oncall war stories

If the news has a "first this happened, then that happened" rhythm, it
is narrative.

## Required structure

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — a scene, a quote, a question}}</p>
  <h1 class="vg-post-title">{{TITLE}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro paragraph — one
  sentence orienting the reader to what the post is about}}</p>

  <h2>what happened</h2>
  <!-- The factual timeline. Widget #1 typically goes here:
       a timeline SVG or sequence diagram. -->

  <h2>why it matters</h2>
  <!-- Technical context, ramifications. Widget #2 typically goes here:
       architecture sketch, before/after, comparison. -->

  <h2>so what</h2>
  <!-- Industry pattern, related reading, what the reader takes away. -->

  <p class="vg-deep-closer"><strong>Take-away</strong>：{{one sentence
  the reader carries out}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- Exactly 3 H2 elements in the body
- H2 text matches exactly: `what happened`, `why it matters`, `so what`
- Closer label is `Take-away` (with full-width 「：」 separator if
  followed by CJK prose, half-width `:` if followed by English)
- ≥2 inline `<svg>` widgets
- Universal contract from `deep-freeform.md` (opener, dropcap, closer)

## Recommended widgets

1. **Timeline / sequence**: orient the reader in time. ViewBox
   `0 0 480 80` or `0 0 480 120`. Use `<circle>` for events,
   `<line>` for the spine, `<text font-family="EB Garamond, serif">`
   for time labels.
2. **Architecture / before-after**: show what changed in
   the system. ViewBox `0 0 480 200` or wider.

## Sidecar

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "narrative",
  "...": "..."
}
```
