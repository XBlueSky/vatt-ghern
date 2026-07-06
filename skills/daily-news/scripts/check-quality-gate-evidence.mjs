#!/usr/bin/env node
// check-quality-gate-evidence.mjs — verify Step 7.5 + 8.5 actually ran.
//
// Why this exists: PR #32 (2026-05-22) shipped 3 deep stories and the
// routine self-declared "Step 7.5 skipped because of Opus budget" and
// "Step 8.5 deferred (Minor)" in the PR body. Both were treated as soft
// notes. A widget shipped with a desktop grid + data-svg-scroll conflict
// that produced a 409 px squeezed SVG — visible in any screenshot, but no
// screenshot was ever taken. The mechanical SVG-legibility + SVG-overflow
// scripts both PASSed because the failure mode is layout-level, not
// per-element.
//
// This gate makes "skip" mechanically impossible: it looks on disk for the
// artifacts the two quality passes are supposed to produce, and exits 1 if
// any are missing. It does not judge the contents of the artifacts (that's
// the reviewer's and the human's job) — it only proves the work happened.
//
// Expected artifact layout (produced by Step 7.5 / 8.5 of the routine):
//
//   /tmp/vg-quality-YYYY-MM-DD/
//     <slug>-reviewer-A.json    # one per published post (roundup + each deep)
//     <slug>-reviewer-B.json
//
//   /tmp/vg-audit-YYYY-MM-DD/<slug>/
//     desktop-light.png        # 1280×900
//     desktop-dark.png
//     mobile-light.png         # 375×812
//     mobile-dark.png
//     (per-widget screenshots are recommended but not strictly required —
//      the four whole-page screenshots are the minimum proof)
//
//   src/posts/YYYY/MM/DD/<slug>.ledger.json   # Step 7b/7.6 reading ledger,
//     COMMITTED next to the post (presence-only here; schema + resolution
//     validation is check-claim-ledger.mjs's job)
//
// Usage:
//   node skills/daily-news/scripts/check-quality-gate-evidence.mjs src/posts/YYYY/MM/DD/
//
// Exit 0 = evidence found for every post. Exit 1 = missing evidence.

import { readdirSync, existsSync, statSync, readFileSync } from "node:fs";
import { join, basename } from "node:path";

const targetDir = process.argv[2];
if (!targetDir) {
  process.stderr.write(
    "Usage: check-quality-gate-evidence.mjs <src/posts/YYYY/MM/DD/>\n"
  );
  process.exit(2);
}

if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
  process.stderr.write(`No such directory: ${targetDir}\n`);
  process.exit(2);
}

// Derive YYYY-MM-DD from the path (last three components of the trimmed path).
const norm = targetDir.replace(/\/+$/, "");
const parts = norm.split("/").slice(-3);
if (parts.length !== 3 || !/^\d{4}$/.test(parts[0])) {
  process.stderr.write(
    `Cannot derive YYYY-MM-DD from path "${targetDir}" — expected .../YYYY/MM/DD/\n`
  );
  process.exit(2);
}
const dateSlug = `${parts[0]}-${parts[1]}-${parts[2]}`;

const qualityDir = `/tmp/vg-quality-${dateSlug}`;
const auditDir = `/tmp/vg-audit-${dateSlug}`;
const ROLLUP_ARCHETYPES = new Set(["weekly-rollup", "monthly-rollup"]);

const slugs = readdirSync(targetDir)
  .filter((f) => f.endsWith(".11tydata.json"))
  .map((f) => f.replace(/\.11tydata\.json$/, ""));

if (slugs.length === 0) {
  process.stderr.write(`${targetDir}: no posts found (no sidecars)\n`);
  process.exit(1);
}

// Detect whether every post in this dir is a rollup archetype.
// Weekly/monthly rollups don't produce deep stories or dual-reviewer passes
// (the fallback workflow for those skips Steps 2-7; only 8, 8.5, 9 run).
const isRollupDir = slugs.every((slug) => {
  try {
    const data = JSON.parse(
      readFileSync(join(targetDir, `${slug}.11tydata.json`), "utf8")
    );
    return ROLLUP_ARCHETYPES.has(data.archetype);
  } catch {
    return false;
  }
});

const violations = [];

// --- Step 7.5 evidence: dual-reviewer JSON per post ---
// Rollup posts skip Step 7.5 (no deep stories to review); this block is
// only required for daily-roundup / daily-deep-story batches.
if (!isRollupDir && !existsSync(qualityDir)) {
  violations.push(
    `Step 7.5 evidence missing: ${qualityDir}/ does not exist. ` +
      `The dual-reviewer pass must run for every post and write ` +
      `reviewer JSON to this directory. "Wall-clock too tight" / ` +
      `"Opus budget consumed" is not a valid reason to skip — drop ` +
      `deep-stories (N → N-1) instead. See SKILL.md Step 7.5 "No ` +
      `skip clause exists".`
  );
} else if (!isRollupDir) {
  for (const slug of slugs) {
    const a = join(qualityDir, `${slug}-reviewer-A.json`);
    const b = join(qualityDir, `${slug}-reviewer-B.json`);
    if (!existsSync(a))
      violations.push(`Step 7.5: missing reviewer A output for ${slug} (expected ${a})`);
    if (!existsSync(b))
      violations.push(`Step 7.5: missing reviewer B output for ${slug} (expected ${b})`);
  }
}

