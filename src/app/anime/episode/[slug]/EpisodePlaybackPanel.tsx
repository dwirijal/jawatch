'use client';

import * as React from 'react';
import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { VideoPlayer } from '@/components/organisms/VideoPlayer';
import { getDeadMirrors } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { AnimeEpisodeServerOption } from '@/lib/adapters/anime';

interface EpisodePlaybackPanelProps {
  mirrors: Array<{ label: string; embed_url: string }>;
  defaultUrl: string;
  title: string;
  downloadHref?: string;
  serverOptions: AnimeEpisodeServerOption[];
}

type SourceButton = {
  id: string;
  label: string;
  url?: string;
  postId?: string;
  qualityRank: number;
  hostRank: number;
  dead: boolean;
};

const HOST_PRIORITY = [
  'premium',
  'mega',
  'nakama',
  'pucuk',
  'blogspot',
  'gofile',
  'krakenfile',
  'pixeldrain',
  'mirrored',
];

function getQualityRank(label: string): number {
  const upper = label.toUpperCase();
  if (upper.includes('4K')) return 4000;
  if (upper.includes('2K')) return 2000;
  if (upper.includes('1080')) return 1080;
  if (upper.includes('720')) return 720;
  if (upper.includes('480')) return 480;
  if (upper.includes('360')) return 360;
  return 0;
}

function getHostRank(label: string): number {
  const normalized = label.toLowerCase();
  const index = HOST_PRIORITY.findIndex((host) => normalized.includes(host));
  return index === -1 ? HOST_PRIORITY.length + 1 : index;
}

function buildSourceButtons(
  mirrors: Array<{ label: string; embed_url: string }>,
  serverOptions: AnimeEpisodeServerOption[],
  deadMirrors: string[]
): SourceButton[] {
  if (serverOptions.length > 0) {
    return serverOptions
      .map((option) => ({
        id: `${option.postId}-${option.number}-${option.label}`,
        label: option.number ? `${option.label} ${option.number}` : option.label,
        postId: option.postId,
        qualityRank: getQualityRank(`${option.label} ${option.number}`),
        hostRank: getHostRank(option.label),
        dead: false,
      }))
      .sort((left, right) => {
        if (left.qualityRank !== right.qualityRank) {
          return right.qualityRank - left.qualityRank;
        }
        if (left.hostRank !== right.hostRank) {
          return left.hostRank - right.hostRank;
        }
        return left.label.localeCompare(right.label);
      });
  }

  const seen = new Set<string>();
  const options: SourceButton[] = mirrors.flatMap((mirror, index) => {
    const url = mirror.embed_url;
    if (!url || seen.has(url)) {
      return [];
    }
    seen.add(url);

    return [{
      id: `mirror-${index}-${mirror.label}`,
      label: mirror.label,
      url,
      qualityRank: getQualityRank(mirror.label),
      hostRank: getHostRank(mirror.label),
      dead: deadMirrors.includes(url),
    }];
  });

  if (options.length > 0) {
    return options.sort((left, right) => {
      if (left.dead !== right.dead) {
        return left.dead ? 1 : -1;
      }
      if (left.qualityRank !== right.qualityRank) {
        return right.qualityRank - left.qualityRank;
      }
      if (left.hostRank !== right.hostRank) {
        return left.hostRank - right.hostRank;
      }
      return left.label.localeCompare(right.label);
    });
  }

  return serverOptions
    .map((option) => ({
      id: `${option.postId}-${option.number}-${option.label}`,
      label: option.number ? `${option.label} ${option.number}` : option.label,
      url: '',
      qualityRank: getQualityRank(`${option.label} ${option.number}`),
      hostRank: getHostRank(option.label),
      dead: false,
    }))
    .sort((left, right) => {
      if (left.qualityRank !== right.qualityRank) {
        return right.qualityRank - left.qualityRank;
      }
      if (left.hostRank !== right.hostRank) {
        return left.hostRank - right.hostRank;
      }
      return left.label.localeCompare(right.label);
    });
}

