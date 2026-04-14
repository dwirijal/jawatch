export async function resolveDynamicSitemapEntries<T>(
  loader: () => Promise<T[]>,
  warn: (message: string) => void = console.warn,
): Promise<T[]> {
  try {
    return await loader();
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    warn(`[sitemap] dynamic sitemap entries unavailable, serving static entries only: ${detail}`);
    return [];
  }
}
