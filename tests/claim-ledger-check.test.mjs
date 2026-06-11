import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  validateLedger,
  countRoundupItems,
  DEEP_MIN_CLAIMS,
} from "../skills/daily-news/scripts/check-claim-ledger.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(
  here,
  "..",
  "skills/daily-news/scripts/check-claim-ledger.mjs"
);

function makeClaim(over = {}) {
  return {
    id: over.id ?? "c01",
    claim_text: "p99 延遲從 220ms 降到 38ms",
    location: "under H2「量測」",
    type: "number",
    load: "high",
    source_urls: ["https://example.com/post"],
    independence: "single-source",
    verdict: "verified",
    hedge_delta: "none",
    evidence: "p99 latency dropped from 220ms to 38ms",
    note: "",
    action: "none",
    resolution: "none-needed",
    ...over,
  };
}

function makeLedger(over = {}) {
  const claims =
    over.claims ??
    Array.from({ length: DEEP_MIN_CLAIMS }, (_, i) =>
      makeClaim({ id: `c${String(i + 1).padStart(2, "0")}` })
    );
  return {
    output_path: "src/posts/2026/06/12/deep-foo.html",
    checked_at: "2026-06-12",
    checker_rounds: 1,
    coverage: {
      candidate_claims: claims.length,
      checked: claims.length,
      dropped_low_load: 0,
    },
    sources: [
      {
        url: "https://example.com/post",
        fetch_status: "ok",
        archive_url: "https://web.archive.org/web/20260612000000/https://example.com/post",
        published: "2026-06-10",
      },
    ],
    ...over,
    claims,
  };
}

const DEEP_OPTS = {
  slug: "deep-foo",
  postPath: "src/posts/2026/06/12/deep-foo.html",
  isDeep: true,
  roundupItems: null,
};

test("validateLedger: fully-resolved ledger passes with no violations", () => {
  const { violations, warnings } = validateLedger(makeLedger(), DEEP_OPTS);
  assert.deepEqual(violations, []);
  assert.deepEqual(warnings, []);
});

test("validateLedger: pending-fix resolution means the fix loop never finished", () => {
  const claims = [makeClaim({ action: "correct", resolution: "pending-fix" })];
  const ledger = makeLedger({ claims });
  const { violations } = validateLedger(ledger, { ...DEEP_OPTS });
  assert.ok(violations.some((v) => v.includes("pending-fix")));
});

test("validateLedger: high-load unverifiable cannot be accepted-with-flag", () => {
  const claims = [
    makeClaim({
      verdict: "unverifiable",
      action: "correct",
      resolution: "accepted-with-flag",
    }),
  ];
  const { violations } = validateLedger(makeLedger({ claims }), DEEP_OPTS);
  assert.ok(
    violations.some((v) => v.includes("unverifiable must resolve to corrected/deleted"))
  );
});

test("validateLedger: accepted-with-flag legal only for pending at medium/low load", () => {
  const ok = makeClaim({
    verdict: "pending",
    load: "low",
    evidence: null,
    action: "hedge",
    resolution: "accepted-with-flag",
  });
  const bad = makeClaim({
    id: "c02",
    verdict: "pending",
    load: "high",
    evidence: null,
    action: "hedge",
    resolution: "accepted-with-flag",
  });
  const { violations } = validateLedger(makeLedger({ claims: [ok, bad] }), DEEP_OPTS);
  assert.equal(
    violations.filter((v) => v.includes("accepted-with-flag is only legal")).length,
    1
  );
  assert.ok(violations.some((v) => v.startsWith("deep-foo c02")));
});

test("validateLedger: inflated hedge requires a fix action", () => {
  const claims = [
    makeClaim({ verdict: "unverifiable", hedge_delta: "inflated", action: "none" }),
  ];
  const { violations } = validateLedger(makeLedger({ claims }), DEEP_OPTS);
  assert.ok(violations.some((v) => v.includes("inflated requires a fix action")));
});

test("validateLedger: verified claim requires verbatim evidence", () => {
  const claims = [makeClaim({ evidence: "" })];
  const { violations } = validateLedger(makeLedger({ claims }), DEEP_OPTS);
  assert.ok(violations.some((v) => v.includes("requires verbatim evidence")));
});

test("validateLedger: unmarked inference with action none needs a note", () => {
  const noNote = makeClaim({ verdict: "inferred", evidence: null, note: "" });
  const { violations } = validateLedger(makeLedger({ claims: [noNote] }), DEEP_OPTS);
  assert.ok(violations.some((v) => v.includes("needs a note")));

  const withNote = makeClaim({
    verdict: "inferred",
    evidence: null,
    note: "already marked as inference in text（「合理的推測是」）",
  });
  const r2 = validateLedger(makeLedger({ claims: [withNote] }), DEEP_OPTS);
  assert.deepEqual(r2.violations, []);
});

test("validateLedger: deep-story claim floor is min(DEEP_MIN_CLAIMS, candidates)", () => {
  // 3 checked of 20 candidates → violation
  const few = makeLedger({
    claims: [makeClaim(), makeClaim({ id: "c02" }), makeClaim({ id: "c03" })],
  });
  few.coverage = { candidate_claims: 20, checked: 3, dropped_low_load: 17 };
  const r1 = validateLedger(few, DEEP_OPTS);
  assert.ok(r1.violations.some((v) => v.includes("floor is 10")));

  // 3 checked of 3 candidates → fine (post genuinely has few claims)
  const all = makeLedger({
    claims: [makeClaim(), makeClaim({ id: "c02" }), makeClaim({ id: "c03" })],
  });
  const r2 = validateLedger(all, DEEP_OPTS);
  assert.deepEqual(r2.violations, []);
});

