'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { VideoPlayer } from '@/components/organisms/VideoPlayer';
import { getDeadMirrors } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { AnimeEpisodeServerOption } from '@/lib/anime-source';

interface EpisodePlaybackPanelProps {
  mirrors: Array<{ label: string; embed_url: string }>;
  defaultUrl: string;
  title: string;
  downloadHref?: string;
  serverOptions: AnimeEpisodeServerOption[];
}

function buildSourceButtons(
  mirrors: Array<{ label: string; embed_url: string }>,
  serverOptions: AnimeEpisodeServerOption[]
): Array<{ id: string; label: string; url: string }> {
  const options = mirrors.map((mirror, index) => ({
    id: `mirror-${index}-${mirror.label}`,
    label: mirror.label,
    url: mirror.embed_url,
  }));

  if (options.length > 0) {
    return options;
  }

  return serverOptions.map((option) => ({
    id: `${option.postId}-${option.number}-${option.label}`,
    label: option.label,
    url: '',
  }));
}

export default function EpisodePlaybackPanel({
  mirrors,
  defaultUrl,
  title,
  downloadHref,
  serverOptions,
}: EpisodePlaybackPanelProps) {
  const hasPlayableStream = defaultUrl !== '' && mirrors.length > 0;
  const sourceButtons = React.useMemo(() => buildSourceButtons(mirrors, serverOptions), [mirrors, serverOptions]);
  const [selectedUrl, setSelectedUrl] = React.useState(defaultUrl);

  React.useEffect(() => {
    if (!hasPlayableStream) {
      setSelectedUrl(defaultUrl);
      return;
    }

    const deadMirrors = getDeadMirrors();
    const preferredLabel = localStorage.getItem('dwizzy_preferred_mirror');
    const preferredMirror = mirrors.find((mirror) => mirror.label === preferredLabel);

    if (preferredMirror && !deadMirrors.includes(preferredMirror.embed_url)) {
      setSelectedUrl(preferredMirror.embed_url);
      return;
    }

    setSelectedUrl(defaultUrl);
  }, [defaultUrl, hasPlayableStream, mirrors]);

  return (
    <section className="space-y-4">
      {hasPlayableStream ? (
        <VideoPlayer
          mirrors={mirrors}
          defaultUrl={defaultUrl}
          currentUrl={selectedUrl}
          onMirrorChange={(url) => setSelectedUrl(url)}
          showMirrorPanel={false}
          title={title}
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
                  Episode data sudah sinkron via API gateway, tapi source saat ini baru menyediakan server options dan download links.
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
          </div>
          <Badge variant="outline">{sourceButtons.length} Options</Badge>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-2 pb-1">
            {sourceButtons.map((source, index) => {
              const isActive = hasPlayableStream && selectedUrl === source.url;
              return hasPlayableStream ? (
                <Button
                  key={source.id}
                  type="button"
                  onClick={() => setSelectedUrl(source.url)}
                  variant={isActive ? 'anime' : 'outline'}
                  size="sm"
                  className={cn(
                    'shrink-0 rounded-full px-4',
                    !isActive && 'text-zinc-300'
                  )}
                >
                  {source.label}
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
