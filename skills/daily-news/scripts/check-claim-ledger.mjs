#!/usr/bin/env node
// check-claim-ledger.mjs — mechanical validation of Step 7.6 fact-check
// ledgers.
//
// Why this exists: the fact-check layer (references/fact-check.md) is a
// judgment pass run by a checker sub-agent, but its OUTPUT is structured —
// per-claim verdict × load × action × resolution. That structure makes the
// dangerous end-states mechanically detectable: a high-load unverifiable
// claim that survived the fix loop, an inflated hedge marked "none-needed",
// a fix loop that never completed ("pending-fix" still in the ledger), a
// checker that extracted 3 claims from a 1000-line deep-story. This script
// does NOT judge whether a verdict is correct (the evidence field + human
// PR review own that) — it proves the ledger is complete, internally
// consistent, and that every required action was resolved.
//
// Expected artifact layout (produced by Step 7.6 of the routine):
//
//   /tmp/vg-factcheck-YYYY-MM-DD/
//     <slug>-ledger.json    # one per published post (roundup + each deep)
//
// Usage:
//   node skills/daily-news/scripts/check-claim-ledger.mjs src/posts/YYYY/MM/DD/ [ledger-dir]
//
// [ledger-dir] overrides /tmp/vg-factcheck-YYYY-MM-DD (used by tests).
//
// Exit 0 = every ledger present, valid, and fully resolved (warnings
// allowed). Exit 1 = violations. Exit 2 = usage error.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ENUMS = {
  type: ["number", "quote", "attribution", "date-version", "causal", "superlative"],
  load: ["high", "medium", "low"],
  independence: ["corroborated", "echo", "single-source"],
  verdict: ["verified", "pending", "inferred", "unverifiable"],
  hedge_delta: ["none", "inflated", "deflated"],
  action: ["none", "correct", "hedge", "mark-inferred", "delete"],
  resolution: [
    "none-needed",
    "corrected",
    "hedged",
    "marked-inferred",
    "deleted",
    "accepted-with-flag",
  ],
  fetch_status: ["ok", "failed"],
};

const ROLLUP_ARCHETYPES = new Set(["weekly-rollup", "monthly-rollup"]);

// Minimum checked-claim floor for a deep-story: the brief demands ≥10 (or
// every claim when fewer than 10 exist in the post).
export const DEEP_MIN_CLAIMS = 10;

// Count roundup item cards. Every item lede carries at least one factual
// claim, so the roundup ledger must check at least this many claims.
export function countRoundupItems(html) {
  const m = html.match(/\bid="item-\d{2}"/g);
  return m ? m.length : 0;
}

