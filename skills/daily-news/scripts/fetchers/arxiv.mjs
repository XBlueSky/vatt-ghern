// fetchers/arxiv.mjs — Parse arXiv Atom export into candidate records.
// Input record fields used: id, tier, url.
// ctx.fetchImpl is optional (defaults to global fetch) for test injection.

function pickTagBody(xml, tag) {
  // Returns array of inner-text bodies for <tag>...</tag>. Simple regex parse
  // — arXiv's Atom is well-formed and we only need fields we control.
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g");
  const out = [];
  let m;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

function pickAttr(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*\\b${attr}=\\"([^\\"]+)\\"`);
  const m = xml.match(re);
  return m ? m[1] : null;
}

export async function fetch(record, ctx = {}) {
  const fetchImpl = ctx.fetchImpl || globalThis.fetch;
  const res = await fetchImpl(record.url);
  if (!res.ok) throw new Error(`arxiv ${record.id} HTTP ${res.status}`);
  const xml = await res.text();

  const entries = pickTagBody(xml, "entry");
  const candidates = [];
  for (const e of entries) {
    const title = (pickTagBody(e, "title")[0] || "").trim().replace(/\s+/g, " ");
    const summary = (pickTagBody(e, "summary")[0] || "").trim().replace(/\s+/g, " ");
    const published = (pickTagBody(e, "published")[0] || "").trim();
    const url = pickAttr(e, "link", "href") || (pickTagBody(e, "id")[0] || "").trim();
    if (!title || !url) continue;
    candidates.push({
      source_id: record.id,
      source_tier: record.tier,
      url,
      title,
      summary,
      published_at: published || null,
      signal: { kind: "arxiv" },
    });
  }
  return { candidates };
}
