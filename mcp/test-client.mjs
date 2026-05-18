#!/usr/bin/env node
// test-client.mjs — Smoke-test the MCP server against a local index.
//
// Usage:
//   node mcp/test-client.mjs                     # against deployed worker
//   node mcp/test-client.mjs --base=http://localhost:8787
//
// Writes a one-line summary for each tool. Exit non-zero on any failure.

import { argv, exit, stdout, stderr } from "node:process";

let BASE = "https://vatt-ghern-mcp.workers.dev";
for (const a of argv.slice(2)) {
  if (a.startsWith("--base=")) BASE = a.split("=")[1];
}

let nextId = 1;
async function rpc(method, params) {
  const res = await fetch(`${BASE}/rpc`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  });
  if (!res.ok) throw new Error(`${method} HTTP ${res.status}`);
  return await res.json();
}

async function call(name, args) {
  const j = await rpc("tools/call", { name, arguments: args });
  if (j.error) throw new Error(`${name}: ${j.error.message}`);
  return JSON.parse(j.result.content[0].text);
}

let failed = 0;

async function step(label, fn) {
  try {
    const got = await fn();
    stdout.write(`OK  ${label}: ${got}\n`);
  } catch (e) {
    stderr.write(`FAIL ${label}: ${e.message}\n`);
    failed++;
  }
}

await step("initialize", async () => {
  const j = await rpc("initialize", {});
  if (j.error) throw new Error(j.error.message);
  return `${j.result.serverInfo.name} ${j.result.serverInfo.version}`;
});

await step("tools/list", async () => {
  const j = await rpc("tools/list", {});
  if (j.error) throw new Error(j.error.message);
  return `${j.result.tools.length} tools: ${j.result.tools.map((t) => t.name).join(", ")}`;
});

await step("list_posts limit=3", async () => {
  const posts = await call("list_posts", { limit: 3 });
  if (!Array.isArray(posts) || posts.length === 0) throw new Error("empty");
  return `${posts.length} posts; newest: ${posts[0].date} ${posts[0].title.slice(0, 30)}…`;
});

await step("latest", async () => {
  const post = await call("latest", {});
  if (!post) throw new Error("null");
  return `${post.date} ${post.title.slice(0, 40)}`;
});

await step("search q=Bazel", async () => {
  const hits = await call("search", { q: "Bazel", limit: 3 });
  return `${hits.length} hits`;
});

if (failed > 0) {
  stderr.write(`\n${failed} failure(s)\n`);
  exit(1);
}
stdout.write(`\nAll smoke checks passed.\n`);
