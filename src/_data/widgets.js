/**
 * Aggregates widget-like assets into one collection for the /widgets/ gallery:
 *   1. Catalog widgets  — src/_includes/widgets/*.widget.json
 *   2. Cookbook hero    — skills/daily-news/references/widget-cookbook/tier-1-golden/*.md
 *   3. Cookbook snippet — skills/daily-news/references/widget-cookbook/tier-2-snippets/*.md
 *
 * RETIRED excludes the two patterns vatt-ghern bans (scroll-driven family).
 * NOTE: intersection-observer-reveal is NOT retired here — it is a valid
 * vatt-ghern tier-2 snippet (kaer-morhen retires it; vatt-ghern does not).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RETIRED = new Set(["scroll-driven-explanation", "css-scroll-timeline"]);

// zh-Hant display labels for the /widgets/ gallery. The cookbook .md files and
// widget sidecars keep English technical names (the .md is AI-facing template
// material); this map overrides what READERS see on the public gallery so the
// site stays zh-Hant-first. English technical terms (Canvas, SVG, CSS, rAF,
// IntersectionObserver, API…) are preserved inside the Chinese per PRODUCT.md.
// Keyed by widget/template id.
const LABELS_ZH = {
  // catalog widgets
  "feature-flags": {
    title: "Feature flag 矩陣",
    summary: "feature flag 的即時 JSON 檢視:每個環境各有開關、可調 rollout 百分比,任何更動都即時重新產生輸出。",
  },
  // cookbook hero (tier 1)
  "annotated-diagram-walkthrough": {
    title: "標註式架構圖走查",
    summary: "適合拆解多元件架構的 hero 樣板:逐塊點選,顯示每個元件負責什麼、不碰什麼。",
  },
  "data-driven-chart": {
    title: "資料驅動圖表",
    summary: "適合需要呈現真實數據的 hero 樣板:用程式化的軸、刻度、序列把數字畫成圖,而非手調到「看起來對」。",
  },
  "interactive-param-demo": {
    title: "互動參數示範",
    summary: "適合回答「X 對 Y 有多敏感」的 hero 樣板:拉一個 slider 掃過連續變數,曲線即時重畫,讓讀者親手感受形狀。",
  },
  "mini-canvas-simulation": {
    title: "迷你 Canvas 模擬",
    summary: "適合核心洞察是「動態隨時間演變」的 hero 樣板:Canvas + rAF 迴圈,可暫停 / 重置。",
  },
  // cookbook snippet (tier 2)
  "before-after-slider": {
    title: "前後對比滑桿",
    summary: "兩張圖疊在一起,中間一條可拖曳的分隔線,左右滑動揭露差異。",
  },
  "canvas-2d-loop": {
    title: "Canvas 2D rAF 迴圈",
    summary: "Canvas 動畫最精簡的主迴圈,內建暫停 / 重置與 DPR-aware 尺寸處理。",
  },
  "css-3d-transform": {
    title: "CSS 3D 變換",
    summary: "用 perspective + rotateX/Y/Z 做分層結構圖,讓堆疊關係有立體感。",
  },
  "css-container-query": {
    title: "CSS Container Query",
    summary: "用 @container 讓 widget 依容器寬度自適應排版,而非依視窗寬度。",
  },
  "draggable-svg-handle": {
    title: "可拖曳 SVG 把手",
    summary: "用 pointer events 在 SVG 內拖一個圓(或任意元素),並把座標夾在 viewBox 範圍內。",
  },
  "intersection-observer-reveal": {
    title: "IntersectionObserver 進場揭露",
    summary: "元素進入 / 離開視窗時觸發 callback:scroll 敘事、延遲初始化、段落閱讀追蹤的基礎建材。",
  },
  "matter-of-fact-table": {
    title: "平實資料表",
    summary: "Spectral serif 表頭 + tabular 數字的資料表,選用時可加排序 JS。",
  },
  "range-input-binding": {
    title: "Range 輸入綁定",
    summary: "把 <input type=range> 接上即時數值讀出與重畫 callback。",
  },
  "stack-cards-svg-fallback": {
    title: "堆疊卡片 + SVG 降級",
    summary: "堆疊型 widget(N 層 / N 階段)的雙渲染:手機顯示會自然換行的 HTML 卡片,桌機顯示寬版 SVG 圖,同一組 radio 驅動兩者。",
  },
  "svg-path-morph": {
    title: "SVG 路徑變形",
    summary: "在兩個 SVG path d 屬性之間內插,做出平滑的形狀過場。",
  },
  "tab-switcher-pure-css": {
    title: "純 CSS 分頁切換",
    summary: "用 :has() + radio 做分頁,零 JS。被選的分頁內容顯示,其餘隱藏。",
  },
  "timeline-scrubber": {
    title: "時間軸刷桿",
    summary: "水平時間軸加一個可拖曳的把手,圖隨把手位置更新到對應時間點。",
  },
  "tooltip-popover-anchor": {
    title: "CSS Anchor 定位的 Tooltip / Popover",
    summary: "用 CSS anchor-positioning 讓 popover 相對錨點元素定位,並提供 @supports 降級。",
  },
  "view-transition-api": {
    title: "View Transition API",
    summary: "用 document.startViewTransition() 跑一段 callback,再為前後狀態之間的差異補上過場動畫。",
  },
  "web-animations-api": {
    title: "Web Animations API",
    summary: "用 element.animate() 取得 CSS keyframes 之外更精確的時間控制。",
  },
};

const REPO_ROOT = path.join(__dirname, "..", "..");
const INC_WIDGETS = path.join(REPO_ROOT, "src", "_includes", "widgets");
const COOKBOOK = path.join(REPO_ROOT, "skills", "daily-news", "references", "widget-cookbook");
const COOKBOOK_T1 = path.join(COOKBOOK, "tier-1-golden");
const COOKBOOK_T2 = path.join(COOKBOOK, "tier-2-snippets");

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function parseCookbookMd(file) {
  const text = fs.readFileSync(file, "utf8");
  const id = path.basename(file, ".md");
  const titleMatch = text.match(/^#\s+(.+)$/m);
  const summaryMatch = text.match(/^>\s+(.+(?:\n>\s+.+)*)/m);
  const title = (titleMatch ? titleMatch[1] : id).replace(/^Tier\s+\d+\s+—\s+/, "");
  const summary = summaryMatch ? summaryMatch[1].replace(/\n>\s+/g, " ").trim() : "";
  const body = text.replace(/^#\s+.+$/m, "").trimStart();
  return { id, title, summary, body };
}

function loadCatalog() {
  if (!fs.existsSync(INC_WIDGETS)) return [];
  return fs.readdirSync(INC_WIDGETS)
    .filter((f) => f.endsWith(".widget.json"))
    .map((f) => readJSON(path.join(INC_WIDGETS, f)))
    .map((w) => ({
      kind: "catalog",
      kindLabel: "Catalog · shortcode",
      id: w.name,
      title: (LABELS_ZH[w.name] && LABELS_ZH[w.name].title) || w.title,
      summary: (LABELS_ZH[w.name] && LABELS_ZH[w.name].summary) || w.summary,
      suits: w.suits || [],
      interactive: (w.interactive || []).length > 0,
      instanceState: w.instance_state || "in-memory",
      keyIdioms: w.key_idioms || [],
      link: `/widgets/catalog/${w.name}/`,
    }));
}

function loadCookbookTier(dir, kind, kindLabel, tier) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parseCookbookMd(path.join(dir, f)))
    .filter((e) => !RETIRED.has(e.id))
    .map((e) => ({
      kind, kindLabel, tier, id: e.id,
      // zh-Hant title/summary for the public gallery; body keeps the English
      // .md recipe (it's the paste-and-modify source, shown in a <details>).
      title: (LABELS_ZH[e.id] && LABELS_ZH[e.id].title) || e.title,
      summary: (LABELS_ZH[e.id] && LABELS_ZH[e.id].summary) || e.summary,
      body: e.body,
      link: `/widgets/cookbook/${e.id}/`,
    }));
}

const catalog = loadCatalog();
const hero = loadCookbookTier(COOKBOOK_T1, "cookbook-hero", "Cookbook hero · tier 1", 1);
const snippets = loadCookbookTier(COOKBOOK_T2, "cookbook-snippet", "Cookbook snippet · tier 2", 2);
const cookbookEntries = [...hero, ...snippets];

export default {
  groups: [
    { kind: "catalog", label: "Catalog 元件", sub: "以 {% widget %} 短碼重複使用", items: catalog },
    { kind: "cookbook-hero", label: "Cookbook hero 範本", sub: "Tier-1 行內圖樣板", items: hero },
    { kind: "cookbook-snippet", label: "Cookbook 片段", sub: "Tier-2 能力片段", items: snippets },
  ],
  catalogEntries: catalog,
  cookbookEntries,
  totals: { catalog: catalog.length, hero: hero.length, snippets: snippets.length, all: catalog.length + hero.length + snippets.length },
};
