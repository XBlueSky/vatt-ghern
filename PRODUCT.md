# vatt-ghern — product context

## What this is

A public personal tech blog where daily news for engineers is curated and
storied by a Claude routine. Each day publishes:

- **1× daily-roundup** — a 10-item index for 3-minute scan.
- **3× daily-deep-story** — long-form storytelling drilling into three of
  those 10 items, with inline SVG widgets, designed for engineers to read
  and *learn from*.

Content is bespoke HTML (custom layouts, inline visualizations), not
template fill-ins. The framework exists to organize and deploy.

## Users

**Primary**: Tony — daily tech news from a single trusted source,
filtered through a senior-tech-lead lens, with depth where the depth is
warranted.

**Secondary**: Engineers who find the site through links. They arrive
for the topic, not for the brand.

## Voice

- **Measured** — findings stated plainly, hedges honest.
- **Curious** — investigative posture; deep-stories open with a question
  or an anomaly, not a marketing hook.
- **Materially-rooted** — concrete examples, real RFCs, real CVE numbers.

## Language

純繁體中文 prose. English technical terms preserved unchanged. CJK
雙破折號 `——` allowed; Latin single em-dash `—` banned in site prose
(see DESIGN.md punctuation rule).

## Anti-references

- Not a Substack/Medium personal-brand blog.
- Not a tech-startup blog.
- Not a generic SSG demo.
- Not maximalist editorial magazine.
- Not terminal-aesthetic developer blog.

## Pipeline performance

The daily routine wallclock is dominated by deep-story authoring.
Step 7 dispatches deep-stories in parallel — one sub-agent per story,
up to 3 concurrent — see
`skills/daily-news/references/deep-story-brief.md` for the contract.
Sequential authoring previously took ~2-3 minutes; parallel is bounded
by the slowest single brief (~60s).
