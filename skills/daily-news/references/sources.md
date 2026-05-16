# Sources — Priority Crawl List

The skill fetches today's tech news from this priority-ordered list of public
sites. Higher entries are tried first; lower entries fill in. The skill needs
**≥5 successful fetches** to continue (otherwise fail-fast and let the next
day's run retry).

All URLs are public. No API keys required.

## Tier 1 — Most important

- https://hackernoon.com/ **(primary signal)**

## Tier 2 — Aggregators

- https://news.ycombinator.com/news
- https://lobste.rs/
- https://app.daily.dev/
- https://blog.gslin.org/

## Tier 3 — Big-tech engineering blogs

- https://blog.cloudflare.com/
- https://netflixtechblog.com/
- https://engineering.fb.com/
- https://github.blog/category/engineering/
- https://devblogs.microsoft.com/
- https://stripe.com/blog/engineering
- https://dropbox.tech/
- https://discord.com/category/engineering
- https://slack.engineering/
- https://www.linkedin.com/blog/engineering
- https://engineering.atspotify.com/
- https://medium.com/@Pinterest_Engineering
- https://dropbox.tech/
- https://www.uber.com/en-TW/blog/taipei/engineering/
- https://www.notion.com/zh-tw/blog
- https://techblog.lycorp.co.jp/en
- https://developer.squareup.com/blog/
- https://www.docker.com/blog/
- https://blogs.nvidia.com/
- https://developers.googleblog.com/en/

## Tier 4 — Systems / language community

- https://wanghenshui.github.io/cppweeklynews/
- https://meetingcpp.com/blog/blogroll/
- https://cpp.libhunt.com/
- https://blog.algomaster.io/
- https://blog.bytebytego.com/
- https://newsletter.systemdesigncodex.com/
- https://blog.codingconfessions.com/
- https://www.f5.com/company/blog/pillar/nginx
- https://blog.nginx.org/

## Tier 5 — Adjacent

- https://www.quantamagazine.org/
- https://medium.com/better-practices

## Fetch rules

- **Per source**: collect top 5–10 items from the last ~24h (since-yesterday
  cutoff). If a site doesn't expose freshness, take the top-of-page items.
- **Total candidate pool**: aim for ~50–100 items before scoring.
- **De-duplicate URLs** across sources before scoring — the same Cloudflare
  blog post appearing on HN should be one candidate, not two.
- **Failures are not fatal**: skip a failing source, log it in the PR body,
  continue. Only fail-fast if fewer than 5 sources succeed.

## What the skill records per item

For each candidate selected into today's 10:

- `source_url` — the canonical link (publisher's site, not the aggregator)
- `aggregator_url` — if found via HN/lobsters/daily.dev, also record this
- `original_title` — the publisher's headline as-is
- `domain` — one of: ai, systems, infra, storage, industry
- `score` — 0–10 from the scoring rubric in `archetypes.md`
- `news_id` — assigned as `YYYY-MM-DD-NN` in final ranking order
