import { test } from "node:test";
import assert from "node:assert/strict";
import { pruneStaleEntries } from "../skills/daily-news/scripts/fetch-all.mjs";

test("prune: entries older than 90 days are dropped", () => {
  const ancient = "2024-01-01T00:00:00Z";
  const recent = new Date(Date.now() - 5 * 86400 * 1000).toISOString();
  const state = {
    "anthropic-sitemap": {
      "https://x.com/old": ancient,
      "https://x.com/new": recent,
    },
  };
  const out = pruneStaleEntries(state, Date.now());
  assert.equal(out["anthropic-sitemap"]["https://x.com/new"], recent);
  assert.equal(out["anthropic-sitemap"]["https://x.com/old"], undefined);
});

test("prune: entries exactly at the 90-day boundary are kept", () => {
  const now = Date.now();
  const boundary = new Date(now - 90 * 86400 * 1000).toISOString();
  const state = {
    "anthropic-sitemap": { "https://x.com/boundary": boundary },
  };
  const out = pruneStaleEntries(state, now);
  assert.equal(out["anthropic-sitemap"]["https://x.com/boundary"], boundary,
    "exactly 90 days should be kept (>= cutoff)");
});

test("prune: non-sitemap-shaped slots pass through unchanged", () => {
  const state = {
    "weird-source": "a string slot",
    "array-source": [1, 2, 3],
    "null-source": null,
    "sitemap-source": {
      "https://x.com/old": "2024-01-01T00:00:00Z",
    },
  };
  const out = pruneStaleEntries(state, Date.now());
  assert.equal(out["weird-source"], "a string slot");
  assert.deepEqual(out["array-source"], [1, 2, 3]);
  assert.equal(out["null-source"], null);
  assert.equal(out["sitemap-source"]["https://x.com/old"], undefined);
});