// --- Step 7.6 evidence: committed reading ledger per post ---
// Rollup posts synthesize from already-published roundups (no new claims),
// so Step 7.6 does not run for them — same guard as Step 7.5.
if (!isRollupDir) {
  for (const slug of slugs) {
    const p = join(norm, `${slug}.ledger.json`);
    if (!existsSync(p))
      violations.push(
        `Step 7.6: missing committed reading ledger for ${slug} (expected ${p}). ` +
          `Authors write it while reading sources (SKILL.md Step 7b); there is ` +
          `no skip clause.`
      );
  }
}

// --- Step 8.5 evidence: per-post screenshot quartet ---
if (!existsSync(auditDir)) {
  violations.push(
    `Step 8.5 evidence missing: ${auditDir}/ does not exist. ` +
      `The visual Playwright audit must run for every post and write ` +
      `desktop+mobile / light+dark screenshots here. "Mechanical ` +
      `invariants cover the highest-risk failures" is false — they ` +
      `cover SVG legibility floor + text overflow only, not layout ` +
      `regressions. See SKILL.md Step 8.5 "No skip clause exists".`
  );
} else {
  const requiredShots = [
    "desktop-light.png",
    "desktop-dark.png",
    "mobile-light.png",
    "mobile-dark.png",
  ];
  for (const slug of slugs) {
    const postDir = join(auditDir, slug);
    if (!existsSync(postDir)) {
      violations.push(`Step 8.5: missing screenshot dir for ${slug} (expected ${postDir}/)`);
      continue;
    }
    for (const shot of requiredShots) {
      const p = join(postDir, shot);
      if (!existsSync(p))
        violations.push(`Step 8.5: missing ${shot} for ${slug} (expected ${p})`);
    }
  }
}

// --- Step 5 evidence: deep-story count justification when N_deep < 3 ---
// Rollup posts (weekly/monthly) never produce deep stories — skip this gate.
const deepSlugs = slugs.filter((s) => s.startsWith("deep-"));
const deepCount = deepSlugs.length;
if (!isRollupDir && deepCount < 3) {
  const justificationPath = join(qualityDir, "deep-count-justification.json");
  if (!existsSync(justificationPath)) {
    violations.push(
      `Step 5: deep-story count is ${deepCount} (below default N=3) ` +
        `but ${justificationPath} is missing. SKILL.md Step 5c requires a ` +
        `named structural reason when N_final < 3. "Budget" / "wallclock" ` +
        `/ "dispatch cost" are NOT legal Step 5 reasons.`
    );
  } else {
    let parsed = null;
    try {
      parsed = JSON.parse(readFileSync(justificationPath, "utf8"));
    } catch (e) {
      violations.push(
        `Step 5: ${justificationPath} is not valid JSON (${e.message})`
      );
    }
    if (parsed) {
      const reason = String(parsed.reason || "").toLowerCase();
      const bannedSubstrings = [
        "budget",
        "wallclock",
        "wall-clock",
        "dispatch cost",
        "model quota",
      ];
      const legalPatterns = [
        ["score", "qualifying"],
        ["diversity", "unsatisfiable"],
        ["url", "refill", "exhausted"],
        ["step 7.5", "blocking"],
        ["step 8.5", "blocking"],
        ["step 7.6", "unverifiable"],
      ];
      const containsBanned = bannedSubstrings.find((s) => reason.includes(s));
      if (containsBanned) {
        violations.push(
          `Step 5: deep-count justification cites "${containsBanned}" — ` +
            `this is one of the banned reasons. SKILL.md Step 5c "Budget / ` +
            `wallclock / dispatch cost is NEVER a Step 5 reason to trim". ` +
            `If runtime evidence later showed Step 7.5 / 8.5 couldn't fit, ` +
            `say so with the explicit "Step 7.5 blocking..." / "Step 8.5 ` +
            `blocking..." / "Step 7.6 ... unverifiable ..." pattern; do not ` +
            `paraphrase it as "budget".`
        );
      } else {
        const matches = legalPatterns.some((pat) =>
          pat.every((s) => reason.includes(s))
        );
        if (!matches) {
          violations.push(
            `Step 5: deep-count justification reason "${parsed.reason}" ` +
              `does not match any of the 6 legal structural reasons. See ` +
              `SKILL.md Step 5c "Trimming N below 3 is ONLY legitimate ` +
              `when…" list.`
          );
        }
      }
      if (parsed.actual !== deepCount) {
        violations.push(
          `Step 5: justification says actual=${parsed.actual} but ` +
            `${deepCount} deep-story sidecars found on disk`
        );
      }
    }
  }
}

if (violations.length > 0) {
  process.stderr.write(
    `\nQuality-gate evidence check FAILED for ${targetDir}\n` +
      `(date slug: ${dateSlug})\n\n`
  );
  for (const v of violations) process.stderr.write(`  · ${v}\n`);
  process.stderr.write(
    `\nThis gate enforces SKILL.md Step 7.5 and 8.5. The routine must ` +
      `actually run these passes (not skip-and-declare-deviation) before ` +
      `publish. If you genuinely cannot fit the quality gate within the ` +
      `current run, the correct response is to drop deep-stories until ` +
      `the gate fits — not to ship with the gate skipped.\n`
  );
  process.exit(1);
}

process.stdout.write(
  `OK: quality-gate evidence present for ${slugs.length} post(s) in ${targetDir}\n` +
    `  Step 7.5 reviewer artifacts: ${qualityDir}/\n` +
    `  Step 7.6 reading ledgers: committed in ${targetDir}\n` +
    `  Step 8.5 screenshot artifacts: ${auditDir}/\n`
);
