// fetchers/lobsters-json.mjs — Lobsters hottest.json → candidates.
// External `url` is preferred; if it's empty (text post), fall back to
// `comments_url` (the lobsters discussion page).

export async function fetch(record, ctx = {}) {
  const fetchImpl = ctx.fetchImpl || globalThis.fetch;
  const res = await fetchImpl(record.url);
  if (!res.ok) throw new Error(`lobsters-json ${record.id} HTTP ${res.status}`);
  const rows = await res.json();
  if (!Array.isArray(rows)) throw new Error(`lobsters-json ${record.id} not array`);
  const candidates = rows.map((r) => ({
    source_id: record.id,
    source_tier: record.tier,
    url: r.url && r.url.length > 0 ? r.url : r.comments_url,
    title: r.title,
    summary: "",
    published_at: r.created_at || null,
    signal: { kind: "lobsters", score: r.score ?? 0, tags: r.tags || [] },
  })).filter((c) => c.url && c.title);
  return { candidates };
}
