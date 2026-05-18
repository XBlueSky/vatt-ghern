#!/usr/bin/env node
// list-sources.mjs — Print the source plan as JSON or a TTY-friendly table.
// Usage:
//   node skills/daily-news/scripts/list-sources.mjs            # table
//   node skills/daily-news/scripts/list-sources.mjs --json     # JSON
//   node skills/daily-news/scripts/list-sources.mjs --tier=1   # filter
//   node skills/daily-news/scripts/list-sources.mjs --type=arxiv

import { loadSources } from "./registry.mjs";

function parseArgs(argv) {
  const out = { json: false };
  for (const a of argv.slice(2)) {
    if (a === "--json") out.json = true;
    else if (a.startsWith("--tier=")) out.tier = Number(a.split("=")[1]);
    else if (a.startsWith("--type=")) out.type = a.split("=")[1];
    else if (a.startsWith("--id=")) out.id = a.split("=")[1];
    else {
      process.stderr.write(`Unknown arg: ${a}\n`);
      process.exit(2);
    }
  }
  return out;
}

const args = parseArgs(process.argv);
const rows = loadSources({ tier: args.tier, type: args.type, id: args.id });

if (args.json) {
  process.stdout.write(JSON.stringify(rows, null, 2) + "\n");
} else {
  process.stdout.write(`tier  type             id                          url\n`);
  process.stdout.write(`----  ---------------  --------------------------  ---\n`);
  for (const s of rows) {
    process.stdout.write(
      `${String(s.tier).padEnd(4)}  ${s.type.padEnd(15)}  ${s.id.padEnd(26)}  ${s.url}\n`
    );
  }
  process.stdout.write(`\n${rows.length} source(s)\n`);
}
