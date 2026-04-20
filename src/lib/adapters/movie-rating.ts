function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = readText(value).replace(',', '.');
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeMovieRatingValue(value: unknown): string {
  const numeric = readNumber(value);
  if (!numeric || numeric <= 0) {
    return 'N/A';
  }

  if (numeric <= 10) {
    return numeric.toFixed(1);
  }

  if (numeric <= 100) {
    return (numeric / 10).toFixed(1);
  }

  return 'N/A';
}
