import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  stripNonProse,
  scanTerms,
  scanPhrases,
} from "../skills/daily-news/scripts/check-zh-prose.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(
  here,
  "..",
  "skills/daily-news/scripts/check-zh-prose.mjs"
);
const TERMS = JSON.parse(
  readFileSync(
    join(here, "..", "skills/daily-news/data/zh-tw-terms.json"),
    "utf8"
  )
);

test("stripNonProse: removes script/style/pre/comment content, keeps svg text", () => {
  const html = `
    <p>正文在這裡</p>
    <script>const x = "代碼"; // decoy</script>
    <style>/* 內存 decoy */</style>
    <pre>緩存 decoy</pre>
    <!-- 視頻 decoy -->
    <svg><text>圖表標籤文字</text></svg>`;
  const out = stripNonProse(html);
  assert.ok(out.includes("正文在這裡"));
  assert.ok(out.includes("圖表標籤文字"), "svg <text> is prose, must stay");
  assert.ok(!out.includes("代碼"));
  assert.ok(!out.includes("內存"));
  assert.ok(!out.includes("緩存"));
  assert.ok(!out.includes("視頻"));
});

test("scanTerms: longest match wins — 數據庫 does not double-count 數據", () => {
  const hits = scanTerms("這個數據庫很快", TERMS);
  const froms = hits.map((h) => h.from);
  assert.ok(froms.includes("數據庫"));
  assert.ok(!froms.includes("數據"));
});

test("scanTerms: auto terms hit with counts and modes", () => {
  const hits = scanTerms("這段代碼把內存吃光，代碼要改", TERMS);
  const byFrom = Object.fromEntries(hits.map((h) => [h.from, h]));
  assert.equal(byFrom["代碼"].count, 2);
  assert.equal(byFrom["代碼"].mode, "auto");
  assert.equal(byFrom["內存"].count, 1);
});

test("scanPhrases: banned boilerplate hits", () => {
  const hits = scanPhrases(
    "值得注意的是，隨著大型語言模型的發展，工具會賦能開發者。"
  );
  const phrases = hits.map((h) => h.phrase);
  assert.ok(phrases.includes("值得注意的是"));
  assert.ok(phrases.some((p) => p.startsWith("隨著")));
  assert.ok(phrases.includes("賦能"));
});

test("scanPhrases: measured house-style prose passes clean", () => {
  const hits = scanPhrases(
    "io_uring 的提交佇列有兩個入口：SQ 與 CQ——但是這個設計在 5.19 之後變了。"
  );
  assert.equal(hits.length, 0);
});

test("CLI: dirty html exits 1, script-block decoys ignored", () => {
  const dir = mkdtempSync(join(tmpdir(), "zh-prose-"));
  writeFileSync(
    join(dir, "deep-bad.html"),
    `<p>眾所周知，這段代碼跑得很快。</p><script>const ok = "內存";</script>`
  );
  let status = 0;
  let output = "";
  try {
    execFileSync(process.execPath, [SCRIPT, dir], { encoding: "utf8" });
  } catch (e) {
    status = e.status;
    output = String(e.stdout) + String(e.stderr);
  }
  assert.equal(status, 1);
  assert.ok(output.includes("代碼"));
  assert.ok(output.includes("眾所周知"));
  assert.ok(!output.includes("內存"), "script-block decoy must not hit");
});

test("CLI: clean html + flag-only sidecar exits 0 and lists flags", () => {
  const dir = mkdtempSync(join(tmpdir(), "zh-prose-"));
  writeFileSync(
    join(dir, "deep-ok.html"),
    `<p>核心團隊支持這個提案，下一步是把 RFC 9000 §3.2 的規則落實到 driver。</p>`
  );
  writeFileSync(
    join(dir, "deep-ok.11tydata.json"),
    JSON.stringify({ title: "對象 lifetime 的故事", summary: "測試用" })
  );
  const out = execFileSync(process.execPath, [SCRIPT, dir], {
    encoding: "utf8",
  });
  assert.ok(out.includes("OK"));
  assert.ok(out.includes("對象"), "flag terms are listed for judgment");
});

test("scanPhrases: gap patterns do not span clause boundaries", () => {
  const hits = scanPhrases("隨著時間推移，模型的發展加速。");
  assert.equal(hits.length, 0);
});

test("scanPhrases: counts aggregate per pattern", () => {
  const hits = scanPhrases("賦能之後再賦能，最後又賦能。");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].count, 3);
});

test("CLI: auto term in sidecar fails the gate", () => {
  const dir = mkdtempSync(join(tmpdir(), "zh-prose-"));
  writeFileSync(
    join(dir, "deep-x.11tydata.json"),
    JSON.stringify({ title: "代碼審查的故事", summary: "ok" })
  );
  let status = 0;
  try {
    execFileSync(process.execPath, [SCRIPT, dir], { encoding: "utf8" });
  } catch (e) {
    status = e.status;
  }
  assert.equal(status, 1);
});

test("CLI: missing arg and nonexistent dir exit 2", () => {
  for (const args of [[], ["/nonexistent/zh-prose-dir"]]) {
    let status = 0;
    try {
      execFileSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });
    } catch (e) {
      status = e.status;
    }
    assert.equal(status, 2);
  }
});

test("CLI: directory with no scannable files exits 2", () => {
  const dir = mkdtempSync(join(tmpdir(), "zh-prose-"));
  writeFileSync(join(dir, "notes.txt"), "irrelevant");
  let status = 0;
  try {
    execFileSync(process.execPath, [SCRIPT, dir], { encoding: "utf8" });
  } catch (e) {
    status = e.status;
  }
  assert.equal(status, 2);
});

test("scanTerms: ok-mode guard — 演算法 consumes 算法 substring", () => {
  const hits = scanTerms("這個演算法比舊的演算法快", TERMS);
  const byFrom = Object.fromEntries(hits.map((h) => [h.from, h]));
  assert.ok(!byFrom["算法"], "auto substring must not fire inside the guard");
  assert.equal(byFrom["演算法"].mode, "ok");
  assert.equal(byFrom["演算法"].count, 2);
});

test("CLI: ok-mode guard terms are never reported and never fail", () => {
  const dir = mkdtempSync(join(tmpdir(), "zh-prose-"));
  writeFileSync(
    join(dir, "deep-algo.html"),
    `<p>這個演算法的複雜度是 O(n log n)，控制代碼由 kernel 管理。</p>`
  );
  const out = execFileSync(process.execPath, [SCRIPT, dir], {
    encoding: "utf8",
  });
  assert.ok(out.includes("OK"));
  assert.ok(!out.includes("演算法"), "ok guards are silent");
  assert.ok(!out.includes("算法」"), "no auto-substring report either");
});
