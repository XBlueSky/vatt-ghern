// Build webp variants from src/static/vg-sigil.png at 80/160/320/640 px.
// Run after replacing vg-sigil.png with a new design.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "src", "static", "vg-sigil.png");
const sizes = [80, 160, 320, 640];

for (const size of sizes) {
  const out = join(here, "..", "src", "static", `vg-sigil-${size}.webp`);
  await sharp(src)
    .resize(size, size, { fit: "cover", position: "center" })
    .webp({ quality: 92 })
    .toFile(out);
  console.log(`wrote ${out}`);
}
