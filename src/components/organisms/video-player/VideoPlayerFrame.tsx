'use client';

import * as React from 'react';
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
    return (
      <iframe
        key={playerKey}
        src={activeUrl}
        className="h-full w-full"
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
