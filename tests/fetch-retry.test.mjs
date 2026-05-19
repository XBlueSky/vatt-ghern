import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchAll } from "../skills/daily-news/scripts/fetch-all.mjs";

const LOBSTERS_FILTER = { id: "lobsters-json" };

function makeFetchImpl(responses) {
  let i = 0;
  return async () => {
    const r = responses[i++];
    if (!r) throw new Error(`fetchImpl: no more responses (call ${i})`);
    if (r instanceof Error) throw r;
    return r;
  };
}

function okJson(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function badStatus(status) {
  return new Response("server error", { status });
}

test("retry: 5xx then 200 succeeds on retry, no failure recorded", async () => {
  const r = await fetchAll({
    filter: LOBSTERS_FILTER,
    fetchImpl: makeFetchImpl([badStatus(503), okJson([])]),
    priorWebState: {},
    writeState: false,
  });
  assert.equal(r.failures.length, 0, `expected 0 failures, got ${JSON.stringify(r.failures)}`);
});

test("retry: network error then 200 succeeds on retry", async () => {
  const netErr = new Error("fetch failed: ENOTFOUND");
  const r = await fetchAll({
    filter: LOBSTERS_FILTER,
    fetchImpl: makeFetchImpl([netErr, okJson([])]),
    priorWebState: {},
    writeState: false,
  });
  assert.equal(r.failures.length, 0);
});

test("retry: 5xx twice records failure with retried=true", async () => {
  const r = await fetchAll({
    filter: LOBSTERS_FILTER,
    fetchImpl: makeFetchImpl([badStatus(503), badStatus(503)]),
    priorWebState: {},
    writeState: false,
  });
  assert.equal(r.failures.length, 1);
  assert.equal(r.failures[0].retried, true);
  assert.match(r.failures[0].error, /HTTP 503/);
});

test("retry: 4xx fails without retry attempt", async () => {
  const r = await fetchAll({
    filter: LOBSTERS_FILTER,
    fetchImpl: makeFetchImpl([badStatus(404)]),
    priorWebState: {},
    writeState: false,
  });
  assert.equal(r.failures.length, 1);
  assert.equal(r.failures[0].retried, undefined,
    "4xx must not trigger retry");
  assert.match(r.failures[0].error, /HTTP 404/);
});
