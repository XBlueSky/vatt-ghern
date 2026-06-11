#!/usr/bin/env node
// check-zh-prose.mjs — zh-TW prose gate for a freshly-authored day's posts.
//
// Reads:
//   - argv[2] = directory of today's posts, e.g. src/posts/2026/06/12/
//   - lexicon at ../data/zh-tw-terms.json (auto/flag, CC BY-SA — see
//     ../data/NOTICE.md)
//
// Checks every *.html (script/style/pre/comments stripped; SVG <text> and
// attribute prose like data-mobile-summary stay in) and every
// *.11tydata.json (raw text — title/summary/widget_questions are prose):
//
//   1. zh-CN terminology (lexicon `auto` entries, longest-match,
//      non-overlapping) — any hit fails.
//   2. AI-boilerplate phrases (finite high-confidence set below) — any
//      hit fails.
//   3. Lexicon `flag` entries (同形詞: 程序/對象/質量/支持…) — listed for
//      context judgment, never fail.
//
// Gradient prose problems (rhythm, translation-ese, register) are NOT
// scanned here — they belong to rubric Axis 8 (reviewer judgment). Rules
// for authors live in references/zh-tw-prose.md; keep the phrase list
// below in sync with that file's §2 and §4.
//
// Exit 0 = clean (flag hits allowed). Exit 1 = auto/phrase hits. Exit 2 =
// usage error.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const TERMS_PATH = join(here, "..", "data", "zh-tw-terms.json");

// Finite, high-confidence set. Anything debatable goes to Axis 8, not here.
export const BANNED_PHRASES = [
  // 時代開場
  { pattern: "隨著.{1,12}的(發展|興起|普及|演進)", label: "時代開場" },
  { pattern: "在(當今|這個).{0,10}的?時代", label: "時代開場" },
  { pattern: "在.{1,8}的浪潮(中|下)", label: "時代開場" },
  // 共識開場
  { pattern: "眾所周知", label: "共識開場" },
  { pattern: "不言而喻", label: "共識開場" },
  { pattern: "毋庸置疑", label: "共識開場" },
  // 宣告開場
  { pattern: "值得(注意|一提|關注)的是", label: "宣告開場" },
  { pattern: "不難發現", label: "宣告開場" },
  // 總結套話
  { pattern: "綜上所述", label: "總結套話" },
  { pattern: "總而言之", label: "總結套話" },
  // 結尾套話
  { pattern: "讓我們拭目以待", label: "結尾套話" },
  { pattern: "未來可期", label: "結尾套話" },
  { pattern: "攜手(共進|並進|前行)", label: "結尾套話" },
  { pattern: "開啟.{0,8}新篇章", label: "結尾套話" },
  { pattern: "值得我們深思", label: "結尾套話" },
  // 互聯網黑話（高信心子集；痛點/落地/賽道 等灰色詞歸 Axis 8）
  { pattern: "賦能", label: "互聯網黑話" },
  { pattern: "抓手", label: "互聯網黑話" },
  { pattern: "閉環", label: "互聯網黑話" },
  { pattern: "打法", label: "互聯網黑話" },
  { pattern: "顆粒度", label: "互聯網黑話" },
];

export function stripNonProse(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<pre\b[\s\S]*?<\/pre>/gi, " ");
}

// Longest-match, non-overlapping scan (same semantics as upstream
// zh-tw-terms.mjs): at each position take the longest matching term,
// then skip its length. Prevents 數據庫 counting as 數據 + 庫.
export function scanTerms(text, terms) {
  const sorted = [...terms].sort((a, b) => b.from.length - a.from.length);
  const counts = new Map();
  for (let i = 0; i < text.length; ) {
    let matched = null;
    for (const t of sorted) {
      if (text.startsWith(t.from, i)) {
        matched = t;
        break;
      }
    }
    if (matched) {
      const cur = counts.get(matched.from);
      if (cur) cur.count += 1;
      else counts.set(matched.from, { ...matched, count: 1 });
      i += matched.from.length;
    } else {
      i += 1;
    }
  }
  return [...counts.values()];
}

export function scanPhrases(text) {
  const hits = [];
  for (const { pattern, label } of BANNED_PHRASES) {
    const matches = text.match(new RegExp(pattern, "g"));
    if (matches) {
      hits.push({ phrase: matches[0], pattern, label, count: matches.length });
    }
  }
  return hits;
}

function main() {
  const targetDir = process.argv[2];
  if (!targetDir) {
    process.stderr.write("Usage: check-zh-prose.mjs <src/posts/YYYY/MM/DD/>\n");
    process.exit(2);
  }
  if (!existsSync(targetDir)) {
    process.stderr.write(`No such directory: ${targetDir}\n`);
    process.exit(2);
  }

  const terms = JSON.parse(readFileSync(TERMS_PATH, "utf8"));
  const files = readdirSync(targetDir).filter(
    (f) => f.endsWith(".html") || f.endsWith(".11tydata.json")
  );

  let failures = 0;
  const flagLines = [];

  for (const f of files) {
    const raw = readFileSync(join(targetDir, f), "utf8");
    const text = f.endsWith(".html") ? stripNonProse(raw) : raw;

    for (const hit of scanTerms(text, terms)) {
      if (hit.mode === "auto") {
        failures += hit.count;
        process.stderr.write(
          `${f}: 中國用語「${hit.from}」→「${hit.to}」 ×${hit.count}\n`
        );
      } else {
        flagLines.push(
          `${f}: ⚠ 同形詞「${hit.from}」→「${hit.to}」 ×${hit.count}` +
            (hit.note ? `（${hit.note}）` : "")
        );
      }
    }
    for (const hit of scanPhrases(text)) {
      failures += hit.count;
      process.stderr.write(
        `${f}: ${hit.label}「${hit.phrase}」 ×${hit.count}\n`
      );
    }
  }

  if (flagLines.length) {
    process.stdout.write("需人工判斷（不擋 gate）：\n");
    for (const l of flagLines) process.stdout.write(l + "\n");
  }

  if (failures > 0) {
    process.stderr.write(
      `\n${failures} 處命中。修法見 skills/daily-news/references/zh-tw-prose.md。\n`
    );
    process.exit(1);
  }
  process.stdout.write(`OK: zh-prose clean in ${targetDir}\n`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
