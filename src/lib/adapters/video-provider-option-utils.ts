export type ProviderMirrorEntry = {
  label: string;
  embed_url: string;
};

export type ProviderDownloadGroup = {
  format: string;
  quality: string;
  links: Array<{ label: string; href: string }>;
};

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export type CanonicalStreamOptionRow = {
  label: string | null;
  embed_url: string | null;
  host_code: string | null;
  quality_code: string | null;
};

export type CanonicalDownloadOptionRow = {
  label: string | null;
  download_url: string | null;
  host_code: string | null;
  quality_code: string | null;
  format_code: string | null;
};

export function buildCanonicalMirrors(rows: CanonicalStreamOptionRow[]): ProviderMirrorEntry[] {
  const seen = new Set<string>();
  const mirrors: ProviderMirrorEntry[] = [];

  for (const row of rows) {
    const embedUrl = readText(row.embed_url);
    if (!embedUrl || seen.has(embedUrl)) {
      continue;
    }

    seen.add(embedUrl);
    mirrors.push({
      label: readText(row.label) || readText(row.host_code) || 'Mirror',
      embed_url: embedUrl,
    });
  }

  return mirrors;
}

export function buildCanonicalDownloadGroups(rows: CanonicalDownloadOptionRow[]): ProviderDownloadGroup[] {
  const groups = new Map<string, ProviderDownloadGroup>();
  const seen = new Set<string>();

  for (const row of rows) {
    const href = readText(row.download_url);
    if (!href || seen.has(href)) {
      continue;
    }

    seen.add(href);
    const format = readText(row.format_code) || 'DIRECT';
    const quality = readText(row.quality_code) || 'SOURCE';
    const key = `${format}::${quality}`;
    const group = groups.get(key) ?? {
      format,
      quality,
      links: [],
    };

    group.links.push({
      label: readText(row.label) || readText(row.host_code) || quality,
      href,
    });
    groups.set(key, group);
  }

  return [...groups.values()];
}
