#!/usr/bin/env node
// cluster-candidates.mjs — Backwards-compat shim. Real logic moved to
// decisions/cluster.mjs in the 2026-05-19 decision-modules refactor.
// Library imports re-export the function; the CLI delegates by spawning
// the new path so `npm run sources:cluster` keeps working.

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export { clusterCandidates } from "./decisions/cluster.mjs";

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const here = dirname(fileURLToPath(import.meta.url));
  const target = join(here, "decisions", "cluster.mjs");
  const r = spawnSync(process.execPath, [target, ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  process.exit(r.status ?? 0);
}
