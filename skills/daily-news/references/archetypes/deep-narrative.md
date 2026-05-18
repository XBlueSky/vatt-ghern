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

## Shape (the arc, not the wording)

A narrative post moves through three beats. Pick H2 *names that fit the
story* — do not reuse the same three words across topics. The agent's
voice and the reader's experience both suffer from template phrasing.

1. **Setup** — what was true before; what triggered the story.
2. **Mechanism** — how the event unfolded; what made it possible.
3. **Consequence** — what changed; what the reader should now expect.

You may split a beat across two H2s (e.g. setup → "the system before" +
"the trigger"), giving 4 H2s total. Cap at 5.

### Example H2 sets — choose by topic, do not copy literally

- CVE timeline: `the disclosure` / `how the exploit worked` / `the patch
  that stopped it` / `what still bites`
- Production incident: `the page` / `tracing the regression` / `the fix`
- Release saga: `before the release` / `the rollout` / `community response`

A reader scanning H2s should understand *what this specific post is about*
within five seconds. Generic phrasing fails that test.

## Required structure (universal contract)

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK — a scene, a quote, a question}}</p>
  <h1 class="vg-post-title">{{TITLE}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro paragraph — one
  sentence orienting the reader to what the post is about}}</p>

  <h2>{{SETUP_NAMED_FOR_TOPIC}}</h2>
  <!-- Widget #1 often goes here: timeline / sequence diagram. -->

  <h2>{{MECHANISM_NAMED_FOR_TOPIC}}</h2>
  <!-- Widget #2 often goes here: architecture sketch, before/after. -->

  <h2>{{CONSEQUENCE_NAMED_FOR_TOPIC}}</h2>

  <p class="vg-deep-closer"><strong>{{CLOSER_LABEL}}</strong>：{{one
  sentence the reader carries out}}</p>
</div>
```

## Hard requirements (archetype-check.mjs enforces)

- 2-5 H2 elements in the body (counts only — phrasing is free)
- Universal contract from `deep-freeform.md` (opener, closer with
  `<strong>`)
- ≥1 inline `<svg>` widget (≥2 recommended; warning if only 1)
- Drop cap recommended; warning if absent — OK to omit on solemn topics
  (CVE postmortem, accident report) where an illuminated capital would
  read as decorative.

### Closer label

Free. Pick a short word/phrase that signals the wrap and fits the
register of the post. Examples:

- `Take-away` — practical, advice-shaped
- `So what` — punchy, when the consequence speaks for itself
- `What changes` — when the post is about a shift in defaults
- `Closing thought` — reflective, when no clean lesson exists
- `The lesson` — methodology-flavoured

Avoid using `Take-away` for every post. The label is part of the
post's voice.

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
