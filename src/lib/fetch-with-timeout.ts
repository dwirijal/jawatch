type NextFetchConfig = {
  revalidate?: number;
  tags?: string[];
};

type FetchWithTimeoutOptions = RequestInit & {
  next?: NextFetchConfig;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
};

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readRetryAfterMs(response: Response): number | null {
  const retryAfter = response.headers.get('retry-after')?.trim();
  if (!retryAfter) {
    return null;
  }

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const dateMs = Date.parse(retryAfter);
  if (Number.isNaN(dateMs)) {
    return null;
  }

  return Math.max(0, dateMs - Date.now());
}

export async function fetchWithTimeout(input: RequestInfo | URL, options: FetchWithTimeoutOptions = {}): Promise<Response> {
  const {
    timeoutMs = 10_000,
    retries = 0,
    retryDelayMs = 250,
    ...init
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });

      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === retries) {
        return response;
      }

      const retryAfterMs = readRetryAfterMs(response);
      await delay(Math.min(retryAfterMs ?? retryDelayMs * (attempt + 1), 5_000));
    } catch (error) {
      lastError = error;
      const isAbort = error instanceof Error && error.name === 'AbortError';

      if (attempt === retries) {
        if (isAbort) {
          throw new Error('Request timeout');
        }
        throw error;
      }

      await delay(retryDelayMs * (attempt + 1));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('Request failed');
}
