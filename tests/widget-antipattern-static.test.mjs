import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scanWidgetStatic } from "../skills/daily-news/scripts/check-widget-static.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const FIX = join(here, "fixtures/widget-antipatterns");
const read = (n) => readFileSync(join(FIX, n), "utf8");

test("fake-table: <pre> in vg-w-table-* fires", () => {
  const findings = scanWidgetStatic(read("fake-table-flag.html"), "fake-table-flag.html");
  assert.ok(findings.some((f) => f.rule === "fake-table"));
});

test("fake-table: real <table> passes", () => {
  const findings = scanWidgetStatic(read("fake-table-pass.html"), "fake-table-pass.html");
  assert.ok(!findings.some((f) => f.rule === "fake-table"));
});

test("dead-svg-button: data-target without bridge fires", () => {
  const findings = scanWidgetStatic(read("dead-svg-button-flag.html"), "dead-svg-button-flag.html");
  assert.ok(findings.some((f) => f.rule === "dead-svg-button"));
});

test("dead-svg-button: data-target with bridge passes", () => {
  const findings = scanWidgetStatic(read("dead-svg-button-pass.html"), "dead-svg-button-pass.html");
  assert.ok(!findings.some((f) => f.rule === "dead-svg-button"));
});

import { execFileSync } from "node:child_process";

const SCRIPT = join(here, "..", "skills/daily-news/scripts/check-widget-static.mjs");

test("CLI: flag fixture exits 1", () => {
  let status = 0;
  try {
    execFileSync(process.execPath, [SCRIPT, join(FIX, "fake-table-flag.html")], { encoding: "utf8" });
  } catch (e) {
    status = e.status;
  }
  assert.equal(status, 1);
});

test("CLI: pass fixture exits 0", () => {
  const out = execFileSync(process.execPath, [SCRIPT, join(FIX, "fake-table-pass.html")], { encoding: "utf8" });
  assert.ok(out.includes("PASS"));
});

test("CLI: missing arg exits 2", () => {
  let status = 0;
  try {
    execFileSync(process.execPath, [SCRIPT], { encoding: "utf8" });
  } catch (e) {
    status = e.status;
  }
  assert.equal(status, 2);
});
