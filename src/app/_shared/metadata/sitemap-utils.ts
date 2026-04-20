type ResolveDynamicSitemapEntriesOptions = {
  timeoutMs?: number;
};

export async function resolveDynamicSitemapEntries<T>(
  loader: () => Promise<T[]>,
  warn: (message: string) => void = console.warn,
  options: ResolveDynamicSitemapEntriesOptions = {},
): Promise<T[]> {
  const { timeoutMs = 8_000 } = options;
  const loaderPromise = Promise.resolve().then(loader);
  void loaderPromise.catch(() => {});

  try {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      return await loaderPromise;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      return await Promise.race([
        loaderPromise,
        new Promise<T[]>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`timeout after ${timeoutMs}ms`));
          }, timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    warn(`[sitemap] dynamic sitemap entries unavailable, serving static entries only: ${detail}`);
    return [];
  }
}
