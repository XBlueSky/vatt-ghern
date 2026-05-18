// mcp/worker.mjs — Cloudflare Worker exposing vatt'ghern as an MCP server.
//
// Tools:
//   list_posts({ since?, until?, archetype?, limit? }) — date-filtered list
//   get_post({ url })                                  — single post payload
//   latest({ archetype? })                             — most recent post
//   search({ q, limit? })                              — keyword search
//
// The worker is a thin protocol adapter. All data lives at
//   https://vatt-ghern.pages.dev/search-index.json
// (built at deploy time by Eleventy from src/search-index.njk).

const SITE = "https://vatt-ghern.pages.dev";
const INDEX_URL = `${SITE}/search-index.json`;
const INDEX_TTL_SECONDS = 600; // 10 min — index changes only at deploy

let cachedIndex = null;
let cachedAt = 0;

async function loadIndex() {
  const now = Date.now();
  if (cachedIndex && (now - cachedAt) / 1000 < INDEX_TTL_SECONDS) return cachedIndex;
  const res = await fetch(INDEX_URL, { cf: { cacheTtl: INDEX_TTL_SECONDS } });
  if (!res.ok) throw new Error(`index fetch ${res.status}`);
  cachedIndex = await res.json();
  cachedAt = now;
  return cachedIndex;
}

function listPosts({ since, until, archetype, limit = 50 } = {}) {
  return loadIndex().then((idx) => {
    let posts = idx.posts.slice();
    if (since) posts = posts.filter((p) => p.date >= since);
    if (until) posts = posts.filter((p) => p.date <= until);
    if (archetype) {
      posts = posts.filter(
        (p) => p.archetype === archetype || p.deep_archetype === archetype
      );
    }
    posts.sort((a, b) => b.date.localeCompare(a.date));
    return posts.slice(0, Math.min(Number(limit) || 50, 200));
  });
}

function getPost({ url }) {
  return loadIndex().then(async (idx) => {
    const meta = idx.posts.find((p) => p.url === url);
    if (!meta) return null;
    // Fetch the rendered HTML body so callers get full content.
    const htmlRes = await fetch(`${SITE}${url}`, { cf: { cacheTtl: 300 } });
    if (!htmlRes.ok) throw new Error(`post fetch ${htmlRes.status} for ${url}`);
    const html = await htmlRes.text();
    return { ...meta, html, canonical: `${SITE}${url}` };
  });
}

function latest({ archetype } = {}) {
  return listPosts({ archetype, limit: 1 }).then((arr) => arr[0] || null);
}

function tokens(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

function search({ q, limit = 20 } = {}) {
  return loadIndex().then((idx) => {
    const qTokens = tokens(q);
    if (qTokens.length === 0) return [];
    const scored = idx.posts.map((p) => {
      const hay = [
        p.title, p.summary,
        (p.tags || []).join(" "),
        (p.topics || []).join(" "),
      ].join(" ").toLowerCase();
      const hayTokens = new Set(tokens(hay));
      let score = 0;
      for (const t of qTokens) {
        if (hayTokens.has(t)) score += 1;
        else if (hay.includes(t)) score += 0.5;
      }
      return { post: p, score };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
      .slice(0, Math.min(Number(limit) || 20, 100))
      .map((s) => ({ ...s.post, _score: s.score }));
  });
}

// JSON-RPC 2.0 envelope for MCP ----------------------------------------------

const TOOLS = [
  {
    name: "list_posts",
    description: "List vatt'ghern posts, newest first. Filter by date range or archetype.",
    inputSchema: {
      type: "object",
      properties: {
        since: { type: "string", description: "YYYY-MM-DD inclusive" },
        until: { type: "string", description: "YYYY-MM-DD inclusive" },
        archetype: { type: "string", description: "daily-roundup | daily-deep-story | weekly-rollup | monthly-rollup | <deep_archetype>" },
        limit: { type: "number", default: 50 },
      },
    },
  },
  {
    name: "get_post",
    description: "Fetch one post by URL path (e.g. /2026/05/18/roundup/).",
    inputSchema: {
      type: "object",
      properties: { url: { type: "string" } },
      required: ["url"],
    },
  },
  {
    name: "latest",
    description: "Get the most recent post, optionally of a given archetype.",
    inputSchema: {
      type: "object",
      properties: { archetype: { type: "string" } },
    },
  },
  {
    name: "search",
    description: "Keyword search over post title + summary + tags + topics.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string" },
        limit: { type: "number", default: 20 },
      },
      required: ["q"],
    },
  },
];

async function dispatchTool(name, args) {
  switch (name) {
    case "list_posts": return await listPosts(args);
    case "get_post":   return await getPost(args);
    case "latest":     return await latest(args);
    case "search":     return await search(args);
    default: throw new Error(`unknown tool: ${name}`);
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function handleJsonRpc(request) {
  let req;
  try { req = await request.json(); } catch {
    return jsonResponse({ jsonrpc: "2.0", error: { code: -32700, message: "parse error" } }, 400);
  }
  const id = req.id ?? null;
  const reply = (result) => jsonResponse({ jsonrpc: "2.0", id, result });
  const error = (code, message) => jsonResponse({ jsonrpc: "2.0", id, error: { code, message } });

  if (req.jsonrpc !== "2.0") return error(-32600, "invalid request");

  try {
    switch (req.method) {
      case "initialize":
        return reply({
          protocolVersion: "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name: "vatt-ghern-mcp", version: "0.1.0" },
        });
      case "tools/list":
        return reply({ tools: TOOLS });
      case "tools/call": {
        const { name, arguments: args } = req.params || {};
        const result = await dispatchTool(name, args || {});
        return reply({
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        });
      }
      default:
        return error(-32601, `method not found: ${req.method}`);
    }
  } catch (e) {
    return error(-32603, String(e.message || e));
  }
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(
        `vatt-ghern MCP server\n` +
        `POST JSON-RPC 2.0 to /rpc\n` +
        `tools: ${TOOLS.map((t) => t.name).join(", ")}\n`,
        { headers: { "content-type": "text/plain" } }
      );
    }
    if (request.method === "POST" && (url.pathname === "/rpc" || url.pathname === "/")) {
      return handleJsonRpc(request);
    }
    return new Response("not found", { status: 404 });
  },
};
