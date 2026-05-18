# vatt-ghern MCP server

Cloudflare Worker that exposes vatt'ghern's archive as an MCP server.
Stateless protocol adapter — all data comes from the deployed Pages
site (`https://vatt-ghern.pages.dev/search-index.json`).

## Tools

| Tool | Args | Returns |
|---|---|---|
| `list_posts` | `since?`, `until?`, `archetype?`, `limit?` | newest-first array |
| `get_post` | `url` | one post including rendered HTML body |
| `latest` | `archetype?` | most recent matching post |
| `search` | `q`, `limit?` | scored array of matches |

## Deploy

```shell
cd mcp
npx wrangler deploy
```

First deploy creates `https://vatt-ghern-mcp.<account>.workers.dev`.

## Local dev

```shell
cd mcp
npx wrangler dev          # serves on http://localhost:8787
# in another terminal:
node test-client.mjs --base=http://localhost:8787
```

## Smoke test

```shell
node mcp/test-client.mjs                                # deployed
node mcp/test-client.mjs --base=http://localhost:8787   # local
```

## Adding to Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vatt-ghern": {
      "url": "https://vatt-ghern-mcp.<account>.workers.dev/rpc"
    }
  }
}
```

(Adjust the URL to match the deployed worker.)

## How it works

- The Worker is ~150 lines of plain JS. No KV, no D1, no Durable Objects.
- On each `tools/call` it fetches `/search-index.json` from the public
  Pages origin (cached for 10 minutes via Cloudflare's edge cache + an
  in-memory module-scope cache).
- `get_post` additionally fetches the rendered HTML for the requested
  URL so callers receive the full content, not just metadata.

## Why this shape

The Worker is a *protocol adapter*, not a content host. The site
itself remains the source of truth; the Worker just speaks MCP.
Re-deploys of the blog automatically update what the MCP server
returns (with the 10-minute cache TTL).
