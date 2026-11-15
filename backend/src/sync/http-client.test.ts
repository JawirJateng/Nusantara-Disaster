import { test } from 'node:test';
import assert = require('node:assert/strict');
import { SourceHttpError, fetchJsonWithRetry } from './http-client';

function response(status: number, body: unknown = {}, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

test('successful request returns parsed JSON without retries', async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls++;
    return response(200, { Infogempa: { gempa: [] } });
  }) as unknown as typeof fetch;

  const result = await fetchJsonWithRetry('https://example.test/feed', {}, fetchImpl);
  assert.deepEqual(result.data, { Infogempa: { gempa: [] } });
  assert.equal(result.retryCount, 0);
  assert.equal(calls, 1);
});

test('transient 5xx errors are retried a bounded number of times', async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls++;
    return response(503);
  }) as unknown as typeof fetch;

  await assert.rejects(
    fetchJsonWithRetry('https://example.test/feed', { maxRetries: 1 }, fetchImpl),
    (err: SourceHttpError) => err instanceof SourceHttpError && err.kind === 'transient' && err.retryCount === 1,
  );
  assert.equal(calls, 2, 'one attempt plus one retry');
});

test('timeouts are retried a bounded number of times', async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls++;
    const err: any = new Error('timeout');
    err.name = 'TimeoutError';
    throw err;
  }) as unknown as typeof fetch;

  await assert.rejects(
    fetchJsonWithRetry('https://example.test/feed', { maxRetries: 1, timeoutMs: 50 }, fetchImpl),
    (err: SourceHttpError) => err instanceof SourceHttpError && err.kind === 'timeout' && err.retryCount === 1,
  );
  assert.equal(calls, 2);
});

test('rate limit honours Retry-After and reports it to the caller', async () => {
  const fetchImpl = (async () => response(429, {}, { 'retry-after': '120' })) as unknown as typeof fetch;

  await assert.rejects(
    fetchJsonWithRetry('https://example.test/feed', { maxRetries: 3, maxRetryDelayMs: 1000 }, fetchImpl),
    (err: SourceHttpError) =>
      err instanceof SourceHttpError && err.kind === 'rate_limit' && err.retryAfterMs === 120_000,
  );
});

test('rate limit with a short Retry-After is retried immediately', async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls++;
    return calls === 1 ? response(429, {}, { 'retry-after': '0' }) : response(200, { ok: true });
  }) as unknown as typeof fetch;

  const result = await fetchJsonWithRetry('https://example.test/feed', { maxRetries: 1 }, fetchImpl);
  assert.deepEqual(result.data, { ok: true });
  assert.equal(result.retryCount, 1);
});

test('authentication and permanent errors are not retried', async () => {
  for (const status of [401, 403, 404]) {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return response(status);
    }) as unknown as typeof fetch;

    await assert.rejects(fetchJsonWithRetry('https://example.test/feed', { maxRetries: 3 }, fetchImpl));
    assert.equal(calls, 1, `status ${status} must not be retried`);
  }
});
