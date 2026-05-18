#!/usr/bin/env node
// build-card.mjs — Generate src/static/today.svg, an embeddable card
// showing today's roundup title + top 3 item headlines + sigil.
//
// Self-contained SVG: no external CSS, no JS, no <script>. Survives
// GitHub's markdown sanitiser. Width 600, height 320.

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, "..");
const POSTS_DIR = join(REPO_ROOT, "src", "posts");
const OUT = join(REPO_ROOT, "src", "static", "today.svg");

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Find the most recent roundup.html under src/posts/YYYY/MM/DD/.
function findLatestRoundup() {
  if (!existsSync(POSTS_DIR)) return null;
  const candidates = [];
  for (const y of readdirSync(POSTS_DIR)) {
    const yDir = join(POSTS_DIR, y);
    if (!statSync(yDir).isDirectory()) continue;
    for (const m of readdirSync(yDir)) {
      const mDir = join(yDir, m);
      if (!statSync(mDir).isDirectory()) continue;
      for (const d of readdirSync(mDir)) {
        const dDir = join(mDir, d);
        if (!statSync(dDir).isDirectory()) continue;
        const roundup = join(dDir, "roundup.html");
        const sidecar = join(dDir, "roundup.11tydata.json");
        if (existsSync(roundup) && existsSync(sidecar)) {
          candidates.push({ date: `${y}-${m}-${d}`, html: roundup, sidecar });
        }
      }
    }
  }
  candidates.sort((a, b) => b.date.localeCompare(a.date));
  return candidates[0] || null;
}

// Extract item h2 text from roundup html.
// Cards look like <article ... id="item-NN"> ... <h2 ...>TITLE</h2>
function extractItemTitles(html) {
  const out = [];
  const re = /id="item-\d+"[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    // Strip inner tags + collapse whitespace
    const txt = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (txt) out.push(txt);
  }
  return out;
}

const latest = findLatestRoundup();
if (!latest) {
  process.stderr.write("No roundup found under src/posts/\n");
  process.exit(0); // not fatal — first-day-of-blog case
}

const sidecar = JSON.parse(readFileSync(latest.sidecar, "utf8"));
const html = readFileSync(latest.html, "utf8");
const items = extractItemTitles(html);
const top3 = items.slice(0, 3);

const W = 600, H = 320;
const PAD = 28;

const title = sidecar.title || `today on vatt'ghern`;
const date = latest.date;
const tagline = "daily tech news for engineers";

// Sigil at top-right (40x40). Embed as a tiny SVG circle + initials so the
// card stays self-contained (no <image href> dependency on external file).
const SIGIL_R = 22;

const itemsXml = top3.map((t, i) => {
  const y = 144 + i * 40;
  const text = escapeXml(t.length > 56 ? t.slice(0, 54) + "…" : t);
  return `
    <g transform="translate(${PAD}, ${y})">
      <circle cx="6" cy="6" r="2.5" fill="#6b5d4d"/>
      <text x="20" y="11" font-family="Spectral, 'EB Garamond', Georgia, serif"
            font-size="15" fill="#2e2924">${text}</text>
    </g>`;
}).join("");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"
     width="${W}" height="${H}" role="img"
     aria-label="${escapeXml(title)} — ${escapeXml(tagline)}">
  <title>${escapeXml(title)}</title>
  <desc>${escapeXml(tagline)} — top 3 from today's vatt'ghern roundup</desc>
  <defs>
    <linearGradient id="vg-card-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f7f2e7"/>
      <stop offset="100%" stop-color="#efe7d4"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="14" ry="14" fill="url(#vg-card-bg)"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" ry="14"
        fill="none" stroke="#d6cdb7" stroke-width="1"/>

  <!-- sigil placeholder: solid disc + sigil-style W. Self-contained. -->
  <g transform="translate(${W - PAD - SIGIL_R}, ${PAD + SIGIL_R})">
    <circle cx="0" cy="0" r="${SIGIL_R}" fill="#1c1916"/>
    <text x="0" y="6" text-anchor="middle"
          font-family="'IM Fell English', 'EB Garamond', serif"
          font-size="20" fill="#e8d9a5" font-style="italic">vg</text>
  </g>

  <!-- header -->
  <text x="${PAD}" y="${PAD + 18}" font-family="Manrope, Helvetica, sans-serif"
        font-size="14" letter-spacing="2" fill="#6b5d4d">VATT'GHERN</text>
  <text x="${PAD}" y="${PAD + 56}" font-family="Spectral, 'EB Garamond', Georgia, serif"
        font-size="26" fill="#1c1916">${escapeXml(title)}</text>

  <!-- divider -->
  <line x1="${PAD}" y1="${PAD + 78}" x2="${W - PAD}" y2="${PAD + 78}"
        stroke="#bfb59e" stroke-width="1"/>

  <!-- items -->
  ${itemsXml}

  <!-- footer -->
  <line x1="${PAD}" y1="${H - PAD - 26}" x2="${W - PAD}" y2="${H - PAD - 26}"
        stroke="#bfb59e" stroke-width="0.5"/>
  <text x="${PAD}" y="${H - PAD - 8}" font-family="Manrope, Helvetica, sans-serif"
        font-size="12" fill="#6b5d4d">${escapeXml(tagline)}</text>
  <text x="${W - PAD}" y="${H - PAD - 8}" text-anchor="end"
        font-family="'JetBrains Mono', monospace" font-size="12" fill="#6b5d4d">${escapeXml(date)}</text>
</svg>
`;

writeFileSync(OUT, svg);
process.stdout.write(`today.svg: ${date} · ${top3.length} item(s)\n`);
