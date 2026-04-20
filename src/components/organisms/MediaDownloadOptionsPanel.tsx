'use client';

import * as React from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { cn } from '@/lib/utils';

export type MediaDownloadGroup = {
  format: string;
  quality: string;
  links: Array<{ label: string; href: string }>;
};

interface MediaDownloadOptionsPanelProps {
  groups: MediaDownloadGroup[];
  accent?: 'blue' | 'indigo';
  id?: string;
  normalizeLabel?: (label: string) => string;
}

const QUALITY_ACCENT_CLASS = {
  blue: 'border-blue-500/35 bg-blue-500/12 text-blue-300',
  indigo: 'border-indigo-500/35 bg-indigo-500/12 text-indigo-300',
} as const;

function getQualityRank(quality: string): number {
  const upper = quality.toUpperCase();

  if (upper.includes('4K')) return 4000;
  if (upper.includes('2K')) return 2000;
  if (upper.includes('FULLHD')) return 1080;
  if (upper.includes('HD')) return 720;

  const numeric = upper.match(/\d{3,4}/);
  if (numeric) {
    return Number(numeric[0]);
  }

  return 0;
}

function getFormatTone(format: string) {
  const normalized = format.toLowerCase();

  if (normalized.includes('x265') || normalized.includes('hevc')) {
    return {
      card: 'border-sky-400/20 bg-[linear-gradient(135deg,rgba(59,130,246,0.12),rgba(147,51,234,0.14))]',
      label: 'border-sky-400/20 bg-sky-500/12 text-sky-300',
      button: 'border-sky-400/20 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15',
    };
  }

  if (normalized.includes('mkv')) {
    return {
      card: 'border-violet-400/20 bg-violet-500/[0.08]',
      label: 'border-violet-400/20 bg-violet-500/12 text-violet-300',
      button: 'border-violet-400/20 bg-violet-500/10 text-violet-200 hover:bg-violet-500/15',
    };
  }

  if (normalized.includes('mp4')) {
    return {
      card: 'border-blue-400/20 bg-blue-500/[0.08]',
      label: 'border-blue-400/20 bg-blue-500/12 text-blue-300',
      button: 'border-blue-400/20 bg-blue-500/10 text-blue-200 hover:bg-blue-500/15',
    };
  }

  return {
    card: 'border-border-subtle bg-surface-1/70',
    label: 'border-border-subtle bg-surface-elevated text-muted-foreground',
    button: 'border-border-subtle bg-surface-elevated text-foreground hover:bg-surface-1',
  };
}

function defaultNormalizeLabel(label: string): string {
  return label
    .replace(/FULLHD/gi, '1080P')
    .replace(/MP4HD/gi, '720P')
    .replace(/Gofle/gi, 'Gofile')
    .replace(/\s*\[[^\]]+\]\s*/g, '')
    .trim();
}

function getLinkRank(label: string): number {
  const normalized = label.toLowerCase();

  if (normalized.includes('gofile')) return 0;
  if (normalized.includes('pixeldrain')) return 1;
  if (normalized.includes('mega')) return 2;
  if (normalized.includes('kraken')) return 3;
  if (normalized.includes('mirrored')) return 4;
  if (normalized.includes('blogspot')) return 5;

  return 10;
}

