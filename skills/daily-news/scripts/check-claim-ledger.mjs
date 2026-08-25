#!/usr/bin/env node
// check-claim-ledger.mjs — mechanical validation of per-post reading
// ledgers (Step 7b authoring discipline + Step 7.6 fact-check gate).
//
// Ledger-first design (2026-06-11 spec): authors build the ledger WHILE
// reading sources (notes = verbatim quote + hedge + interpretation,
// physically separated; perspective per source; 5-7 point spine before
// drafting). The Step 7.6 checker (a) traces every load-bearing claim to
// a note and (b) re-fetches sources to verify quotes are real. This script
// proves the artifact is complete and internally consistent — it does NOT
// judge whether a verdict is correct (the evidence field + human PR review
// own that).
//
// Ledgers are COMMITTED next to the post:
//   src/posts/YYYY/MM/DD/deep-<slug>.ledger.json  (full: spine+notes+claims)
//   src/posts/YYYY/MM/DD/roundup.ledger.json      (claims-only light check —
//   no notes[], no spine; trace rules skipped)
//
// Usage:
//   node skills/daily-news/scripts/check-claim-ledger.mjs src/posts/YYYY/MM/DD/
//
// Exit 0 = ledgers present, valid, fully resolved (warnings allowed).
// Exit 1 = violations. Exit 2 = usage error.

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
  hedge: ["hedged", "asserted"],
  timeliness: ["durable", "annual", "volatile"],
};

const ROLLUP_ARCHETYPES = new Set(["weekly-rollup", "monthly-rollup"]);

// Spine: 5-7 point argument backbone, written before drafting.
export const SPINE_MIN = 5;
export const SPINE_MAX = 7;

// Minimum checked-claim floor for a deep-story (brief demands >=10, or
// every claim when fewer exist in the post).
export const DEEP_MIN_CLAIMS = 10;

export function countRoundupItems(html) {
  const m = html.match(/\bid="item-\d{2}"/g);
  return m ? m.length : 0;
}

