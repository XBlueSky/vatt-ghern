#!/usr/bin/env node
// build-og.mjs — Generate Open Graph PNGs for posts (1200×630).
//
// Reads:
//   src/posts/**/*.html          one PNG per post
//   src/static/vg-sigil.png      sigil overlay
//   node_modules/@fontsource/spectral/...woff2  (decompressed via wawoff2)
//
// Writes:
//   src/static/og/<id>.png       one per post (id = YYYY-MM-DD-<fname>)
//   src/static/og/home.png       site-level card
//
// Idempotent: skips any PNG that already exists. Force regen with --force.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import sharp from "sharp";
import { decompress } from "wawoff2";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, "..");
const POSTS_DIR = join(REPO_ROOT, "src", "posts");
const OG_DIR = join(REPO_ROOT, "src", "static", "og");
const SIGIL_PNG = join(REPO_ROOT, "src", "static", "vg-sigil.png");
const SPECTRAL_WOFF2 = join(REPO_ROOT, "node_modules", "@fontsource",
  "spectral", "files", "spectral-latin-500-normal.woff2");
const LXGW_WOFF2 = join(REPO_ROOT, "node_modules", "@fontsource",
  "lxgw-wenkai-tc", "files", "lxgw-wenkai-tc-chinese-traditional-400-normal.woff2");

const FORCE = process.argv.includes("--force");

const SITE_NAME = "vatt'ghern";
const SITE_TAGLINE = "daily tech news for engineers";

mkdirSync(OG_DIR, { recursive: true });

// satori needs TTF/OTF; fontsource ships woff2. Decompress once on startup.
const fontData = Buffer.from(await decompress(readFileSync(SPECTRAL_WOFF2)));
const cjkFontData = Buffer.from(await decompress(readFileSync(LXGW_WOFF2)));
const sigilBytes = readFileSync(SIGIL_PNG);
const sigilDataUri = `data:image/png;base64,${sigilBytes.toString("base64")}`;

async function renderCard({ title, dateStr, tagline }) {
  const tree = {
    type: "div",
    props: {
      style: {
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: "#f7f2e7",
        color: "#1c1916",
        fontFamily: "Spectral, LXGW",
      },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
            children: [
              {
                type: "div",
                props: {
                  style: { fontSize: 28, letterSpacing: "0.08em" },
                  children: SITE_NAME,
                },
              },
              {
                type: "img",
                props: {
                  src: sigilDataUri,
                  width: 96,
                  height: 96,
                  style: { display: "block" },
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              fontSize: title.length > 60 ? 56 : 72,
              lineHeight: 1.15,
              fontWeight: 500,
              display: "block",
              maxWidth: 1040,
            },
            children: title,
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              fontSize: 22,
              color: "#6b5d4d",
            },
            children: [
              { type: "div", props: { children: tagline || SITE_TAGLINE } },
              { type: "div", props: { children: dateStr || "" } },
            ],
          },
        },
      ],
    },
  };

  const svg = await satori(tree, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "Spectral", data: fontData, weight: 500, style: "normal" },
      { name: "LXGW", data: cjkFontData, weight: 400, style: "normal" },
    ],
  });

  return await sharp(Buffer.from(svg)).png().toBuffer();
}

function* walkPosts(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      yield* walkPosts(p);
    } else if (name.endsWith(".html")) {
      yield p;
    }
  }
}

function postIdFromPath(p) {
  const rel = p.slice(POSTS_DIR.length + 1).replace(/\\/g, "/");
  const parts = rel.split("/");
  const fname = parts.pop().replace(/\.html$/, "");
  return `${parts.join("-")}-${fname}`;
}

function readSidecar(htmlPath) {
  const sidecar = htmlPath.replace(/\.html$/, ".11tydata.json");
  if (!existsSync(sidecar)) return null;
  try { return JSON.parse(readFileSync(sidecar, "utf8")); } catch { return null; }
}

function dateFromPath(p) {
  const m = p.match(/posts\/(\d{4})\/(\d{2})\/(\d{2})\//);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

async function buildOne(outPath, card) {
  if (existsSync(outPath) && !FORCE) return false;
  const buf = await renderCard(card);
  writeFileSync(outPath, buf);
  return true;
}

let built = 0, skipped = 0;

const homeOut = join(OG_DIR, "home.png");
if (await buildOne(homeOut, { title: SITE_NAME, dateStr: "" })) built++;
else skipped++;

for (const htmlPath of walkPosts(POSTS_DIR)) {
  const id = postIdFromPath(htmlPath);
  const out = join(OG_DIR, `${id}.png`);
  const sidecar = readSidecar(htmlPath);
  const title = (sidecar && sidecar.title) || basename(htmlPath, ".html");
  const date = dateFromPath(htmlPath);
  if (await buildOne(out, { title, dateStr: date })) built++;
  else skipped++;
}

process.stdout.write(`og: built=${built} skipped=${skipped}\n`);
