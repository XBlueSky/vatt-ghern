#!/usr/bin/env node
// link-check.mjs — Verify internal href targets resolve in _site/.
//
// Usage: node tests/link-check.mjs
//
// Walks _site/**/*.html, extracts every href that starts with "/" (treating
// it as an internal absolute path), and checks the corresponding file
// exists. URL fragments (#item-03) are stripped — we don't validate
// fragments, only the path.
//
// Exit 0 = all internal links resolve. Exit 1 = list broken links.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, "..");
const SITE_DIR = join(REPO_ROOT, "_site");

if (!existsSync(SITE_DIR)) {
  process.stderr.write(`No _site/ — run npm run build first\n`);
  process.exit(2);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (entry.endsWith(".html")) out.push(p);
  }
  return out;
}

function resolveInternalHref(href) {
  // Strip fragment and query
  const noFrag = href.split("#")[0].split("?")[0];
  if (!noFrag.startsWith("/")) return null;
  // Special-case: feed.xml lives at /feed.xml (file, not dir)
  if (noFrag.endsWith(".xml") || noFrag.endsWith(".html") || noFrag.endsWith(".css") || noFrag.endsWith(".js") || noFrag.endsWith(".webp") || noFrag.endsWith(".png")) {
    return join(SITE_DIR, noFrag);
  }
  // Directory path → expect index.html inside
  const dirCandidate = join(SITE_DIR, noFrag, "index.html");
  return dirCandidate;
}

const broken = [];
const seenLinks = new Set();

for (const filePath of walk(SITE_DIR)) {
  const html = readFileSync(filePath, "utf8");
  // Match href="..." with internal absolute path
  const hrefMatches = [...html.matchAll(/href="(\/[^"]*)"/g)];
  for (const m of hrefMatches) {
    const href = m[1];
    if (seenLinks.has(href)) continue;
    seenLinks.add(href);
    const target = resolveInternalHref(href);
    if (!target) continue;
    if (!existsSync(target)) {
      broken.push(`${filePath} → href="${href}" (missing ${target.replace(SITE_DIR, "_site")})`);
    }
  }
}

if (broken.length > 0) {
  for (const b of broken) process.stderr.write(b + "\n");
  process.exit(1);
}
process.stdout.write(`OK: link-check verified ${seenLinks.size} internal links across _site/\n`);
