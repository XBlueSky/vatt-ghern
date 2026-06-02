import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { checkCatalogTemplateRefs } from "./archetype-check.mjs";

const INC = path.join(process.cwd(), "src", "_includes", "widgets");
const STATIC = path.join(process.cwd(), "src", "static", "widgets");

const sidecars = fs.existsSync(INC)
  ? fs.readdirSync(INC).filter((f) => f.endsWith(".widget.json"))
  : [];

for (const file of sidecars) {
  const name = file.replace(/\.widget\.json$/, "");

  test(`catalog widget "${name}" has the full trio`, () => {
    assert.ok(fs.existsSync(path.join(INC, `${name}.njk`)), `${name}.njk missing`);
    assert.ok(fs.existsSync(path.join(STATIC, `${name}.js`)), `${name}.js missing`);
  });

  test(`catalog widget "${name}" sidecar has required fields`, () => {
    const s = JSON.parse(fs.readFileSync(path.join(INC, file), "utf8"));
    for (const k of ["name", "title", "summary", "suits", "interactive", "instance_state", "key_idioms"]) {
      assert.ok(k in s, `sidecar missing ${k}`);
    }
    assert.equal(s.name, name, "sidecar name must match filename");
  });

  test(`catalog widget "${name}" JS has idempotency guard + no stray document.*`, () => {
    const js = fs.readFileSync(path.join(STATIC, `${name}.js`), "utf8");
    const guardName = `__vgWidget_${name.replace(/-/g, "_")}__bound`;
    assert.ok(js.includes(guardName), `guard ${guardName} missing`);
    // Exactly one document.* selector allowed (the bindAll querySelectorAll).
    const docHits = [...js.matchAll(/document\.(querySelector|querySelectorAll|getElementById)/g)];
    assert.ok(docHits.length <= 1, `expected ≤1 document.* selector (bindAll), found ${docHits.length}`);
    // The bare-svg affordance trap: never root.querySelector('svg').
    assert.ok(
      !/\broot\.querySelector\(\s*['"]svg['"]\s*\)/.test(js),
      "bare root.querySelector('svg') is the affordance-icon trap — target svg.vg-w-<name>-main"
    );
  });

  test(`catalog widget "${name}" partial scopes every <style> selector under .vg-w-`, () => {
    const njk = fs.readFileSync(path.join(INC, `${name}.njk`), "utf8");
    const styleMatch = njk.match(/<style>([\s\S]*?)<\/style>/);
    if (!styleMatch) return; // a style-less partial is allowed
    const selectors = styleMatch[1].match(/^[^{}\n]+\{/gm) || [];
    for (const sel of selectors) {
      if (/@media|@container|@supports|to\s*\{|from\s*\{|\d+%\s*\{/.test(sel)) continue; // at-rules + keyframes
      assert.ok(sel.includes(".vg-w-"), `unscoped selector in ${name}.njk: ${sel.trim()}`);
    }
  });

  test(`catalog widget "${name}" partial has no <script> tag`, () => {
    const njk = fs.readFileSync(path.join(INC, `${name}.njk`), "utf8");
    assert.ok(!/<script\b/.test(njk), "catalog partials must keep JS in src/static/widgets/<name>.js, not inline");
  });
}

test("widget-catalog-check ran against at least one widget", () => {
  assert.ok(sidecars.length >= 1, "expected ≥1 catalog widget");
});

test("catalog:<name> in widget_templates must resolve to an existing trio", () => {
  // A present catalog widget resolves with no errors.
  assert.deepEqual(checkCatalogTemplateRefs(["catalog:feature-flags", "data-driven-chart"]), []);
  // A missing catalog widget is reported.
  const errs = checkCatalogTemplateRefs(["catalog:does-not-exist"]);
  assert.equal(errs.length, 1);
  assert.match(errs[0], /does-not-exist/);
  // Non-catalog (cookbook) ids are ignored by this check.
  assert.deepEqual(checkCatalogTemplateRefs(["data-driven-chart", "tab-switcher-pure-css"]), []);
});
