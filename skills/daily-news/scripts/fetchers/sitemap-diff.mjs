// fetchers/sitemap-diff.mjs — Fetch a <urlset> sitemap, compare lastmod
// per URL against ctx.priorState, and emit candidates only for entries
// that are new OR whose lastmod changed.
//
// ctx.priorState shape: { [url]: lastmod_string }
// Returns { candidates, state_diff } where state_diff is the FULL current
// state (caller commits it back to web-state.json — full replacement).

function extractUrls(xml) {
  const out = [];
  const re = /<url[\s>][\s\S]*?<\/url>/g;
  for (const m of xml.match(re) || []) {
    const loc = (m.match(/<loc>([\s\S]*?)<\/loc>/) || [])[1];
    const lastmod = (m.match(/<lastmod>([\s\S]*?)<\/lastmod>/) || [])[1];
    if (loc) out.push({ url: loc.trim(), lastmod: (lastmod || "").trim() });
  }
  return out;
}

export async function fetch(record, ctx = {}) {
  const fetchImpl = ctx.fetchImpl || globalThis.fetch;
  const priorState = ctx.priorState || {};
  const res = await fetchImpl(record.url);
  if (!res.ok) throw new Error(`sitemap ${record.id} HTTP ${res.status}`);
  const xml = await res.text();
  const entries = extractUrls(xml);

  const state_diff = {};
  const candidates = [];
  for (const { url, lastmod } of entries) {
    state_diff[url] = lastmod;
    const prior = priorState[url];
    if (prior === lastmod) continue; // unchanged
    candidates.push({
      source_id: record.id,
      source_tier: record.tier,
      url,
      title: url, // sitemap has no title; downstream WebFetch resolves real title
      summary: "",
      published_at: lastmod || null,
      signal: { kind: "sitemap", prior_lastmod: prior || null },
    });
  }
  return { candidates, state_diff };
}
