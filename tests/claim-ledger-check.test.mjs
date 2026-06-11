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
  SPINE_MIN,
  SPINE_MAX,
} from "../skills/daily-news/scripts/check-claim-ledger.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(
  here,
  "..",
  "skills/daily-news/scripts/check-claim-ledger.mjs"
);

const SRC_URL = "https://example.com/post";

function makeNote(over = {}) {
  return {
    id: over.id ?? "n01",
    url: SRC_URL,
    quote: "p99 latency dropped from 220ms to 38ms",
    hedge: "asserted",
    interpretation: "整個 95% 的降幅來自移除一次 fsync",
    timeliness: "durable",
    ...over,
  };
}

function makeClaim(over = {}) {
  return {
    id: over.id ?? "c01",
    claim_text: "p99 延遲從 220ms 降到 38ms",
    location: "under H2「量測」",
    type: "number",
    load: "high",
    note_ids: ["n01"],
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

function makeDeepLedger(over = {}) {
  const claims =
    over.claims ??
    Array.from({ length: DEEP_MIN_CLAIMS }, (_, i) =>
      makeClaim({ id: `c${String(i + 1).padStart(2, "0")}` })
    );
  const base = {
    output_path: "src/posts/2026/06/12/deep-foo.html",
    spine: [
      "1. 延遲瓶頸在 fsync，不在網路",
      "2. 移除 fsync 的安全前提是 WAL 雙寫",
      "3. 雙寫的代價轉嫁到磁碟頻寬",
      "4. 頻寬換延遲在這個 workload 是淨賺",
      "5. 但複製延遲的 tail 變長了",
    ],
    sources: [
      {
        url: SRC_URL,
        fetch_status: "ok",
        archive_url:
          "https://web.archive.org/web/20260612000000/https://example.com/post",
        published: "2026-06-10",
        perspective: {
          mechanism: "fsync 移出熱路徑後由 WAL 雙寫補安全性",
          tradeoff: "磁碟頻寬換 tail latency",
          reader_use: "自家 write-heavy 服務可先量 fsync 佔比",
        },
      },
    ],
    notes: [makeNote()],
    checked_at: "2026-06-12",
    checker_rounds: 1,
    coverage: {
      candidate_claims: claims.length,
      checked: claims.length,
      dropped_low_load: 0,
    },
    ...over,
  };
  base.claims = claims;
  return base;
}

function makeRoundupLedger(over = {}) {
  const claims = over.claims ?? [
    makeClaim({ note_ids: [] , verdict: "verified" }),
  ];
  const base = {
    output_path: "src/posts/2026/06/12/roundup.html",
    sources: [
      {
        url: SRC_URL,
        fetch_status: "ok",
        archive_url: null,
        published: null,
      },
    ],
    checked_at: "2026-06-12",
    checker_rounds: 1,
    coverage: {
      candidate_claims: claims.length,
      checked: claims.length,
      dropped_low_load: 0,
    },
    ...over,
  };
  base.claims = claims;
  return base;
}

const DEEP_OPTS = {
  slug: "deep-foo",
  postPath: "src/posts/2026/06/12/deep-foo.html",
  isDeep: true,
  roundupItems: null,
};

const ROUNDUP_OPTS = {
  slug: "roundup",
  postPath: "src/posts/2026/06/12/roundup.html",
  isDeep: false,
  roundupItems: 1,
};

// --- happy paths ---

test("validateLedger: fully-resolved deep ledger passes", () => {
  const { violations } = validateLedger(makeDeepLedger(), DEEP_OPTS);
  assert.deepEqual(violations, []);
});

test("validateLedger: claims-only roundup ledger passes (no spine/notes)", () => {
  const { violations } = validateLedger(makeRoundupLedger(), ROUNDUP_OPTS);
  assert.deepEqual(violations, []);
});

// --- spine ---

test("validateLedger: deep ledger requires a 5-7 point spine", () => {
  const missing = makeDeepLedger();
  delete missing.spine;
  assert.ok(
    validateLedger(missing, DEEP_OPTS).violations.some((v) =>
      v.includes("spine")
    )
  );
  const short = makeDeepLedger({ spine: ["1", "2", "3"] });
  assert.ok(
    validateLedger(short, DEEP_OPTS).violations.some((v) =>
      v.includes("spine must be")
    )
  );
  const long = makeDeepLedger({
    spine: ["1", "2", "3", "4", "5", "6", "7", "8"],
  });
  assert.ok(
    validateLedger(long, DEEP_OPTS).violations.some((v) =>
      v.includes("spine must be")
    )
  );
});

// --- perspective ---

test("validateLedger: every deep source needs a complete perspective set", () => {
  const ledger = makeDeepLedger();
  ledger.sources[0].perspective = { mechanism: "x", tradeoff: "", reader_use: "y" };
  assert.ok(
    validateLedger(ledger, DEEP_OPTS).violations.some((v) =>
      v.includes("perspective")
    )
  );
});

// --- notes ---

test("validateLedger: note fields validated (quote, hedge enum, url in sources)", () => {
  const badQuote = makeDeepLedger({ notes: [makeNote({ quote: "" })] });
  assert.ok(
    validateLedger(badQuote, DEEP_OPTS).violations.some((v) =>
      v.includes("quote")
    )
  );
  const badHedge = makeDeepLedger({ notes: [makeNote({ hedge: "maybe" })] });
  assert.ok(
    validateLedger(badHedge, DEEP_OPTS).violations.some((v) =>
      v.includes("bad hedge")
    )
  );
  const strayUrl = makeDeepLedger({
    notes: [makeNote({ url: "https://other.example/x" })],
  });
  assert.ok(
    validateLedger(strayUrl, DEEP_OPTS).violations.some((v) =>
      v.includes("not in sources")
    )
  );
});

// --- trace binding ---

test("validateLedger: empty note_ids requires verdict inferred", () => {
  const ledger = makeDeepLedger({
    claims: [makeClaim({ note_ids: [] })],
  });
  ledger.coverage = { candidate_claims: 1, checked: 1, dropped_low_load: 0 };
  assert.ok(
    validateLedger(ledger, DEEP_OPTS).violations.some((v) =>
      v.includes("trace")
    )
  );
  const ok = makeDeepLedger({
    claims: [
      makeClaim({
        note_ids: [],
        verdict: "inferred",
        evidence: null,
        note: "marked as inference in text",
      }),
    ],
  });
  ok.coverage = { candidate_claims: 1, checked: 1, dropped_low_load: 0 };
  assert.deepEqual(validateLedger(ok, DEEP_OPTS).violations, []);
});

test("validateLedger: deleted claims are exempt from trace binding", () => {
  const ledger = makeDeepLedger({
    claims: [
      makeClaim({
        note_ids: [],
        verdict: "unverifiable",
        evidence: null,
        action: "delete",
        resolution: "deleted",
      }),
    ],
  });
  ledger.coverage = { candidate_claims: 1, checked: 1, dropped_low_load: 0 };
  assert.deepEqual(validateLedger(ledger, DEEP_OPTS).violations, []);
});

test("validateLedger: note_ids must reference existing notes", () => {
  const ledger = makeDeepLedger({
    claims: [makeClaim({ note_ids: ["n99"] })],
  });
  ledger.coverage = { candidate_claims: 1, checked: 1, dropped_low_load: 0 };
  assert.ok(
    validateLedger(ledger, DEEP_OPTS).violations.some((v) =>
      v.includes("n99")
    )
  );
});

// --- carried-over resolution rules (PR #71 semantics) ---

test("validateLedger: pending-fix means the fix loop never finished", () => {
  const ledger = makeDeepLedger({
    claims: [makeClaim({ action: "correct", resolution: "pending-fix" })],
  });
  ledger.coverage = { candidate_claims: 1, checked: 1, dropped_low_load: 0 };
  assert.ok(
    validateLedger(ledger, DEEP_OPTS).violations.some((v) =>
      v.includes("pending-fix")
    )
  );
});

test("validateLedger: unverifiable must resolve to corrected/deleted", () => {
  const ledger = makeDeepLedger({
    claims: [
      makeClaim({
        verdict: "unverifiable",
        action: "correct",
        resolution: "accepted-with-flag",
      }),
    ],
  });
  ledger.coverage = { candidate_claims: 1, checked: 1, dropped_low_load: 0 };
  assert.ok(
    validateLedger(ledger, DEEP_OPTS).violations.some((v) =>
      v.includes("corrected/deleted")
    )
  );
});

test("validateLedger: accepted-with-flag only for pending at medium/low load", () => {
  const ledger = makeDeepLedger({
    claims: [
      makeClaim({
        verdict: "pending",
        load: "high",
        evidence: null,
        action: "hedge",
        resolution: "accepted-with-flag",
      }),
    ],
  });
  ledger.coverage = { candidate_claims: 1, checked: 1, dropped_low_load: 0 };
  assert.ok(
    validateLedger(ledger, DEEP_OPTS).violations.some((v) =>
      v.includes("accepted-with-flag")
    )
  );
});

test("validateLedger: inflated hedge requires a fix action", () => {
  const ledger = makeDeepLedger({
    claims: [
      makeClaim({
        verdict: "unverifiable",
        hedge_delta: "inflated",
        action: "none",
      }),
    ],
  });
  ledger.coverage = { candidate_claims: 1, checked: 1, dropped_low_load: 0 };
  assert.ok(
    validateLedger(ledger, DEEP_OPTS).violations.some((v) =>
      v.includes("inflated")
    )
  );
});

test("validateLedger: verified claim requires verbatim evidence", () => {
  const ledger = makeDeepLedger({
    claims: [makeClaim({ evidence: "" })],
  });
  ledger.coverage = { candidate_claims: 1, checked: 1, dropped_low_load: 0 };
  assert.ok(
    validateLedger(ledger, DEEP_OPTS).violations.some((v) =>
      v.includes("evidence")
    )
  );
});

test("validateLedger: deep claim floor is min(DEEP_MIN_CLAIMS, candidates)", () => {
  const few = makeDeepLedger({
    claims: [makeClaim(), makeClaim({ id: "c02" }), makeClaim({ id: "c03" })],
  });
  few.coverage = { candidate_claims: 20, checked: 3, dropped_low_load: 17 };
  assert.ok(
    validateLedger(few, DEEP_OPTS).violations.some((v) =>
      v.includes("floor")
    )
  );
});

test("validateLedger: coverage arithmetic must balance", () => {
  const ledger = makeDeepLedger();
  ledger.coverage = { candidate_claims: 12, checked: 10, dropped_low_load: 1 };
  assert.ok(
    validateLedger(ledger, DEEP_OPTS).violations.some((v) =>
      v.includes("coverage mismatch")
    )
  );
});

test("validateLedger: coverage.checked must equal claims.length", () => {
  const ledger = makeDeepLedger();
  ledger.coverage = {
    candidate_claims: 12,
    checked: 12,
    dropped_low_load: 0,
  };
  assert.ok(
    validateLedger(ledger, DEEP_OPTS).violations.some((v) =>
      v.includes("claims.length")
    )
  );
});

test("validateLedger: null archive_url warns; missing field fails", () => {
  const ledger = makeDeepLedger();
  ledger.sources[0].archive_url = null;
  const r1 = validateLedger(ledger, DEEP_OPTS);
  assert.deepEqual(r1.violations, []);
  assert.ok(r1.warnings.some((w) => w.includes("link-rot")));

  const ledger2 = makeDeepLedger();
  delete ledger2.sources[0].archive_url;
  assert.ok(
    validateLedger(ledger2, DEEP_OPTS).violations.some((v) =>
      v.includes("archive_url")
    )
  );
});

test("validateLedger: roundup floor is one claim per item", () => {
  const ledger = makeRoundupLedger();
  const { violations } = validateLedger(ledger, {
    ...ROUNDUP_OPTS,
    roundupItems: 10,
  });
  assert.ok(violations.some((v) => v.includes("item")));
});

test("validateLedger: output_path matches on trailing date+slug, not absolute prefix", () => {
  const ledger = makeDeepLedger();
  const { violations } = validateLedger(ledger, {
    ...DEEP_OPTS,
    postPath: "/abs/checkout/elsewhere/src/posts/2026/06/12/deep-foo.html",
  });
  assert.deepEqual(violations, []);
  const wrong = validateLedger(ledger, {
    ...DEEP_OPTS,
    postPath: "src/posts/2026/06/13/deep-foo.html",
  });
  assert.ok(wrong.violations.some((v) => v.includes("does not match")));
});

test("validateLedger: inferred claim with action none needs a note", () => {
  const ledger = makeDeepLedger({
    claims: [
      makeClaim({ note_ids: [], verdict: "inferred", evidence: null, note: "" }),
    ],
  });
  ledger.coverage = { candidate_claims: 1, checked: 1, dropped_low_load: 0 };
  assert.ok(
    validateLedger(ledger, DEEP_OPTS).violations.some((v) =>
      v.includes("needs a note")
    )
  );
});

test("countRoundupItems: counts zero-padded item card ids", () => {
  const html = `
    <article id="item-01"></article>
    <article id="item-02"></article>
    <a href="#item-01">anchor</a>`;
  assert.equal(countRoundupItems(html), 2);
});

// --- CLI (ledgers live NEXT TO the posts, committed) ---

function makePostsDir() {
  const root = mkdtempSync(join(tmpdir(), "claim-ledger-"));
  const postsDir = join(root, "2026", "06", "12");
  mkdirSync(postsDir, { recursive: true });
  return postsDir;
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

test("CLI: committed ledgers next to posts exit 0", () => {
  const postsDir = makePostsDir();
  writeFileSync(
    join(postsDir, "deep-foo.11tydata.json"),
    JSON.stringify({ archetype: "daily-deep-story" })
  );
  writeFileSync(join(postsDir, "deep-foo.html"), "<p>內文</p>");
  const ledger = makeDeepLedger({
    output_path: "src/posts/2026/06/12/deep-foo.html",
  });
  writeFileSync(join(postsDir, "deep-foo.ledger.json"), JSON.stringify(ledger));
  const { status, output } = runCli([postsDir]);
  assert.equal(status, 0);
  assert.ok(output.includes("OK"));
});

test("CLI: missing ledger for a post exits 1", () => {
  const postsDir = makePostsDir();
  writeFileSync(
    join(postsDir, "deep-foo.11tydata.json"),
    JSON.stringify({ archetype: "daily-deep-story" })
  );
  writeFileSync(join(postsDir, "deep-foo.html"), "<p>內文</p>");
  const { status, output } = runCli([postsDir]);
  assert.equal(status, 1);
  assert.ok(output.includes("missing"));
});

test("CLI: roundup floor uses item count from the HTML", () => {
  const postsDir = makePostsDir();
  writeFileSync(
    join(postsDir, "roundup.11tydata.json"),
    JSON.stringify({ archetype: "daily-roundup" })
  );
  writeFileSync(
    join(postsDir, "roundup.html"),
    `<article id="item-01"></article><article id="item-02"></article><article id="item-03"></article>`
  );
  const ledger = makeRoundupLedger({
    output_path: "src/posts/2026/06/12/roundup.html",
  });
  writeFileSync(join(postsDir, "roundup.ledger.json"), JSON.stringify(ledger));
  const { status, output } = runCli([postsDir]);
  assert.equal(status, 1);
  assert.ok(output.includes("3 item"));
});

test("CLI: rollup dir skips the gate entirely", () => {
  const postsDir = makePostsDir();
  writeFileSync(
    join(postsDir, "weekly.11tydata.json"),
    JSON.stringify({ archetype: "weekly-rollup" })
  );
  writeFileSync(join(postsDir, "weekly.html"), "<p>rollup</p>");
  const { status, output } = runCli([postsDir]);
  assert.equal(status, 0);
  assert.ok(output.includes("rollup"));
});

test("CLI: missing arg / bad dir / undateable path exit 2", () => {
  assert.equal(runCli([]).status, 2);
  assert.equal(runCli(["/nonexistent/posts-dir"]).status, 2);
  const flat = mkdtempSync(join(tmpdir(), "flat-"));
  writeFileSync(join(flat, "deep-x.11tydata.json"), "{}");
  assert.equal(runCli([flat]).status, 2);
});
