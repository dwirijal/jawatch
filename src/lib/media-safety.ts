export function normalizeMediaLabels(values: unknown): string[] {
  if (Array.isArray(values)) {
    return values
      .flatMap((value) => normalizeMediaLabels(value))
      .filter(Boolean);
  }

  if (typeof values === 'string') {
    return values
      .split(/[,\n|/]+/)
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
  }

  if (values && typeof values === 'object') {
    const record = values as Record<string, unknown>;
    const candidates = [record.name, record.title, record.label, record.slug, record.value];
    return candidates
      .filter((value) => typeof value === 'string')
      .map((value) => String(value).trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
}

export function hasNsfwLabel(...values: unknown[]): boolean {
  return values
    .flatMap((value) => normalizeMediaLabels(value))
    .some((value) => value === 'nsfw');
}
