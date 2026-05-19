#!/usr/bin/env node
// widget-cookbook-check.mjs — Validate that sidecar widget_templates
// values map to existing cookbook files.
//
// Usage: node tests/widget-cookbook-check.mjs
//
// Walks src/posts/**/deep-*.11tydata.json. For each sidecar with a
// widget_templates array, checks that every value resolves to a file
// under skills/daily-news/references/widget-cookbook/tier-1-golden/
// or skills/daily-news/references/widget-cookbook/tier-2-snippets/.
//
// Exits 0 on success, 1 on any violation.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, "..");
const COOKBOOK_T1 = join(REPO_ROOT, "skills/daily-news/references/widget-cookbook/tier-1-golden");
const COOKBOOK_T2 = join(REPO_ROOT, "skills/daily-news/references/widget-cookbook/tier-2-snippets");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (entry.endsWith(".11tydata.json")) out.push(p);
  }
  return out;
}

function templateExists(id) {
  return existsSync(join(COOKBOOK_T1, `${id}.md`)) || existsSync(join(COOKBOOK_T2, `${id}.md`));
}

const SIDECAR_ROOT = join(REPO_ROOT, "src/posts");
if (!existsSync(SIDECAR_ROOT)) {
  process.stderr.write(`Posts dir not found: ${SIDECAR_ROOT}\n`);
  process.exit(2);
}

const violations = [];
for (const sidecarPath of walk(SIDECAR_ROOT)) {
  let data;
  try { data = JSON.parse(readFileSync(sidecarPath, "utf8")); } catch { continue; }
  if (data.archetype !== "daily-deep-story") continue;
  if (!Array.isArray(data.widget_templates)) continue; // no widget contract yet
  for (const id of data.widget_templates) {
    if (typeof id !== "string") {
      violations.push(`${sidecarPath}: widget_templates entry is not a string: ${JSON.stringify(id)}`);
      continue;
    }
    if (!templateExists(id)) {
      violations.push(`${sidecarPath}: widget_templates entry "${id}" does not resolve to a cookbook file (tier-1-golden or tier-2-snippets)`);
    }
  }
}

if (violations.length > 0) {
  for (const v of violations) process.stderr.write(v + "\n");
  process.exit(1);
}
process.stdout.write(`OK: widget-cookbook-check passed\n`);
