# Archetype: deep-freeform

The escape hatch. When none of the five structured archetypes fits
cleanly, or when the topic is hybrid, the skill picks `freeform` and
shapes the post by the content's natural rhythm.

## When to pick freeform

Pick when one of these is true:

- Topic is hybrid: part-narrative + part-explainer
- The natural reading order doesn't match any structured archetype's
  shape
- The story's pivot is structural in a way no archetype captures
  (e.g., "two parallel events turn out to share the same root cause")
- Forcing one of the five would make the prose worse

When in doubt between freeform and a structured archetype, prefer
freeform. A forced fit produces worse content than free shape.

If you pick freeform after considering a structured archetype, note
the reason in the PR body under `## Archetype overrides` so reviewers
can see the call.

## Required structure (universal contract)

The skill MUST emit:

- `<h1 class="vg-post-title">` with the post title
- `<p class="vg-deep-opener">` with the hook (a scene, question, or
  reframing — pulls the reader in before technical content begins)
- `<p class="vg-deep-closer">` near the end, containing a `<strong>`
  with a closing label (free phrasing — any label that signals "this
  is the wrap")
- ≥1 inline `<svg>` widget (≥2 recommended; warning if only 1, and
  the single widget must carry high informational density — no
  decorative spacers)

## Recommended but not required

- `<span class="vg-dropcap">` wrapping the first character of the
  first paragraph. Recommended for visual rhythm; skip on solemn
  topics where an illuminated capital would feel decorative
  (CVE postmortem, accident report, obituary-shaped pieces).

## What freeform does NOT allow (banned even here)

- No opener (article starts cold)
- No closer (article ends mid-thought)
- Wall-of-text without paragraph breaks
- Zero widgets

## Example shape (one of many possible)

A 2026-style freeform post on a hybrid topic might look like:

```html
<header class="vg-deep-hero">
  <p class="vg-deep-opener">{{HOOK}}</p>
  <h1 class="vg-post-title">{{TITLE}}</h1>
</header>

<div class="vg-post-prose">
  <p><span class="vg-dropcap">{{CHAR}}</span>{{intro paragraph}}</p>

  <!-- Free-shaped sections; H2 names, count, and order are unconstrained -->

  <p class="vg-deep-closer"><strong>{{CLOSING_LABEL}}</strong>：{{closing}}</p>
</div>
```

### Closer label

Free. Pick something that fits the post's voice. Examples:

`Take-away` · `Closing thought` · `Reflection` · `So what` · `What
changes` · `The lesson` · `What this enables` · `Next time` · `The
call` · `The model` · `In a sentence` · `Looking ahead`

Sidecar JSON:

```json
{
  "archetype": "daily-deep-story",
  "deep_archetype": "freeform",
  "...": "..."
}
```
