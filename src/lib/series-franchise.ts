function normalizeInput(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_./]+/g, ' ')
    .replace(/[^a-z0-9:() -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSeriesTitle(value: string): string {
  return normalizeInput(value)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSeriesFranchiseSearchQuery(value: string): string {
  const normalized = normalizeSeriesTitle(value)
    .replace(/\b(\d+)(st|nd|rd|th)\s+season\b/g, ' ')
    .replace(/\bseason\s+\d+\b/g, ' ')
    .replace(/\bpart\s+\d+\b/g, ' ')
    .replace(/\bcour\s+\d+\b/g, ' ')
    .replace(/\bsub\s+indo\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const colonPrefix = normalized.split(':')[0]?.trim() || normalized;
  return colonPrefix.replace(/\s+/g, ' ').trim();
}

export function normalizeSeriesFranchiseStem(value: string): string {
  return buildSeriesFranchiseSearchQuery(value)
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sharesSeriesFranchise(left: string, right: string): boolean {
  const leftStem = normalizeSeriesFranchiseStem(left);
  const rightStem = normalizeSeriesFranchiseStem(right);
  return Boolean(leftStem) && leftStem === rightStem;
}

export function hasExplicitSeriesInstallmentLabel(value: string): boolean {
  const normalized = normalizeSeriesTitle(value);
  return /\bseason\s+\d+\b/.test(normalized)
    || /\bpart\s+\d+\b/.test(normalized)
    || /\bcour\s+\d+\b/.test(normalized)
    || /\(\s*season\s+\d+\s*\)/.test(normalized);
}

export function extractSeriesInstallmentHint(value: string): string {
  const normalized = normalizeSeriesTitle(value).replace(/-/g, ' ');
  const seasonMatch = normalized.match(/\bseason\s+(\d+)(?:\s+part\s+(\d+))?/);
  if (seasonMatch) {
    const season = seasonMatch[1];
    const part = seasonMatch[2] || '';
    return `s${season}${part ? `-p${part}` : ''}`;
  }

  const partMatch = normalized.match(/\bpart\s+(\d+)\b/);
  if (normalized.includes('science future')) {
    const part = partMatch?.[1] || '1';
    return `s4-p${part}`;
  }

  if (partMatch) {
    return `p${partMatch[1]}`;
  }

  return '';
}

export function readSeriesFamilyTokenPrefix(value: string): string {
  const tokens = normalizeSeriesTitle(value)
    .replace(/\bseason\s+\d+(?:\s+part\s+\d+)?\b/g, ' ')
    .replace(/\bpart\s+\d+\b/g, ' ')
    .replace(/\bcour\s+\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

  return tokens.slice(0, 2).join(' ');
}