// Validate one parsed ledger. Returns { violations: [...], warnings: [...] }.
// opts: { slug, postPath (repo-relative expected output_path), isDeep,
//         roundupItems (number, only for the roundup) }
export function validateLedger(ledger, opts) {
  const violations = [];
  const warnings = [];
  const v = (msg) => violations.push(`${opts.slug}: ${msg}`);
  const w = (msg) => warnings.push(`${opts.slug}: ${msg}`);

  if (typeof ledger.output_path !== "string" || ledger.output_path === "") {
    v("ledger missing output_path");
  } else if (opts.postPath && ledger.output_path !== opts.postPath) {
    v(`output_path "${ledger.output_path}" does not match post path "${opts.postPath}"`);
  }
  if (!Number.isInteger(ledger.checker_rounds) || ledger.checker_rounds < 1) {
    v("checker_rounds must be an integer >= 1");
  }

  const cov = ledger.coverage;
  if (
    !cov ||
    !Number.isInteger(cov.candidate_claims) ||
    !Number.isInteger(cov.checked) ||
    !Number.isInteger(cov.dropped_low_load)
  ) {
    v("coverage block missing or non-integer fields");
  } else {
    if (cov.candidate_claims !== cov.checked + cov.dropped_low_load) {
      v(
        `coverage mismatch: candidate_claims (${cov.candidate_claims}) != ` +
          `checked (${cov.checked}) + dropped_low_load (${cov.dropped_low_load})`
      );
    }
    if (cov.dropped_low_load > 0) {
      w(`${cov.dropped_low_load} candidate claim(s) dropped as low-load (listed for PR body)`);
    }
  }

  if (!Array.isArray(ledger.sources) || ledger.sources.length === 0) {
    v("sources[] missing or empty");
  } else {
    for (const [i, s] of ledger.sources.entries()) {
      if (typeof s.url !== "string" || s.url === "") v(`sources[${i}]: missing url`);
      if (!ENUMS.fetch_status.includes(s.fetch_status))
        v(`sources[${i}]: bad fetch_status "${s.fetch_status}"`);
      if (!("archive_url" in s)) {
        v(`sources[${i}]: archive_url field missing (null is allowed, absence is not)`);
      } else if (s.archive_url === null) {
        w(`sources[${i}] (${s.url}): no archive snapshot — link-rot risk`);
      }
    }
  }

  if (!Array.isArray(ledger.claims) || ledger.claims.length === 0) {
    v("claims[] missing or empty");
    return { violations, warnings };
  }

  const ids = new Set();
  for (const c of ledger.claims) {
    const id = c.id ?? "<no-id>";
    const cv = (msg) => violations.push(`${opts.slug} ${id}: ${msg}`);
    if (ids.has(id)) cv("duplicate claim id");
    ids.add(id);

    if (typeof c.claim_text !== "string" || c.claim_text === "")
      cv("missing claim_text");
    for (const field of ["type", "load", "independence", "verdict", "hedge_delta", "action"]) {
      if (!ENUMS[field].includes(c[field])) cv(`bad ${field} "${c[field]}"`);
    }
    if (c.resolution === "pending-fix") {
      cv("resolution still \"pending-fix\" — the Step 7.6c fix loop did not complete");
      continue;
    }
    if (!ENUMS.resolution.includes(c.resolution)) {
      cv(`bad resolution "${c.resolution}"`);
      continue;
    }

    // Consistency rules — see fact-check.md § Action matrix.
    if (c.action === "none" && c.resolution !== "none-needed")
      cv(`action "none" but resolution "${c.resolution}"`);
    if (c.action !== "none" && c.resolution === "none-needed")
      cv(`action "${c.action}" but resolution "none-needed"`);
    if (c.verdict === "verified" && (typeof c.evidence !== "string" || c.evidence === ""))
      cv("verdict verified requires verbatim evidence quote");
    if (c.verdict === "unverifiable" && !["corrected", "deleted"].includes(c.resolution))
      cv(
        `verdict unverifiable must resolve to corrected/deleted, got "${c.resolution}"`
      );
    if (
      c.resolution === "accepted-with-flag" &&
      !(c.verdict === "pending" && c.load !== "high")
    )
      cv(
        "accepted-with-flag is only legal for pending verdicts at medium/low load"
      );
    if (c.hedge_delta === "inflated" && c.action === "none")
      cv("hedge_delta inflated requires a fix action");
    if (
      c.verdict === "inferred" &&
      c.action === "none" &&
      (typeof c.note !== "string" || c.note === "")
    )
      cv(
        "inferred claim with action none needs a note (e.g. \"already marked as inference in text\")"
      );
  }

  // Claim-count floors. A checker that "checked" 3 claims on a 1000-line
  // deep-story did not run the extraction pass the brief demands.
  const checked = ledger.claims.length;
  if (opts.isDeep) {
    const floor = cov && Number.isInteger(cov.candidate_claims)
      ? Math.min(DEEP_MIN_CLAIMS, cov.candidate_claims)
      : DEEP_MIN_CLAIMS;
    if (checked < floor)
      v(
        `deep-story ledger has ${checked} checked claim(s); floor is ${floor} ` +
          `(min(${DEEP_MIN_CLAIMS}, candidate_claims))`
      );
  } else if (Number.isInteger(opts.roundupItems) && opts.roundupItems > 0) {
    if (checked < opts.roundupItems)
      v(
        `roundup ledger has ${checked} checked claim(s) for ${opts.roundupItems} ` +
          `items — every item lede carries at least one claim`
      );
  }

  return { violations, warnings };
}

