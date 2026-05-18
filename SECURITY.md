# Security policy

## Supported versions

This is a static personal blog. Only `main` is "supported" — historical
deploys are not patched.

## Reporting a vulnerability

If you find a security issue (XSS via authored post content,
dependency CVE, exposed secret in repo history, MCP worker
authorisation gap, etc.), please report privately:

- **GitHub Security Advisories**: open a draft advisory at
  <https://github.com/XBlueSky/vatt-ghern/security/advisories/new>
- **Email**: replace this line with a real address when you have one
  set up; until then, GitHub advisories are the primary channel.

Please **do not** open a public issue for security reports until a
patch is shipped.

## What's in scope

- The deployed site (`vatt-ghern.pages.dev`) — XSS, CSP holes, click-jacking.
- The MCP worker (`mcp/worker.mjs`) — auth, input validation, SSRF.
- The daily-news skill scripts (`skills/daily-news/scripts/`) — command
  injection, prompt injection that exfiltrates secrets, path traversal.
- Supply-chain (`package-lock.json`, `mcp/wrangler.toml`).

## What's out of scope

- The Claude routine's curation calls (those go through Anthropic's
  hosted API; report Claude API issues to Anthropic).
- Cloudflare Pages / Workers platform issues (report to Cloudflare).
- Out-of-date content in old roundup posts.

## Response

Acknowledged within 7 days. Critical issues patched on `main` and
deployed via Cloudflare Pages auto-build. Non-critical issues batched
into the next regular PR.