// Validate one parsed ledger.
// opts: { slug, postPath, isDeep, roundupItems }
// Returns { violations: [...], warnings: [...] }.
export function validateLedger(ledger, opts) {
  const violations = [];
  const warnings = [];
  const v = (msg) => violations.push(`${opts.slug}: ${msg}`);
  const w = (msg) => warnings.push(`${opts.slug}: ${msg}`);

  if (typeof ledger.output_path !== "string" || ledger.output_path === "") {
    v("ledger missing output_path");
  } else if (opts.postPath) {
    const tail = (p) => p.split("/").filter(Boolean).slice(-4).join("/");
    if (tail(ledger.output_path) !== tail(opts.postPath)) {
      v(
        `output_path "${ledger.output_path}" does not match post path ` +
          `"${opts.postPath}" (compared on trailing YYYY/MM/DD/<slug>.html)`
      );
    }
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
    if (
      Array.isArray(ledger.claims) &&
      cov.checked !== ledger.claims.length
    ) {
      v(
        `coverage.checked (${cov.checked}) != claims.length (${ledger.claims.length})`
      );
    }
    if (cov.dropped_low_load > 0) {
      w(`${cov.dropped_low_load} candidate claim(s) dropped as low-load (list in PR body)`);
    }
  }

  // --- sources ---
  const sourceUrls = new Set();
  if (!Array.isArray(ledger.sources) || ledger.sources.length === 0) {
    v("sources[] missing or empty");
  } else {
    for (const [i, s] of ledger.sources.entries()) {
      if (typeof s.url !== "string" || s.url === "") v(`sources[${i}]: missing url`);
      else sourceUrls.add(s.url);
      if (!ENUMS.fetch_status.includes(s.fetch_status))
        v(`sources[${i}]: bad fetch_status "${s.fetch_status}"`);
      if (!("archive_url" in s)) {
        v(`sources[${i}]: archive_url field missing (null is allowed, absence is not)`);
      } else if (s.archive_url === null) {
        w(`sources[${i}] (${s.url}): no archive snapshot — link-rot risk`);
      }
      if (opts.isDeep) {
        const p = s.perspective;
        const fields = ["mechanism", "tradeoff", "reader_use"];
        if (!p || fields.some((f) => typeof p[f] !== "string" || p[f] === "")) {
          v(
            `sources[${i}]: perspective incomplete — mechanism/tradeoff/reader_use ` +
              `all required per source (帶問題讀; see fact-check.md § The authoring discipline)`
          );
        }
      }
    }
  }

  // --- spine (deep only) ---
  if (opts.isDeep) {
    if (!Array.isArray(ledger.spine)) {
      v("spine missing — the 5-7 point argument backbone must be written before drafting");
    } else if (
      ledger.spine.length < SPINE_MIN ||
      ledger.spine.length > SPINE_MAX ||
      ledger.spine.some((s) => typeof s !== "string" || s === "")
    ) {
      v(
        `spine must be ${SPINE_MIN}-${SPINE_MAX} non-empty points, got ` +
          `${Array.isArray(ledger.spine) ? ledger.spine.length : "?"}`
      );
    }
  }

  // --- notes (deep only) ---
  const noteIds = new Set();
  if (opts.isDeep) {
    if (!Array.isArray(ledger.notes) || ledger.notes.length === 0) {
      v("notes[] missing or empty — the reading-time evidence layer is mandatory");
    } else {
      for (const n of ledger.notes) {
        const id = n.id ?? "<no-id>";
        const nv = (msg) => violations.push(`${opts.slug} ${id}: ${msg}`);
        if (noteIds.has(id)) nv("duplicate note id");
        noteIds.add(id);
        if (typeof n.quote !== "string" || n.quote === "")
          nv("note quote must be verbatim, non-empty source text");
        if (typeof n.url !== "string" || !sourceUrls.has(n.url))
          nv(`note url "${n.url}" not in sources[]`);
        if (!ENUMS.hedge.includes(n.hedge)) nv(`bad hedge "${n.hedge}"`);
        if (typeof n.interpretation !== "string")
          nv("interpretation field missing (empty string allowed; absence is not)");
        if (!ENUMS.timeliness.includes(n.timeliness))
          nv(`bad timeliness "${n.timeliness}"`);
      }
    }
  }

  // --- claims ---
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
      cv('resolution still "pending-fix" — the Step 7.6c fix loop did not complete');
      continue;
    }
    if (!ENUMS.resolution.includes(c.resolution)) {
      cv(`bad resolution "${c.resolution}"`);
      continue;
    }

    // Trace binding (deep only): a claim either traces to notes or is
    // an explicit inference.
    if (opts.isDeep) {
      if (!Array.isArray(c.note_ids)) {
        cv("note_ids must be an array");
      } else if (c.note_ids.length === 0) {
        if (c.verdict !== "inferred" && c.resolution !== "deleted")
          cv(
            `trace failure: empty note_ids with verdict "${c.verdict}" — ` +
              `a claim either traces to a note, is marked inferred, or was deleted`
          );
      } else {
        for (const nid of c.note_ids) {
          if (!noteIds.has(nid)) cv(`note_ids references missing note "${nid}"`);
        }
      }
    }

    // Consistency rules — see fact-check.md § Action matrix.
    if (c.action === "none" && c.resolution !== "none-needed")
      cv(`action "none" but resolution "${c.resolution}"`);
    if (c.action !== "none" && c.resolution === "none-needed")
      cv(`action "${c.action}" but resolution "none-needed"`);
    if (c.verdict === "verified" && (typeof c.evidence !== "string" || c.evidence === ""))
      cv("verdict verified requires verbatim evidence quote");
    if (c.verdict === "unverifiable" && !["corrected", "deleted"].includes(c.resolution))
      cv(`verdict unverifiable must resolve to corrected/deleted, got "${c.resolution}"`);
    if (
      c.resolution === "accepted-with-flag" &&
      !(c.verdict === "pending" && c.load !== "high")
    )
      cv("accepted-with-flag is only legal for pending verdicts at medium/low load");
    if (c.hedge_delta === "inflated" && c.action === "none")
      cv("hedge_delta inflated requires a fix action");
    if (
      c.verdict === "inferred" &&
      c.action === "none" &&
      (typeof c.note !== "string" || c.note === "")
    )
      cv('inferred claim with action none needs a note (e.g. "already marked as inference in text")');
  }

  // Claim-count floors.
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
        `roundup ledger has ${checked} checked claim(s) for ${opts.roundupItems} item(s) ` +
          `— every item lede carries at least one claim`
      );
  }

  return { violations, warnings };
}

