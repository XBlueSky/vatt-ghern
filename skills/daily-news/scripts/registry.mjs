// skills/daily-news/scripts/registry.mjs
// Sole reader of src/_data/sources.yml. Exposes loadSources(filter?).
// Throws at load time on duplicate id, invalid tier/type, or missing required fields.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, "..", "..", "..");
const YML_PATH = join(REPO_ROOT, "src", "_data", "sources.yml");

const VALID_TIERS = new Set([1, 2, 3, 4, 5]);
const VALID_TYPES = new Set(["html_index", "arxiv", "hf", "sitemap", "lobsters_json"]);

// Cache lives for the lifetime of the Node process. CLI/short-lived scripts
// see one parse; long-running consumers should spawn a new process to reload.
let cache = null;

function readAll() {
  if (cache) return cache;
  const text = readFileSync(YML_PATH, "utf8");
  const doc = yaml.load(text);
  if (!doc || !Array.isArray(doc.sources)) {
    throw new Error(`sources.yml malformed — missing top-level "sources:" list`);
  }
  const seenIds = new Set();
  for (const s of doc.sources) {
    if (!s.id || !s.name || !s.url) {
      throw new Error(`sources.yml: record missing id/name/url: ${JSON.stringify(s)}`);
    }
    if (!VALID_TIERS.has(s.tier)) {
      throw new Error(`sources.yml: ${s.id} has invalid tier ${s.tier}`);
    }
    if (!VALID_TYPES.has(s.type)) {
      throw new Error(`sources.yml: ${s.id} has invalid type ${s.type}`);
    }
    if (seenIds.has(s.id)) {
      throw new Error(`sources.yml: duplicate id "${s.id}"`);
    }
    seenIds.add(s.id);
  }
  cache = doc.sources;
  return cache;
}

export function loadSources(filter = {}) {
  if (filter.tier !== undefined && !VALID_TIERS.has(filter.tier)) {
    throw new Error(`loadSources: invalid tier filter ${filter.tier}`);
  }
  if (filter.type !== undefined && !VALID_TYPES.has(filter.type)) {
    throw new Error(`loadSources: invalid type filter ${filter.type}`);
  }
  let out = readAll();
  if (filter.tier !== undefined) out = out.filter((s) => s.tier === filter.tier);
  if (filter.type !== undefined) out = out.filter((s) => s.type === filter.type);
  if (filter.id !== undefined) out = out.filter((s) => s.id === filter.id);
  return out;
}

export const _internals = { readAll, VALID_TIERS, VALID_TYPES, YML_PATH };