export default function EpisodePlaybackPanel({
  mirrors,
  defaultUrl,
  title,
  downloadHref,
  serverOptions,
}: EpisodePlaybackPanelProps) {
  const [deadMirrors, setDeadMirrors] = React.useState<string[]>([]);
  const [resolvedSourceUrls, setResolvedSourceUrls] = React.useState<Record<string, string>>({});
  const [resolveError, setResolveError] = React.useState('');
  const [resolvingSourceId, setResolvingSourceId] = React.useState('');
  const sourceButtons = React.useMemo(
    () => buildSourceButtons(mirrors, serverOptions, deadMirrors),
    [deadMirrors, mirrors, serverOptions]
  );
  const sortedMirrors = React.useMemo(() => {
    const allMirrors = [
      ...mirrors,
      ...sourceButtons
        .map((button) => {
          const url = resolvedSourceUrls[button.id];
          return url ? { label: button.label, embed_url: url } : null;
        })
        .filter((item): item is { label: string; embed_url: string } => item !== null),
    ];
    const dedupedMirrors = Array.from(
      new Map(allMirrors.filter((mirror) => mirror.embed_url).map((mirror) => [mirror.embed_url, mirror])).values()
    );
    const buttonMap = new Map(sourceButtons.filter((button) => button.url).map((button) => [button.url, button]));
    return dedupedMirrors.sort((left, right) => {
      const leftButton = buttonMap.get(left.embed_url);
      const rightButton = buttonMap.get(right.embed_url);
      if (!leftButton || !rightButton) {
        return 0;
      }
      if (leftButton.dead !== rightButton.dead) {
        return leftButton.dead ? 1 : -1;
      }
      if (leftButton.qualityRank !== rightButton.qualityRank) {
        return rightButton.qualityRank - leftButton.qualityRank;
      }
      if (leftButton.hostRank !== rightButton.hostRank) {
        return leftButton.hostRank - rightButton.hostRank;
      }
      return left.label.localeCompare(right.label);
    });
  }, [mirrors, resolvedSourceUrls, sourceButtons]);
  const [selectedUrl, setSelectedUrl] = React.useState(defaultUrl);
  const [selectedSourceId, setSelectedSourceId] = React.useState('');
  const hasPlayableStream = selectedUrl !== '' || sortedMirrors.length > 0;

  React.useEffect(() => {
    setDeadMirrors(getDeadMirrors());
  }, []);

  const resolveServerOption = React.useCallback(async (source: SourceButton) => {
    if (!source.postId) {
      return source.url || '';
    }

    const cachedUrl = resolvedSourceUrls[source.id];
    if (cachedUrl) {
      return cachedUrl;
    }

    setResolvingSourceId(source.id);
    setResolveError('');

    try {
      const response = await fetch(`/api/anime/server/${encodeURIComponent(source.postId)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || 'Resolved stream URL unavailable');
      }

      setResolvedSourceUrls((current) => ({
        ...current,
        [source.id]: payload.url!,
      }));

      return payload.url;
    } finally {
      setResolvingSourceId('');
    }
  }, [resolvedSourceUrls]);

  const handleSourceSelect = React.useCallback(async (source: SourceButton) => {
    setSelectedSourceId(source.id);

    try {
      const nextUrl = await resolveServerOption(source);
      if (nextUrl) {
        setSelectedUrl(nextUrl);
        localStorage.setItem('dwizzy_preferred_mirror', source.label);
        setResolveError('');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to resolve stream URL';
      setResolveError(message);
    }
  }, [resolveServerOption]);

  React.useEffect(() => {
    if (sourceButtons.length > 0 && sourceButtons[0]?.postId) {
      const preferredLabel = localStorage.getItem('dwizzy_preferred_mirror');
      const preferredSource = sourceButtons.find((source) => source.label === preferredLabel) || sourceButtons[0];
      if (preferredSource && preferredSource.id !== selectedSourceId && !resolvingSourceId) {
        void handleSourceSelect(preferredSource);
      }
      return;
    }

    if (!hasPlayableStream) {
      setSelectedUrl(defaultUrl);
      return;
    }

    const preferredLabel = localStorage.getItem('dwizzy_preferred_mirror');
    const preferredMirror = sortedMirrors.find((mirror) => mirror.label === preferredLabel);

    if (preferredMirror && !deadMirrors.includes(preferredMirror.embed_url)) {
      setSelectedUrl(preferredMirror.embed_url);
      return;
    }

    if (defaultUrl && !deadMirrors.includes(defaultUrl)) {
      setSelectedUrl(defaultUrl);
      return;
    }

    setSelectedUrl(sortedMirrors.find((mirror) => !deadMirrors.includes(mirror.embed_url))?.embed_url || defaultUrl);
  }, [deadMirrors, defaultUrl, handleSourceSelect, hasPlayableStream, resolvingSourceId, selectedSourceId, sortedMirrors, sourceButtons]);

  return (
    <section className="space-y-4">
      {hasPlayableStream ? (
        <VideoPlayer
          mirrors={sortedMirrors}
          defaultUrl={selectedUrl || defaultUrl}
          currentUrl={selectedUrl}
          onMirrorChange={(url) => {
            setSelectedUrl(url);
            setDeadMirrors(getDeadMirrors());
          }}
          showMirrorPanel={false}
          title={title}
          showTitleOverlay={false}
          theme="anime"
        />
      ) : (
        <Paper
          as="section"
          tone="muted"
          shadow="md"
          className="flex aspect-video flex-col justify-between rounded-[var(--radius-2xl)] p-5 md:p-6"
        >
          <div className="space-y-5">
            <Badge variant="outline" className="w-fit border-amber-500/30 text-amber-300">
              Playback Ready
            </Badge>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Inline playback is not ready yet
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-zinc-400">
                  Stream inline belum aktif. Coba resolve salah satu source di bawah atau lanjut ke panel download.
                </p>
              </div>
            </div>
          </div>

          {downloadHref ? (
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="lg" className="rounded-full px-6" asChild>
                <Link href={downloadHref}>View Downloads</Link>
              </Button>
            </div>
          ) : null}
        </Paper>
      )}

      <Paper as="article" tone="muted" className="rounded-[var(--radius-2xl)] p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Source</p>
            <h3 className="mt-2 text-lg font-black uppercase italic text-white/90">
              Playback Options
            </h3>
            {hasPlayableStream ? (
              <p className="mt-2 text-xs font-medium text-zinc-500">
                Sources are ranked by quality first, then preferred host.
              </p>
            ) : null}
          </div>
          <Badge variant="outline">{sourceButtons.length} Options</Badge>
        </div>

        {resolveError ? (
          <Paper tone="outline" className="mb-4 border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
            {resolveError}
          </Paper>
        ) : null}

        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-2 pb-1">
            {sourceButtons.map((source, index) => {
              const resolvedUrl = source.url || resolvedSourceUrls[source.id] || '';
              const isActive = selectedSourceId
                ? selectedSourceId === source.id
                : hasPlayableStream && resolvedUrl !== '' && selectedUrl === resolvedUrl;
              return hasPlayableStream ? (
                <Button
                  key={source.id}
                  type="button"
                  onClick={() => void handleSourceSelect(source)}
                  variant={isActive ? 'anime' : 'outline'}
                  size="sm"
                  className={cn(
                    'shrink-0 rounded-full px-4',
                    !isActive && 'text-zinc-300',
                    source.dead && !isActive && 'border-red-500/20 text-zinc-500 opacity-60'
                  )}
                >
                  {resolvingSourceId === source.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {source.label}
                  {source.dead ? ' Dead' : ''}
                </Button>
              ) : (
                <Badge
                  key={source.id}
                  variant={index === 0 ? 'anime' : 'outline'}
                  className={cn(
                    'shrink-0 px-4 py-3 text-[11px] tracking-[0.18em]',
                    index !== 0 && 'text-zinc-300'
                  )}
                >
                  {source.label}
                </Badge>
              );
            })}
          </div>
        </div>
      </Paper>
    </section>
  );
}
