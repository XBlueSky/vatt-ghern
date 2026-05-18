// fetchers/html-index.mjs — Sentinel fetcher for HTML index pages.
// The skill workflow uses Claude's WebFetch tool for these (LLM
// summarisation); this fetcher just returns metadata so the dispatcher
// can list which records need WebFetch handling.

export async function fetch(record /* , ctx */) {
  return {
    candidates: [],
    deferred: {
      kind: "webfetch",
      source_id: record.id,
      source_tier: record.tier,
      url: record.url,
    },
  };
}
