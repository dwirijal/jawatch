function readTrimmed(value: string | null | undefined): string {
  return value?.trim() || '';
}

export function formatSeriesDetailRating(value: string | null | undefined): string {
  const trimmed = readTrimmed(value);
  if (!trimmed || /^n\/a$/i.test(trimmed)) {
    return 'Tidak Tersedia';
  }

  const normalized = trimmed.includes('.') ? trimmed : trimmed.replace(',', '.');
  const numeric = Number.parseFloat(normalized);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 'Tidak Tersedia';
  }

  if (numeric > 10 && numeric <= 100) {
    return (numeric / 10).toFixed(1);
  }

  if (numeric > 10) {
    return 'Tidak Tersedia';
  }

  return numeric.toFixed(1);
}

export function formatSeriesDetailText(
  value: string | null | undefined,
  fallback = 'Tidak Tersedia',
): string {
  const trimmed = readTrimmed(value);
  if (!trimmed || /^n\/a$/i.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

export function formatSeriesDetailEpisodeCount(value: string | null | undefined): string {
  const trimmed = readTrimmed(value);
  if (!trimmed || /^n\/a$/i.test(trimmed)) {
    return 'Tidak Tersedia';
  }

  if (/^\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10).toLocaleString('en-US');
  }

  return trimmed;
}
