// fetchers/hf.mjs — Parse Hugging Face Hub API (models or datasets) into
// candidate records. record.url is the API URL (sort/limit baked in).

export async function fetch(record, ctx = {}) {
  const fetchImpl = ctx.fetchImpl || globalThis.fetch;
  const res = await fetchImpl(record.url);
  if (!res.ok) throw new Error(`hf ${record.id} HTTP ${res.status}`);
  const rows = await res.json();
  if (!Array.isArray(rows)) {
    throw new Error(`hf ${record.id} unexpected payload (not an array)`);
  }
  const candidates = rows.map((r) => ({
    source_id: record.id,
    source_tier: record.tier,
    url: `https://huggingface.co/${r.id}`,
    title: r.id,
    summary: r.pipeline_tag ? `Pipeline: ${r.pipeline_tag}` : "",
    published_at: r.lastModified || null,
    signal: {
      kind: "hf",
      downloads: r.downloads ?? 0,
      likes: r.likes ?? 0,
      trendingScore: r.trendingScore ?? 0,
    },
  }));
  return { candidates };
}
