#!/usr/bin/env node
// build-social.mjs — Generate the GitHub repo social preview (1280×640).
//
// GitHub renders this image when someone shares the repo URL on
// Twitter/Slack/etc. Different aspect (2:1) and different identity
// (the repo, not a post) than the per-post OG cards in build-og.mjs,
// so this is its own script with its own layout.
//
// Output: src/static/social-preview.png
// Upload manually: GitHub repo → Settings → Social preview → upload.
//
// Usage:
//   node scripts/build-social.mjs              # write src/static/social-preview.png
//   node scripts/build-social.mjs --force      # force regen

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import sharp from "sharp";
import { decompress } from "wawoff2";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, "..");
const OUT_DIR = join(REPO_ROOT, "src", "static");
const OUT = join(OUT_DIR, "social-preview.png");
const SIGIL_PNG = join(REPO_ROOT, "src", "static", "vg-sigil.png");
const SPECTRAL_WOFF2 = join(REPO_ROOT, "node_modules", "@fontsource",
  "spectral", "files", "spectral-latin-500-normal.woff2");
const SPECTRAL_ITALIC_WOFF2 = join(REPO_ROOT, "node_modules", "@fontsource",
  "spectral", "files", "spectral-latin-500-italic.woff2");
const MANROPE_WOFF2 = join(REPO_ROOT, "node_modules", "@fontsource",
  "manrope", "files", "manrope-latin-600-normal.woff2");
const LXGW_WOFF2 = join(REPO_ROOT, "node_modules", "@fontsource",
  "lxgw-wenkai-tc", "files", "lxgw-wenkai-tc-chinese-traditional-400-normal.woff2");

const FORCE = process.argv.includes("--force");

mkdirSync(OUT_DIR, { recursive: true });

if (existsSync(OUT) && !FORCE) {
  process.stdout.write(`social-preview: skipped (exists; --force to regen)\n`);
  process.exit(0);
}

const spectralData = Buffer.from(await decompress(readFileSync(SPECTRAL_WOFF2)));
const spectralItalicData = Buffer.from(await decompress(readFileSync(SPECTRAL_ITALIC_WOFF2)));
const manropeData = Buffer.from(await decompress(readFileSync(MANROPE_WOFF2)));
const cjkData = Buffer.from(await decompress(readFileSync(LXGW_WOFF2)));
const sigilBytes = readFileSync(SIGIL_PNG);
const sigilDataUri = `data:image/png;base64,${sigilBytes.toString("base64")}`;

const W = 1280, H = 640;

const tree = {
  type: "div",
  props: {
    style: {
      width: W,
      height: H,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "80px 96px",
      background: "#f7f2e7",
      color: "#1c1916",
      fontFamily: "Spectral, LXGW",
      position: "relative",
    },
    children: [
      // Top row: wordmark on left, sigil on right
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          },
          children: [
            {
              type: "div",
              props: {
                style: { display: "flex", flexDirection: "column", gap: 8 },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        fontFamily: "Manrope",
                        fontSize: 36,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        color: "#1c1916",
                      },
                      children: "vatt'ghern",
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        fontFamily: "Spectral, LXGW",
                        fontStyle: "italic",
                        fontSize: 22,
                        color: "#6b5d4d",
                      },
                      children: "jaskier's ballads",
                    },
                  },
                ],
              },
            },
            {
              type: "img",
              props: {
                src: sigilDataUri,
                width: 144,
                height: 144,
                style: { display: "block" },
              },
            },
          ],
        },
      },

      // Headline — what this repo IS
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: 18,
          },
          children: [
            {
              type: "div",
              props: {
                style: {
                  fontFamily: "Spectral, LXGW",
                  fontSize: 64,
                  fontWeight: 500,
                  lineHeight: 1.15,
                  color: "#1c1916",
                  maxWidth: 980,
                },
                children: "Daily tech-news zine for engineers.",
              },
            },
            {
              type: "div",
              props: {
                style: {
                  fontFamily: "Spectral, LXGW",
                  fontSize: 26,
                  fontStyle: "italic",
                  color: "#6b5d4d",
                  maxWidth: 980,
                  lineHeight: 1.4,
                },
                children:
                  "Claude-authored prose · bespoke HTML · CJK typography · Cloudflare Pages",
              },
            },
          ],
        },
      },

      // Bottom row: tech chips + repo URL
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          },
          children: [
            {
              type: "div",
              props: {
                style: { display: "flex", gap: 14 },
                children: [
                  "Eleventy", "Claude Code", "MCP", "PrismJS",
                ].map((label) => ({
                  type: "div",
                  props: {
                    style: {
                      fontFamily: "Manrope",
                      fontSize: 17,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#6b5d4d",
                      padding: "8px 16px",
                      border: "1px solid #d6cdb7",
                      borderRadius: 999,
                      background: "#f7f2e7",
                    },
                    children: label,
                  },
                })),
              },
            },
            {
              type: "div",
              props: {
                style: {
                  fontFamily: "Manrope",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#a04a1f",
                  letterSpacing: "0.02em",
                },
                children: "github.com/XBlueSky/vatt-ghern",
              },
            },
          ],
        },
      },
    ],
  },
};

const svg = await satori(tree, {
  width: W,
  height: H,
  fonts: [
    { name: "Spectral", data: spectralData, weight: 500, style: "normal" },
    { name: "Spectral", data: spectralItalicData, weight: 500, style: "italic" },
    { name: "Manrope", data: manropeData, weight: 600, style: "normal" },
    { name: "LXGW", data: cjkData, weight: 400, style: "normal" },
  ],
});

const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(OUT, png);
process.stdout.write(`social-preview: ${W}×${H} → ${OUT} (${png.length} bytes)\n`);
