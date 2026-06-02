#!/usr/bin/env node
/**
 * Regenerates skills/daily-news/references/widget-catalog.md from the catalog
 * sidecars. This .md is what the daily-news deep-story sub-agent reads (before
 * build) to decide whether to summon an existing catalog widget. Source of
 * truth = the *.widget.json sidecars. Run: npm run widgets:catalog
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const INC = path.join(ROOT, "src", "_includes", "widgets");
const OUT = path.join(ROOT, "skills", "daily-news", "references", "widget-catalog.md");

const sidecars = fs.existsSync(INC)
  ? fs.readdirSync(INC).filter((f) => f.endsWith(".widget.json")).sort()
  : [];

const lines = [];
lines.push("<!-- AUTO-GENERATED from src/_includes/widgets/*.widget.json — run `npm run widgets:catalog`. Do not hand-edit. -->");
lines.push("");
lines.push("# Catalog widgets — summon with `{% widget \"name\" %}`");
lines.push("");
lines.push("These are finished, reusable widgets. When a deep-story's concept question");
lines.push("matches a widget's **suits**, summon it instead of hand-writing an inline");
lines.push("widget. A summoned catalog widget counts toward the ≥5-widget floor and");
lines.push("satisfies the ≥1-interactive rule. Do NOT force a match — a contrived cast");
lines.push("is worse than a clean inline widget.");
lines.push("");

if (!sidecars.length) {
  lines.push("_No catalog widgets yet._");
} else {
  for (const file of sidecars) {
    const w = JSON.parse(fs.readFileSync(path.join(INC, file), "utf8"));
    lines.push(`## ${w.title} — \`${w.name}\``);
    lines.push("");
    lines.push(w.summary || "");
    lines.push("");
    lines.push(`- **suits**: ${(w.suits || []).join(", ") || "—"}`);
    lines.push(`- **interactive**: ${(w.interactive || []).join(", ") || "—"}`);
    lines.push(`- **usage**: \`{% widget "${w.name}" %}\``);
    lines.push("");
  }
}

fs.writeFileSync(OUT, lines.join("\n") + "\n");
console.log(`wrote ${OUT} (${sidecars.length} widget(s))`);
