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
      title: w.title,
      summary: w.summary,
      suits: w.suits || [],
      interactive: (w.interactive || []).length > 0,
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
    .map((e) => ({ kind, kindLabel, tier, id: e.id, title: e.title, summary: e.summary, body: e.body, link: `/widgets/cookbook/${e.id}/` }));
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
