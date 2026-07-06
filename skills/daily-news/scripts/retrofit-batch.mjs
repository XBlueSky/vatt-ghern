#!/usr/bin/env node
// Retrofit-batch driver. Emits per-post retrofit brief templates from
// a list of paths, so the parent (Claude) can dispatch the author
// sub-agents with the retrofit-aware brief.
//
// Usage:
//   node retrofit-batch.mjs --paths=<comma-separated> --findings=<audit-json>
//
// Where:
//   --paths       comma-separated list of post output_paths to rewrite
//   --findings    path to consolidated reviewer outputs (same format as
//                 content-audit.mjs --inputs) — used to inject the per-post
//                 weak-axis findings into the retrofit brief
//
// Output (stdout): JSON array of retrofit briefs, one per path. Parent
// reads, then dispatches one Agent per brief in batches.

import { readFile } from "node:fs/promises";

function parseArgs(argv) {
  const out = {};
  for (const a of argv.slice(2)) {
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq === -1) out[a.slice(2)] = true;
      else out[a.slice(2, eq)] = a.slice(eq + 1);
    }
  }
  return out;
}

const args = parseArgs(process.argv);
if (!args.paths || !args.findings) {
  console.error(
    "Usage: retrofit-batch.mjs --paths=<comma-list> --findings=<json-path>"
  );
  process.exit(2);
}

const paths = args.paths.split(",").map((s) => s.trim()).filter(Boolean);
const findings = JSON.parse(await readFile(args.findings, "utf8"));
const findingsByPath = new Map(findings.map((f) => [f.output_path, f]));

const briefs = paths.map((p) => {
  const f = findingsByPath.get(p);
  if (!f) {
    return {
      output_path: p,
      brief_status: "MISSING_FINDINGS",
      note: "No reviewer findings for this path. Provide findings or skip.",
    };
  }
  const weakAxes = Object.entries(f.axes)
    .filter(([_k, v]) => v.score <= 6)
    .map(([k, v]) => `- Axis ${k}: ${v.score}/10 — ${v.justification}`)
    .join("\n");
  return {
    output_path: p,
    sidecar_path: p.replace(/\.html$/, ".11tydata.json"),
    archetype: f.archetype,
    domain: f.domain,
    dispatch_note:
      "Dispatch this brief with model: \"sonnet\" required. Author writing " +
      "is a design-grade judgment task per SKILL.md Step 7b. Do NOT fall " +
      "back to a cheaper model — report BLOCKED instead.",
    brief: [
      `You are RETROFITTING an existing daily-deep-story for vatt'ghern.`,
      ``,
      `## Post under retrofit`,
      ``,
      `- output_path:  ${p}`,
      `- sidecar_path: ${p.replace(/\.html$/, ".11tydata.json")}`,
      `- archetype:    ${f.archetype}`,
      `- domain:       ${f.domain}`,
      ``,
      `## Why retrofit`,
      ``,
      `The current draft was reviewed and the following axes scored low:`,
      ``,
      weakAxes,
      ``,
      `## What to do`,
      ``,
      `1. Read the existing post HTML at ${p} and its sidecar.`,
      `2. Read skills/daily-news/references/content-quality-rubric.md.`,
      `3. Read skills/daily-news/references/archetypes/deep-${f.archetype}.md.`,
      `4. Read skills/daily-news/references/exemplars/${f.archetype}.html`,
      `   and skills/daily-news/references/exemplars/${f.archetype}.md`,
      `   (skip if these do not exist).`,
      `5. Read the post's original source material via WebFetch if needed`,
      `   to deepen Axis 3 (Material grounding) or Axis 4 (Depth).`,
      `6. REWRITE the post HTML in place at ${p}, lifting every weak axis`,
      `   above to a target score of 7+. Keep widgets unchanged UNLESS`,
      `   a reviewer finding explicitly cites widget content.`,
      `7. Preserve invariants:`,
      `   - news_id, archetype (sidecar's deep_archetype)`,
      `   - output_path, sidecar_path`,
      `   - sources[] in sidecar (no removal; you may add if you cite new ones)`,
      ``,
      `## Hard rules`,
      ``,
      `- Tools allowed: WebFetch, Read, Write.`,
      `- No Agent dispatch, no Bash, no git operations, no Edit on other`,
      `  days' posts.`,
      `- Do NOT change widget count downward.`,
      `- Persona invariants from persona.md still apply.`,
      ``,
      `## Report back`,
      ``,
      `Status block:`,
      `- status: DONE | DONE_WITH_CONCERNS | BLOCKED`,
      `- output_path: ${p}`,
      `- char_count: <number>`,
      `- axes_addressed: <list of axes touched>`,
      `- concerns: <list or "none">`,
    ].join("\n"),
  };
});

process.stdout.write(JSON.stringify(briefs, null, 2) + "\n");