export default function MediaDownloadOptionsPanel({
  groups,
  accent = 'blue',
  id = 'downloads',
  normalizeLabel = defaultNormalizeLabel,
}: MediaDownloadOptionsPanelProps) {
  const normalizedGroups = React.useMemo(
    () =>
      Array.from(
        groups.reduce((map, group) => {
          const dedupedLinks = Array.from(
            new Map(
              group.links
                .filter((link) => link.label && link.href)
                .map((link) => [`${normalizeLabel(link.label)}::${link.href}`, { ...link, label: normalizeLabel(link.label) }])
            ).values()
          ).sort((left, right) => {
            const leftRank = getLinkRank(left.label);
            const rightRank = getLinkRank(right.label);

            if (leftRank !== rightRank) {
              return leftRank - rightRank;
            }

              return left.label.localeCompare(right.label);
            });

          const normalizedGroup = {
            format: group.format.trim(),
            quality: normalizeLabel(group.quality),
            links: dedupedLinks,
          };
          const key = `${normalizedGroup.quality}::${normalizedGroup.format.toLowerCase()}`;
          const existing = map.get(key);

          if (existing) {
            existing.links = Array.from(
              new Map(
                [...existing.links, ...normalizedGroup.links].map((link) => [`${link.label}::${link.href}`, link])
              ).values()
            ).sort((left, right) => {
              const leftRank = getLinkRank(left.label);
              const rightRank = getLinkRank(right.label);

              if (leftRank !== rightRank) {
                return leftRank - rightRank;
              }

              return left.label.localeCompare(right.label);
            });
          } else {
            map.set(key, normalizedGroup);
          }

          return map;
        }, new Map<string, MediaDownloadGroup>())
      )
        .map(([, group]) => group)
        .filter((group) => group.links.length > 0)
        .sort((left, right) => {
          const qualityDelta = getQualityRank(right.quality) - getQualityRank(left.quality);
          if (qualityDelta !== 0) {
            return qualityDelta;
          }
          return left.format.localeCompare(right.format);
        }),
    [groups, normalizeLabel]
  );

  const groupedByQuality = React.useMemo(() => {
    const map = new Map<string, MediaDownloadGroup[]>();

    for (const group of normalizedGroups) {
      const bucket = map.get(group.quality) ?? [];
      bucket.push(group);
      map.set(group.quality, bucket);
    }

    return map;
  }, [normalizedGroups]);

  const qualityOptions = React.useMemo(
    () => [...groupedByQuality.keys()].sort((left, right) => getQualityRank(right) - getQualityRank(left)),
    [groupedByQuality]
  );

  const [activeQuality, setActiveQuality] = React.useState(qualityOptions[0] ?? '');

  React.useEffect(() => {
    if (!qualityOptions.includes(activeQuality)) {
      setActiveQuality(qualityOptions[0] ?? '');
    }
  }, [activeQuality, qualityOptions]);

  const activeGroups = groupedByQuality.get(activeQuality) ?? [];

  if (normalizedGroups.length === 0) {
    return null;
  }

  return (
    <Paper id={id} as="article" tone="muted" shadow="sm" className="space-y-4 p-4 md:space-y-5 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Unduhan</p>
          <h2 className="mt-1.5 text-lg font-black tracking-tight text-foreground md:text-xl">Pilihan download</h2>
        </div>
        <Badge variant="outline">{normalizedGroups.length} tersedia</Badge>
      </div>

      <div className="space-y-3.5">
        <div className="space-y-2.5">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Kualitas</p>
          <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max items-center gap-1.5 pb-1">
              {qualityOptions.map((quality) => {
                const isActive = quality === activeQuality;

                return (
                  <button
                    key={quality}
                    type="button"
                    onClick={() => setActiveQuality(quality)}
                    className={cn(
                      'shrink-0 rounded-[var(--radius-sm)] border px-3.5 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] transition',
                      isActive ? QUALITY_ACCENT_CLASS[accent] : 'border-border-subtle bg-surface-2 text-muted-foreground hover:bg-surface-elevated hover:text-foreground'
                    )}
                  >
                    {quality}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
          {activeGroups.map((group) => {
            const tone = getFormatTone(group.format);

            return (
              <Paper
              key={`${group.format}-${group.quality}`}
              as="section"
              tone="outline"
              padded={false}
              className={cn('p-3.5 md:p-4', tone.card)}
            >
                <div className="mb-3.5 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-black/20 text-foreground">
                      <Download className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Metode</p>
                      <p className="mt-1 text-sm font-black tracking-[0.08em] text-foreground">{group.format}</p>
                    </div>
                  </div>

                  <span className={cn('rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em]', tone.label)}>
                    Metode
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {group.links.map((link) => (
                    <Button
                      key={`${group.format}-${group.quality}-${link.label}-${link.href}`}
                      variant="outline"
                      size="sm"
                      className={cn('h-9 rounded-[var(--radius-sm)] px-4', tone.button)}
                      asChild
                    >
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        {normalizeLabel(link.label)}
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </a>
                    </Button>
                  ))}
                </div>
              </Paper>
            );
          })}
        </div>
      </div>
    </Paper>
  );
}
