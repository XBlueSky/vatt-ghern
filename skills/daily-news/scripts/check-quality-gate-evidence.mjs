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

const slugs = readdirSync(targetDir)
  .filter((f) => f.endsWith(".11tydata.json"))
  .map((f) => f.replace(/\.11tydata\.json$/, ""));

if (slugs.length === 0) {
  process.stderr.write(`${targetDir}: no posts found (no sidecars)\n`);
  process.exit(1);
}

const violations = [];

// --- Step 7.5 evidence: dual-reviewer JSON per post ---
if (!existsSync(qualityDir)) {
  violations.push(
    `Step 7.5 evidence missing: ${qualityDir}/ does not exist. ` +
      `The dual-reviewer pass must run for every post and write ` +
      `reviewer JSON to this directory. "Wall-clock too tight" / ` +
      `"Opus budget consumed" is not a valid reason to skip — drop ` +
      `deep-stories (N → N-1) instead. See SKILL.md Step 7.5 "No ` +
      `skip clause exists".`
  );
} else {
  for (const slug of slugs) {
    const a = join(qualityDir, `${slug}-reviewer-A.json`);
    const b = join(qualityDir, `${slug}-reviewer-B.json`);
    if (!existsSync(a))
      violations.push(`Step 7.5: missing reviewer A output for ${slug} (expected ${a})`);
    if (!existsSync(b))
      violations.push(`Step 7.5: missing reviewer B output for ${slug} (expected ${b})`);
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
// Added 2026-05-23 after PR #35. The default deep-story count is N = 3.
// If N_final < 3, a Step 5 reason MUST be recorded in a sidecar file
// `/tmp/vg-quality-${dateSlug}/deep-count-justification.json` with shape:
//   { "target": 3, "actual": <N>, "reason": "<one of the legal reasons>" }
// Legal reasons (substring match, case-insensitive):
//   - "score" + "qualifying"          → fewer than 3 clusters scored ≥ 8
//   - "diversity" + "unsatisfiable"   → can't satisfy domain + archetype
//   - "url" + "refill" + "exhausted"  → Step 5d collision, no replacement
//   - "step 7.5" + "blocking"          → Step 7.5 retry exhausted
//   - "step 8.5" + "blocking"          → Step 8.5 visual unfixable
// Banned reason substrings (case-insensitive): "budget", "wallclock",
// "wall-clock", "dispatch cost", "opus quota".
const deepSlugs = slugs.filter((s) => s.startsWith("deep-"));
const deepCount = deepSlugs.length;
if (deepCount < 3) {
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
        "opus quota",
      ];
      const legalPatterns = [
        ["score", "qualifying"],
        ["diversity", "unsatisfiable"],
        ["url", "refill", "exhausted"],
        ["step 7.5", "blocking"],
        ["step 8.5", "blocking"],
      ];
      const containsBanned = bannedSubstrings.find((s) => reason.includes(s));
      if (containsBanned) {
        violations.push(
          `Step 5: deep-count justification cites "${containsBanned}" — ` +
            `this is one of the banned reasons. SKILL.md Step 5c "Budget / ` +
            `wallclock / dispatch cost is NEVER a Step 5 reason to trim". ` +
            `If runtime evidence later showed Step 7.5 / 8.5 couldn't fit, ` +
            `say so with the explicit "Step 7.5 blocking..." / "Step 8.5 ` +
            `blocking..." pattern; do not paraphrase it as "budget".`
        );
      } else {
        const matches = legalPatterns.some((pat) =>
          pat.every((s) => reason.includes(s))
        );
        if (!matches) {
          violations.push(
            `Step 5: deep-count justification reason "${parsed.reason}" ` +
              `does not match any of the 5 legal structural reasons. See ` +
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
    `  Step 8.5 screenshot artifacts: ${auditDir}/\n`
);
