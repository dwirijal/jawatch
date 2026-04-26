'use client';

import * as React from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type VideoPlayerMediaMode } from '@/lib/video-player-media';

interface VideoPlayerFrameProps {
  activeUrl: string;
  autoPlay: boolean;
  mediaMode: VideoPlayerMediaMode;
  playerKey: number;
  spinnerClassName: string;
  onEnded?: () => void;
}

export function VideoPlayerFrame({
  activeUrl,
  autoPlay,
  mediaMode,
  playerKey,
  spinnerClassName,
  onEnded,
}: VideoPlayerFrameProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [embedActivated, setEmbedActivated] = React.useState(false);

  React.useEffect(() => {
    setEmbedActivated(false);
  }, [activeUrl, playerKey]);

  React.useEffect(() => {
    if (mediaMode !== 'hls' || !activeUrl) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    let disposed = false;
    let hlsInstance: { destroy: () => void } | null = null;

    const attachHls = async () => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = activeUrl;
        video.load();
        return;
      }

      const { default: Hls } = await import('hls.js');
      if (disposed) {
        return;
      }

      if (!Hls.isSupported()) {
        video.src = activeUrl;
        video.load();
        return;
      }

      const instance = new Hls({ enableWorker: true });
      hlsInstance = instance;
      instance.loadSource(activeUrl);
      instance.attachMedia(video);
    };

    attachHls().catch(() => {
      video.src = activeUrl;
      video.load();
    });

    return () => {
      disposed = true;

      if (hlsInstance) {
        hlsInstance.destroy();
      }

      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [activeUrl, mediaMode]);

  if (mediaMode === 'empty') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-surface-1">
        <div
          className={cn(
            'mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent',
            spinnerClassName,
          )}
        />
        <p className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
          Preparing Stream...
        </p>
      </div>
    );
  }

  if (mediaMode === 'embed') {
    if (!embedActivated) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-black">
          <button
            type="button"
            aria-label="Putar video"
            className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur transition hover:scale-105 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/70"
            onClick={() => setEmbedActivated(true)}
          >
            <Play className="ml-1 h-7 w-7 fill-current" aria-hidden="true" />
          </button>
        </div>
      );
    }

    return (
      <iframe
        key={playerKey}
        src={activeUrl}
        className="h-full w-full"
        loading="lazy"
        allowFullScreen
        scrolling="no"
        allow="autoplay; encrypted-media"
        sandbox="allow-same-origin allow-scripts allow-forms allow-presentation"
      />
    );
  }

  return (
    <video
      key={playerKey}
      ref={videoRef}
      src={mediaMode === 'native' ? activeUrl : undefined}
      className="h-full w-full bg-black object-contain"
      controls
      autoPlay={autoPlay}
      playsInline
      preload="metadata"
      onEnded={onEnded}
    />
  );
}