test("validateLedger: roundup must check at least one claim per item", () => {
  const ledger = makeLedger({
    output_path: "src/posts/2026/06/12/roundup.html",
    claims: [makeClaim(), makeClaim({ id: "c02" })],
  });
  const { violations } = validateLedger(ledger, {
    slug: "roundup",
    postPath: "src/posts/2026/06/12/roundup.html",
    isDeep: false,
    roundupItems: 10,
  });
  assert.ok(violations.some((v) => v.includes("every item lede carries at least one claim")));
});

test("validateLedger: coverage arithmetic must balance", () => {
  const ledger = makeLedger();
  ledger.coverage = { candidate_claims: 12, checked: 10, dropped_low_load: 1 };
  const { violations } = validateLedger(ledger, DEEP_OPTS);
  assert.ok(violations.some((v) => v.includes("coverage mismatch")));
});

test("validateLedger: null archive_url warns but does not fail; missing field fails", () => {
  const ledger = makeLedger();
  ledger.sources = [{ url: "https://a.example", fetch_status: "ok", archive_url: null, published: null }];
  const r1 = validateLedger(ledger, DEEP_OPTS);
  assert.deepEqual(r1.violations, []);
  assert.ok(r1.warnings.some((w) => w.includes("link-rot risk")));

  const ledger2 = makeLedger();
  ledger2.sources = [{ url: "https://a.example", fetch_status: "ok", published: null }];
  const r2 = validateLedger(ledger2, DEEP_OPTS);
  assert.ok(r2.violations.some((v) => v.includes("archive_url field missing")));
});

test("countRoundupItems: counts zero-padded item card ids", () => {
  const html = `
    <article id="item-01"></article>
    <article id="item-02"></article>
    <article id="item-10"></article>
    <a href="#item-01">anchor link, attribute is not id=</a>`;
  assert.equal(countRoundupItems(html), 3);
  assert.equal(countRoundupItems("<p>no items</p>"), 0);
});

// --- CLI tests ---

function makePostsDir() {
  const root = mkdtempSync(join(tmpdir(), "claim-ledger-"));
  const postsDir = join(root, "2026", "06", "12");
  mkdirSync(postsDir, { recursive: true });
  return { root, postsDir };
}

function runCli(args) {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, ...args], {
      encoding: "utf8",
    });
    return { status: 0, output: stdout };
  } catch (e) {
    return { status: e.status, output: String(e.stdout) + String(e.stderr) };
  }
}

test("CLI: complete resolved ledgers exit 0", () => {
  const { postsDir } = makePostsDir();
  const ledgerDir = mkdtempSync(join(tmpdir(), "vg-factcheck-"));
  writeFileSync(join(postsDir, "deep-foo.11tydata.json"), JSON.stringify({ archetype: "daily-deep-story" }));
  writeFileSync(join(postsDir, "deep-foo.html"), "<p>內文</p>");
  const ledger = makeLedger({ output_path: join(postsDir, "deep-foo.html") });
  writeFileSync(join(ledgerDir, "deep-foo-ledger.json"), JSON.stringify(ledger));
  const { status, output } = runCli([postsDir, ledgerDir]);
  assert.equal(status, 0);
  assert.ok(output.includes("OK"));
});

test("CLI: missing ledger for a post exits 1", () => {
  const { postsDir } = makePostsDir();
  const ledgerDir = mkdtempSync(join(tmpdir(), "vg-factcheck-"));
  writeFileSync(join(postsDir, "deep-foo.11tydata.json"), JSON.stringify({ archetype: "daily-deep-story" }));
  writeFileSync(join(postsDir, "deep-foo.html"), "<p>內文</p>");
  const { status, output } = runCli([postsDir, ledgerDir]);
  assert.equal(status, 1);
  assert.ok(output.includes("missing fact-check ledger"));
});

test("CLI: roundup ledger floor uses item count from the HTML", () => {
  const { postsDir } = makePostsDir();
  const ledgerDir = mkdtempSync(join(tmpdir(), "vg-factcheck-"));
  writeFileSync(join(postsDir, "roundup.11tydata.json"), JSON.stringify({ archetype: "daily-roundup" }));
  writeFileSync(
    join(postsDir, "roundup.html"),
    `<article id="item-01"></article><article id="item-02"></article><article id="item-03"></article>`
  );
  const ledger = makeLedger({
    output_path: join(postsDir, "roundup.html"),
    claims: [makeClaim(), makeClaim({ id: "c02" })],
  });
  writeFileSync(join(ledgerDir, "roundup-ledger.json"), JSON.stringify(ledger));
  const { status, output } = runCli([postsDir, ledgerDir]);
  assert.equal(status, 1);
  assert.ok(output.includes("3 items"));
});

test("CLI: rollup dir skips the gate entirely", () => {
  const { postsDir } = makePostsDir();
  writeFileSync(join(postsDir, "weekly.11tydata.json"), JSON.stringify({ archetype: "weekly-rollup" }));
  writeFileSync(join(postsDir, "weekly.html"), "<p>rollup</p>");
  const { status, output } = runCli([postsDir, "/nonexistent/ledger-dir"]);
  assert.equal(status, 0);
  assert.ok(output.includes("rollup dir"));
});

test("CLI: missing arg / bad dir / undateable path exit 2", () => {
  assert.equal(runCli([]).status, 2);
  assert.equal(runCli(["/nonexistent/posts-dir"]).status, 2);
  const flat = mkdtempSync(join(tmpdir(), "flat-"));
  writeFileSync(join(flat, "deep-x.11tydata.json"), "{}");
  assert.equal(runCli([flat]).status, 2);
});
