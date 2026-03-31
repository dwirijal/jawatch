import 'server-only';

import { hasNsfwLabel } from '@/lib/media-safety';

export type JsonRecord = Record<string, unknown>;

export type VideoItemRow = {
  item_key: string;
  source: string;
  media_type: string;
  slug: string;
  title: string;
  cover_url: string;
  status: string;
  release_year: number | null;
  score: number;
  detail: JsonRecord | null;
  tmdb_payload?: JsonRecord | null;
  updated_at: string;
  unit_count?: number | null;
};

export type VideoUnitRow = {
  item_key: string;
  item_slug: string;
  item_title: string;
  media_type: string;
  cover_url: string;
  item_detail: JsonRecord | null;
  item_tmdb_payload?: JsonRecord | null;
  slug: string;
  title: string;
  label: string;
  number: number | null;
  prev_slug: string | null;
  next_slug: string | null;
  published_at: string | null;
  detail: JsonRecord | null;
};

export type MirrorEntry = {
  label: string;
  embed_url: string;
};

export type DownloadGroup = {
  format: string;
  quality: string;
  links: Array<{ label: string; href: string }>;
};

export type VisibilityOptions = {
  includeNsfw?: boolean;
};

export function readRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
}

export function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^0-9.]+/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function readStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => readText(entry)).filter(Boolean);
  }

  const text = readText(value);
  if (!text) {
    return [];
  }

  return text
    .split(/[,\n|/]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function normalizePosterUrl(url: string): string {
  if (!url) {
    return '/favicon.ico';
  }

  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  return url;
}

export function normalizeCountry(value: unknown): string {
  const country = readText(value);
  if (!country) {
    return 'Unknown';
  }

  const normalized = country.toLowerCase();
  if (normalized === 'korea') {
    return 'South Korea';
  }

  return country;
}

export function extractMetricNumber(label: string): number {
  const match = label.trim().match(/([\d.,]+)\s*([kmb])?/i);
  if (!match) {
    return 0;
  }

  const base = Number.parseFloat(match[1].replace(/,/g, ''));
  if (!Number.isFinite(base)) {
    return 0;
  }

  const unit = (match[2] || '').toLowerCase();
  if (unit === 'k') return base * 1_000;
  if (unit === 'm') return base * 1_000_000;
  if (unit === 'b') return base * 1_000_000_000;
  return base;
}

export function extractPopularityScore(detail: JsonRecord): number {
  const labels = [
    ...readStringArray(detail.category_names),
    ...readStringArray(detail.genres),
    ...readStringArray(detail.genre_names),
    ...readStringArray(detail.tags),
  ];

  let views = 0;
  let loves = 0;
  for (const label of labels) {
    if (/views/i.test(label)) {
      views = Math.max(views, extractMetricNumber(label));
    }
    if (/loves?/i.test(label)) {
      loves = Math.max(loves, extractMetricNumber(label));
    }
  }

  return loves * 100 + views;
}

export function getVideoGenres(detail: JsonRecord): string[] {
  const labels = [
    ...readStringArray(detail.genres),
    ...readStringArray(detail.genre_names),
    ...readStringArray(detail.category_names),
  ];

  const seen = new Set<string>();
  return labels.filter((label) => {
    if (/\bviews?\b/i.test(label) || /\bloves?\b/i.test(label)) {
      return false;
    }
    const key = label.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function isVideoNsfw(detail: JsonRecord): boolean {
  return hasNsfwLabel(detail.genres, detail.genre_names, detail.category_names, detail.tags);
}

type UrlEntry = {
  label: string;
  href: string;
};

function collectUrlEntries(value: unknown, trail: string[] = []): UrlEntry[] {
  if (typeof value === 'string') {
    const href = value.trim();
    if (!href || !/^https?:\/\//i.test(href)) {
      return [];
    }

    return [{
      label: trail.filter(Boolean).join(' ') || 'Source',
      href,
    }];
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value as JsonRecord).flatMap(([key, nested]) =>
    collectUrlEntries(nested, [...trail, key.replace(/[_-]+/g, ' ')])
  );
}

function uniqueUrlEntries(entries: UrlEntry[]): UrlEntry[] {
  const seen = new Set<string>();
  const output: UrlEntry[] = [];

  for (const entry of entries) {
    const href = entry.href.trim();
    if (!href || seen.has(href)) {
      continue;
    }
    seen.add(href);
    output.push({
      label: entry.label.trim() || 'Source',
      href,
    });
  }

  return output;
}

export function buildMirrorEntries(detail: JsonRecord): MirrorEntry[] {
  const links = readRecord(detail.stream_links_json);
  const mirrors = readRecord(links.mirrors);

  const mirrorEntries = Object.entries(mirrors)
    .map(([label, href]) => ({
      label: label.trim() || 'Mirror',
      embed_url: readText(href),
    }))
    .filter((entry) => entry.embed_url);

  const fallbackEntries = uniqueUrlEntries([
    ...collectUrlEntries(detail.stream_url, ['primary']),
    ...collectUrlEntries(links.primary, ['primary']),
    ...collectUrlEntries(links.resolved_options, ['mirror']),
    ...collectUrlEntries(links, ['mirror']),
  ]).map((entry) => ({
    label: entry.label,
    embed_url: entry.href,
  }));

  const combined = [...mirrorEntries, ...fallbackEntries];
  const seen = new Set<string>();
  return combined.filter((entry) => {
    if (!entry.embed_url || seen.has(entry.embed_url)) {
      return false;
    }
    seen.add(entry.embed_url);
    return true;
  });
}

export function buildDownloadGroups(detail: JsonRecord): DownloadGroup[] {
  const downloadLinks = readRecord(detail.download_links_json);
  const groups = Object.entries(downloadLinks)
    .map(([quality, value]) => {
      const links = uniqueUrlEntries(collectUrlEntries(value));
      if (links.length === 0) {
        return null;
      }

      return {
        format: 'DIRECT',
        quality: quality.trim() || 'SOURCE',
        links,
      } satisfies DownloadGroup;
    })
    .filter((group): group is DownloadGroup => group !== null);

  if (groups.length > 0) {
    return groups;
  }

  const mirrors = buildMirrorEntries(detail);
  if (mirrors.length === 0) {
    return [];
  }

  return [{
    format: 'STREAM',
    quality: 'SOURCE',
    links: mirrors.map((entry) => ({
      label: entry.label,
      href: entry.embed_url,
    })),
  }];
}
