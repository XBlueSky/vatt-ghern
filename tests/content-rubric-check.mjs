#!/usr/bin/env node
// Validates content-quality rubric / reviewer brief / exemplar library
// internal consistency. No LLM calls. Run: node tests/content-rubric-check.mjs

import { readFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
};
const pass = (msg) => console.log(`ok: ${msg}`);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readMaybe(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

// 1. Rubric file exists and contains all 7 axes
const rubricPath = join(
  root,
  "skills/daily-news/references/content-quality-rubric.md"
);
const rubric = await readMaybe(rubricPath);
if (!rubric) {
  fail(`rubric file missing: ${rubricPath}`);
} else {
  const requiredAxes = [
    "## Axis 1 — Hook strength",
    "## Axis 2 — Structural coherence",
    "## Axis 3 — Material grounding",
    "## Axis 4 — Depth vs. paraphrase",
    "## Axis 5 — Relevance",
    "## Axis 6 — Intra-post anti-template",
    "## Axis 7 — Inter-post diversity",
  ];
  for (const axis of requiredAxes) {
    if (!rubric.includes(axis)) {
      fail(`rubric missing axis heading: ${axis}`);
    }
  }
  if (!rubric.includes("## Reviewer output format")) {
    fail("rubric missing 'Reviewer output format' section");
  }
  pass("rubric file structure");
}

// 2. Reviewer brief exists and references rubric + valid archetype refs
const briefPath = join(
  root,
  "skills/daily-news/references/content-reviewer-brief.md"
);
const brief = await readMaybe(briefPath);
if (!brief) {
  fail(`reviewer brief missing: ${briefPath}`);
} else {
  if (!brief.includes("content-quality-rubric.md")) {
    fail("reviewer brief does not reference content-quality-rubric.md");
  }
  if (!brief.includes("deep-{{archetype}}.md")) {
    fail("reviewer brief does not reference archetype template path");
  }
  if (!brief.includes("Read only")) {
    fail("reviewer brief should explicitly restrict tools to Read only");
  }
  pass("reviewer brief structure");
}

// 3. Exemplar INDEX exists; for each archetype, either both files
//    present or both absent (no half-populated slots)
const exemplarDir = join(root, "skills/daily-news/references/exemplars");
const indexPath = join(exemplarDir, "INDEX.md");
if (!(await exists(indexPath))) {
  fail(`exemplar INDEX missing: ${indexPath}`);
} else {
  const archetypes = [
    "narrative",
    "technical-deep-dive",
    "investigation",
    "comparison",
    "explainer",
    "freeform",
  ];
  for (const a of archetypes) {
    const html = await exists(join(exemplarDir, `${a}.html`));
    const md = await exists(join(exemplarDir, `${a}.md`));
    if (html !== md) {
      fail(
        `exemplar slot ${a} half-populated: html=${html} md=${md} ` +
          `(both must be present together, or both absent)`
      );
    }
  }
  pass("exemplar slots consistency");
}

// 4. Author brief mentions exemplar read (hard rule landed in Task 4)
const authorBriefPath = join(
  root,
  "skills/daily-news/references/deep-story-brief.md"
);
const authorBrief = await readMaybe(authorBriefPath);
if (!authorBrief) {
  fail(`author brief missing: ${authorBriefPath}`);
} else {
  if (!authorBrief.includes("exemplars/{{archetype}}.html")) {
    fail("author brief does not include exemplar hard rule");
  }
  if (!authorBrief.includes("calibration")) {
    fail(
      "author brief exemplar rule missing don't-clone framing keyword 'calibration'"
    );
  }
  pass("author brief exemplar hard rule");
}

// 5. SKILL.md references Step 7.5 in workflow
const skillPath = join(root, "skills/daily-news/SKILL.md");
const skill = await readMaybe(skillPath);
if (!skill) {
  fail(`SKILL.md missing: ${skillPath}`);
} else {
  if (!skill.includes("### Step 7.5: Content quality gate")) {
    fail("SKILL.md missing Step 7.5 section heading");
  }
  if (!skill.includes("## Content Quality Review")) {
    fail("SKILL.md PR body template missing 'Content Quality Review' section");
  }
  if (!skill.includes("## Reviewer disagreements")) {
    fail(
      "SKILL.md PR body template missing 'Reviewer disagreements' section"
    );
  }
  pass("SKILL.md Step 7.5 + PR body extensions");
}

if (process.exitCode) {
  console.error("\ncontent-rubric-check failed");
} else {
  console.log("\ncontent-rubric-check passed");
}