function main() {
  const targetDir = process.argv[2];
  if (!targetDir) {
    process.stderr.write(
      "Usage: check-claim-ledger.mjs <src/posts/YYYY/MM/DD/> [ledger-dir]\n"
    );
    process.exit(2);
  }
  if (!existsSync(targetDir) || !statSync(targetDir).isDirectory()) {
    process.stderr.write(`No such directory: ${targetDir}\n`);
    process.exit(2);
  }

  const norm = targetDir.replace(/\/+$/, "");
  const parts = norm.split("/").slice(-3);
  if (parts.length !== 3 || !/^\d{4}$/.test(parts[0])) {
    process.stderr.write(
      `Cannot derive YYYY-MM-DD from path "${targetDir}" — expected .../YYYY/MM/DD/\n`
    );
    process.exit(2);
  }
  const dateSlug = `${parts[0]}-${parts[1]}-${parts[2]}`;
  const ledgerDir = process.argv[3] || `/tmp/vg-factcheck-${dateSlug}`;

  const slugs = readdirSync(targetDir)
    .filter((f) => f.endsWith(".11tydata.json"))
    .map((f) => f.replace(/\.11tydata\.json$/, ""));
  if (slugs.length === 0) {
    process.stderr.write(`${targetDir}: no posts found (no sidecars)\n`);
    process.exit(2);
  }

  // Weekly/monthly rollups synthesize from already-published roundups —
  // no new claims enter the site, so Step 7.6 does not run for them.
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
  if (isRollupDir) {
    process.stdout.write(
      `OK: rollup dir — Step 7.6 fact-check not required for ${targetDir}\n`
    );
    return;
  }

  const allViolations = [];
  const allWarnings = [];

  if (!existsSync(ledgerDir)) {
    allViolations.push(
      `Step 7.6 evidence missing: ${ledgerDir}/ does not exist. The ` +
        `fact-check pass must run for every post and write one ledger ` +
        `JSON per slug. There is no skip clause — see SKILL.md Step 7.6.`
    );
  } else {
    for (const slug of slugs) {
      const p = join(ledgerDir, `${slug}-ledger.json`);
      if (!existsSync(p)) {
        allViolations.push(
          `Step 7.6: missing fact-check ledger for ${slug} (expected ${p})`
        );
        continue;
      }
      let ledger;
      try {
        ledger = JSON.parse(readFileSync(p, "utf8"));
      } catch (e) {
        allViolations.push(`${slug}: ledger is not valid JSON (${e.message})`);
        continue;
      }
      const isDeep = slug.startsWith("deep-");
      let roundupItems = null;
      if (!isDeep) {
        try {
          roundupItems = countRoundupItems(
            readFileSync(join(norm, `${slug}.html`), "utf8")
          );
        } catch {
          roundupItems = null;
        }
      }
      const postPath = join(norm, `${slug}.html`);
      const { violations, warnings } = validateLedger(ledger, {
        slug,
        postPath,
        isDeep,
        roundupItems,
      });
      allViolations.push(...violations);
      allWarnings.push(...warnings);
    }
  }

  if (allWarnings.length) {
    process.stdout.write("Warnings (do not fail the gate):\n");
    for (const m of allWarnings) process.stdout.write(`  · ${m}\n`);
  }
  if (allViolations.length) {
    process.stderr.write(
      `\nClaim-ledger check FAILED for ${targetDir} (ledgers: ${ledgerDir})\n\n`
    );
    for (const m of allViolations) process.stderr.write(`  · ${m}\n`);
    process.stderr.write(
      `\nThis gate enforces SKILL.md Step 7.6. Fix by completing the ` +
        `fact-check fix loop (correct/hedge/mark/delete per ` +
        `references/fact-check.md), not by editing ledger verdicts to pass.\n`
    );
    process.exit(1);
  }
  process.stdout.write(
    `OK: fact-check ledgers complete and resolved for ${slugs.length} post(s) in ${targetDir}\n`
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
