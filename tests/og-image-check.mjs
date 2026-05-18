// tests/og-image-check.mjs — Every post should have a matching OG PNG.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, "..");
const POSTS = join(REPO_ROOT, "src", "posts");
const OG = join(REPO_ROOT, "src", "static", "og");

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (n.endsWith(".html")) yield p;
  }
}

function postId(p) {
  const rel = p.slice(POSTS.length + 1);
  const parts = rel.split("/");
  const fname = parts.pop().replace(/\.html$/, "");
  return `${parts.join("-")}-${fname}`;
}

test("every post has an OG image", () => {
  const missing = [];
  for (const html of walk(POSTS)) {
    const id = postId(html);
    if (!existsSync(join(OG, `${id}.png`))) missing.push(id);
  }
  assert.equal(missing.length, 0, `missing OG: ${missing.join(", ")}`);
});

test("home OG exists", () => {
  assert.ok(existsSync(join(OG, "home.png")), "expected src/static/og/home.png");
});