function main() {
  const targetDir = process.argv[2];
  if (!targetDir) {
    process.stderr.write(
      "Usage: check-claim-ledger.mjs <src/posts/YYYY/MM/DD/>\n"
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

  const slugs = readdirSync(targetDir)
    .filter((f) => f.endsWith(".11tydata.json"))
    .map((f) => f.replace(/\.11tydata\.json$/, ""));
  if (slugs.length === 0) {
    process.stderr.write(`${targetDir}: no posts found (no sidecars)\n`);
    process.exit(2);
  }

  // Weekly/monthly rollups synthesize from already-published roundups —
  // no new claims enter the site, so Step 7.6 does not run for them. A
  // rollup can land in the same YYYY/MM/DD directory as that day's daily
  // roundup/deep-stories (e.g. Monday), so this is a per-slug exemption,
  // not a whole-directory one — a mixed directory still fact-checks its
  // non-rollup posts normally.
  const isRollupSlug = (slug) => {
    try {
      const data = JSON.parse(
        readFileSync(join(targetDir, `${slug}.11tydata.json`), "utf8")
      );
      return ROLLUP_ARCHETYPES.has(data.archetype);
    } catch {
      return false;
    }
  };
  const rollupSlugs = slugs.filter(isRollupSlug);
  const checkableSlugs = slugs.filter((slug) => !isRollupSlug(slug));
  if (checkableSlugs.length === 0) {
    process.stdout.write(
      `OK: rollup dir — Step 7.6 fact-check not required for ${targetDir}\n`
    );
    return;
  }

  const allViolations = [];
  const allWarnings = [];
  if (rollupSlugs.length > 0) {
    allWarnings.push(
      `skipped rollup post(s) sharing this directory (Step 7.6 not required): ${rollupSlugs.join(", ")}`
    );
  }

  for (const slug of checkableSlugs) {
    const p = join(norm, `${slug}.ledger.json`);
    if (!existsSync(p)) {
      allViolations.push(
        `Step 7.6: missing committed reading ledger for ${slug} (expected ${p}). ` +
          `There is no skip clause — see SKILL.md Step 7.6.`
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
    const { violations, warnings } = validateLedger(ledger, {
      slug,
      postPath: join(norm, `${slug}.html`),
      isDeep,
      roundupItems,
    });
    allViolations.push(...violations);
    allWarnings.push(...warnings);
  }

  if (allWarnings.length) {
    process.stdout.write("Warnings (do not fail the gate):\n");
    for (const m of allWarnings) process.stdout.write(`  · ${m}\n`);
  }
  if (allViolations.length) {
    process.stderr.write(
      `\nClaim-ledger check FAILED for ${targetDir}\n\n`
    );
    for (const m of allViolations) process.stderr.write(`  · ${m}\n`);
    process.stderr.write(
      `\nThis gate enforces SKILL.md Step 7.6. Fix by completing the ` +
        `authoring discipline / fix loop (correct/hedge/mark/delete per ` +
        `references/fact-check.md), not by editing ledger fields to pass.\n`
    );
    process.exit(1);
  }
  process.stdout.write(
    `OK: reading ledgers complete and resolved for ${checkableSlugs.length} post(s) in ${targetDir}\n`
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
