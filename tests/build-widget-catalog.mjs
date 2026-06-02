import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const OUT = "skills/daily-news/references/widget-catalog.md";

test("build-widget-catalog generates a list with feature-flags + suits", () => {
  execFileSync("node", ["scripts/build-widget-catalog.mjs"], { stdio: "pipe" });
  const md = fs.readFileSync(OUT, "utf8");
  assert.match(md, /AUTO-GENERATED/);
  assert.match(md, /feature-flags/);
  assert.match(md, /flag-matrix-demo/); // a suits tag
  assert.match(md, /\{% widget "feature-flags" %\}/); // usage line
});
