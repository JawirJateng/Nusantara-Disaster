import { parseRetryAfterMs } from './sync.core';

export type HttpErrorKind = 'timeout' | 'transient' | 'rate_limit' | 'auth' | 'permanent';

export class SourceHttpError extends Error {
  constructor(
    message: string,
    readonly kind: HttpErrorKind,
    readonly retryCount = 0,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'SourceHttpError';
  }
}

export interface FetchJsonOptions {
  timeoutMs?: number;
  maxRetries?: number;
  /** Retry-After values above this are not waited for; the caller reschedules instead. */
  maxRetryDelayMs?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function jitteredDelay(attempt: number, baseMs = 400, capMs = 8_000): number {
  const ceiling = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.round(ceiling / 2 + Math.random() * (ceiling / 2));
}

/** Fetch JSON with a hard timeout, limited retries, exponential backoff and Retry-After support. */
export async function fetchJsonWithRetry(
  url: string,
  options: FetchJsonOptions = {},
  fetchImpl: typeof fetch = fetch,
): Promise<{ data: any; retryCount: number }> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const maxRetries = Math.max(0, options.maxRetries ?? 2);
  const maxRetryDelayMs = options.maxRetryDelayMs ?? 30_000;
  const safeUrl = url.split('?')[0];
  let retryCount = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let response: Response;
    try {
      response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
    } catch (err: any) {
      const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
      if (attempt === maxRetries) {
        throw new SourceHttpError(
          timedOut ? `timeout after ${timeoutMs}ms: ${safeUrl}` : `request failed: ${safeUrl}`,
          timedOut ? 'timeout' : 'transient',
          retryCount,
        );
      }
      retryCount++;
      await sleep(jitteredDelay(attempt));
      continue;
    }

    if (response.ok) {
      return { data: await response.json(), retryCount };
    }

    const retryAfterMs = parseRetryAfterMs(response.headers?.get?.('retry-after'));

    if (response.status === 429) {
      if (retryAfterMs !== undefined && retryAfterMs > maxRetryDelayMs) {
        throw new SourceHttpError(`rate limited: ${safeUrl}`, 'rate_limit', retryCount, retryAfterMs);
      }
      if (attempt === maxRetries) {
        throw new SourceHttpError(`rate limited: ${safeUrl}`, 'rate_limit', retryCount, retryAfterMs);
      }
      retryCount++;
      await sleep(retryAfterMs !== undefined ? retryAfterMs : jitteredDelay(attempt));
      continue;
    }

    if (response.status === 401 || response.status === 403) {
      throw new SourceHttpError(`authentication rejected (${response.status}): ${safeUrl}`, 'auth', retryCount);
    }

    if (response.status >= 500) {
      if (attempt === maxRetries) {
        throw new SourceHttpError(`upstream error (${response.status}): ${safeUrl}`, 'transient', retryCount);
      }
      retryCount++;
      await sleep(retryAfterMs !== undefined ? retryAfterMs : jitteredDelay(attempt));
      continue;
    }

    throw new SourceHttpError(`request rejected (${response.status}): ${safeUrl}`, 'permanent', retryCount);
  }

  // Unreachable, but keeps the return type honest.
  throw new SourceHttpError(`request failed: ${safeUrl}`, 'permanent', retryCount);
}
