#!/usr/bin/env node
// One-shot content audit: enumerates posts in a date range and assembles
// a markdown audit report from collected reviewer JSON outputs.
//
// Two phases:
//   1. node content-audit.mjs --emit-manifest --start=YYYY-MM-DD --end=YYYY-MM-DD
//      → prints JSON manifest to stdout: list of posts with reviewer brief
//        templates substituted. Claude (parent) reads this, then dispatches
//        2 reviewers per post per content-reviewer-brief.md.
//   2. node content-audit.mjs --report --manifest=<path> --inputs=<path> --out=<path>
//      → reads manifest + reviewer JSON outputs (collected by parent),
//        assembles markdown report.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", ".."); // repo root from skills/daily-news/scripts/

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

if (args["emit-manifest"]) {
  await emitManifest(args.start, args.end);
} else if (args.report) {
  await emitReport(args.manifest, args.inputs, args.out);
} else {
  console.error(
    "Usage:\n" +
      "  content-audit.mjs --emit-manifest --start=YYYY-MM-DD --end=YYYY-MM-DD\n" +
      "  content-audit.mjs --report --manifest=<path> --inputs=<path> --out=<path>"
  );
  process.exit(2);
}

async function emitManifest(start, end) {
  if (!start || !end) {
    console.error("--start and --end required (YYYY-MM-DD)");
    process.exit(2);
  }

  const posts = await collectPosts(start, end);
  const manifest = {
    generated: new Date().toISOString(),
    start,
    end,
    posts: posts.map((p) => ({
      output_path: p.relPath,
      sidecar_path: p.relPath.replace(/\.html$/, ".11tydata.json"),
      archetype: p.archetype,
      domain: p.domain,
      kind: p.kind, // "roundup" | "deep-story"
      reviewer_brief_template_path:
        "skills/daily-news/references/content-reviewer-brief.md",
    })),
  };
  process.stdout.write(JSON.stringify(manifest, null, 2) + "\n");
}

async function collectPosts(start, end) {
  // Walks src/posts/YYYY/MM/DD/ for each day in [start, end].
  const out = [];
  for (
    let d = new Date(start);
    d <= new Date(end);
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const yyyy = String(d.getUTCFullYear());
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const dayDir = join(root, "src", "posts", yyyy, mm, dd);
    if (!existsSync(dayDir)) continue;
    const entries = await readdir(dayDir);
    for (const entry of entries) {
      if (!entry.endsWith(".html")) continue;
      const sidecarName = entry.replace(/\.html$/, ".11tydata.json");
      if (!entries.includes(sidecarName)) continue;
      const sidecarPath = join(dayDir, sidecarName);
      const sidecar = JSON.parse(await readFile(sidecarPath, "utf8"));
      const relPath = join(
        "src",
        "posts",
        yyyy,
        mm,
        dd,
        entry
      );
      out.push({
        relPath,
        archetype: sidecar.deep_archetype ?? null,
        domain: (sidecar.topics ?? []).find(
          (t) => t !== "roundup"
        ) ?? null,
        kind: sidecar.archetype === "daily-roundup" ? "roundup" : "deep-story",
      });
    }
  }
  return out;
}

async function emitReport(manifestPath, inputsPath, outPath) {
  if (!manifestPath || !inputsPath || !outPath) {
    console.error("--manifest, --inputs, --out all required");
    process.exit(2);
  }
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  // inputs is a JSON array of reviewer outputs, each shaped per the
  // rubric's "Reviewer output format". For dual-reviewer, parent
  // pre-consolidated to lower-score-per-axis BEFORE writing the inputs
  // file. inputs[i].output_path matches manifest.posts[i].output_path.
  const inputs = JSON.parse(await readFile(inputsPath, "utf8"));

  const inputsByPath = new Map(inputs.map((i) => [i.output_path, i]));

  const rows = [];
  for (const post of manifest.posts) {
    const r = inputsByPath.get(post.output_path);
    if (!r) {
      rows.push(
        `| ${post.output_path} | ${post.archetype ?? "-"} | ${post.domain ?? "-"} | n/a | n/a | n/a | n/a | n/a | n/a | NO_REVIEW |`
      );
      continue;
    }
    rows.push(
      `| ${post.output_path} | ${post.archetype ?? "-"} | ${post.domain ?? "-"} | ${r.axes.hook.score} | ${r.axes.structural.score} | ${r.axes.material.score} | ${r.axes.depth.score} | ${r.axes.relevance.score} | ${r.axes.anti_template.score} | ${r.overall} |`
    );
  }

  // Exemplar pick algorithm
  const archetypes = [
    "narrative",
    "technical-deep-dive",
    "investigation",
    "comparison",
    "explainer",
    "freeform",
  ];
  const picks = [];
  const coveredDomains = new Set();
  for (const a of archetypes) {
    const candidates = manifest.posts
      .filter((p) => p.archetype === a && p.kind === "deep-story")
      .map((p) => {
        const r = inputsByPath.get(p.output_path);
        if (!r) return null;
        const sum =
          r.axes.hook.score +
          r.axes.structural.score +
          r.axes.material.score +
          r.axes.depth.score +
          r.axes.relevance.score +
          r.axes.anti_template.score;
        const allSeven = Object.values(r.axes).every((x) => x.score >= 7);
        return { post: p, review: r, sum, allSeven };
      })
      .filter(Boolean)
      .filter((c) => c.allSeven);
    if (candidates.length === 0) {
      picks.push({ archetype: a, source: null, reason: "no posts with all six axes >= 7" });
      continue;
    }
    candidates.sort((x, y) => {
      if (y.sum !== x.sum) return y.sum - x.sum;
      const xCov = coveredDomains.has(x.post.domain) ? 1 : 0;
      const yCov = coveredDomains.has(y.post.domain) ? 1 : 0;
      return xCov - yCov;
    });
    const chosen = candidates[0];
    picks.push({
      archetype: a,
      source: chosen.post.output_path,
      sum: chosen.sum,
      review: chosen.review,
    });
    coveredDomains.add(chosen.post.domain);
  }

  const md = [
    `# Content Audit Report`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `Range: ${manifest.start} .. ${manifest.end}`,
    `Posts reviewed: ${manifest.posts.length}`,
    ``,
    `## Score table`,
    ``,
    `| Path | Archetype | Domain | Hook | Structural | Material | Depth | Relevance | Anti-tmpl | Status |`,
    `|---|---|---|---|---|---|---|---|---|---|`,
    ...rows,
    ``,
    `## Exemplar picks (mechanical; user may swap)`,
    ``,
    ...picks.map((p) =>
      p.source
        ? `- **${p.archetype}** → \`${p.source}\` (axes sum = ${p.sum})`
        : `- **${p.archetype}** → none (${p.reason})`
    ),
    ``,
    `## Posts with status BLOCKING or IMPORTANT`,
    ``,
    ...inputs
      .filter((r) => r.overall === "BLOCKING" || r.overall === "IMPORTANT")
      .map((r) => {
        const weak = Object.entries(r.axes)
          .filter(([_k, v]) => v.score <= 6)
          .map(
            ([k, v]) => `  - ${k}: ${v.score} — ${v.justification}`
          )
          .join("\n");
        return `- \`${r.output_path}\` — ${r.overall}\n${weak}`;
      }),
    ``,
  ].join("\n");

  await writeFile(outPath, md, "utf8");
  console.log(`Report written: ${outPath}`);
}
