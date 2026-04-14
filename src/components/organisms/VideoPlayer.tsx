'use client';

import * as React from 'react';
import { Maximize, Minimize, Lightbulb, LightbulbOff, RefreshCw, Layers, AlertCircle, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { useUIStore } from '@/store/useUIStore';
import { reportDeadMirror, getDeadMirrors } from '@/lib/store';

interface VideoPlayerProps {
  mirrors?: Array<{ label: string; embed_url: string }>;
  defaultUrl?: string;
  src?: string;
  currentUrl?: string;
  onMirrorChange?: (url: string, label: string) => void;
  showMirrorPanel?: boolean;
  title?: string;
  showTitleOverlay?: boolean;
  theme?: 'anime' | 'donghua' | 'movie' | 'drama';
  format?: 'landscape' | 'vertical' | 'shorts';
  onNext?: () => void;
  hasNext?: boolean;
  onEnded?: () => void;
  autoPlay?: boolean;
}

const THEME_ACCENT = {
  anime: {
    spinner: 'border-blue-600',
    panel: 'bg-blue-600/15 text-blue-300',
  },
  donghua: {
    spinner: 'border-red-600',
    panel: 'bg-red-600/15 text-red-300',
  },
  movie: {
    spinner: 'border-indigo-600',
    panel: 'bg-indigo-600/15 text-indigo-300',
  },
  drama: {
    spinner: 'border-rose-600',
    panel: 'bg-rose-600/15 text-rose-300',
  },
} as const;

function isDirectMediaUrl(url: string): boolean {
  return /\.(mp4|webm|ogg)(?:[?#]|$)/i.test(url);
}

function presentMirrorLabel(label: string, index: number): string {
  const trimmed = label.trim();
  const qualityMatch = trimmed.match(/\b(\d{3,4}p)\b/i);
  if (qualityMatch) {
    return qualityMatch[1].toUpperCase();
  }

  const genericMatch = trimmed.match(/\b(4k|uhd|fhd|hd|sd|hls|mp4)\b/i);
  if (genericMatch) {
    return genericMatch[1].toUpperCase();
  }

  return `Option ${index + 1}`;
}

export function VideoPlayer({
  mirrors = [],
  defaultUrl = '',
  src,
  currentUrl,
  onMirrorChange,
  showMirrorPanel = true,
  theme = 'anime',
  format = 'landscape',
  onNext,
  hasNext,
  onEnded,
  autoPlay: autoPlayProp = true,
}: VideoPlayerProps) {
  const isControlled = typeof currentUrl === 'string';
  const initialUrl = src || defaultUrl;
  const [internalUrl, setInternalUrl] = React.useState(initialUrl);
  const [key, setKey] = React.useState(0);
  const [deadMirrors, setDeadMirrors] = React.useState<string[]>([]);
  const [reportedThisSession, setReportedThisSession] = React.useState<string[]>([]);
  const { isTheaterMode, setTheaterMode, isLightsDimmed, setLightsDimmed, device } = useUIStore();
  const activeUrl = isControlled ? currentUrl : internalUrl;
  const accent = THEME_ACCENT[theme] || THEME_ACCENT.anime;
  const useNativePlayer = isDirectMediaUrl(activeUrl || '');
  
  const frameClassName =
    format === 'shorts'
      ? 'h-full w-full border-0 rounded-none'
      : isTheaterMode && device !== 'mobile'
        ? 'h-full w-full rounded-none border-0'
        : format === 'vertical'
          ? 'mx-auto aspect-[9/16] w-full max-w-[26rem] rounded-[var(--radius-2xl)]'
          : 'aspect-video rounded-[var(--radius-2xl)]';

  React.useEffect(() => {
    setDeadMirrors(getDeadMirrors());
    if (isControlled || src) {
      if (src) setInternalUrl(src);
      return;
    }

    const preferredLabel = localStorage.getItem('dwizzy_preferred_mirror');
    if (preferredLabel) {
      const matchingMirror = mirrors.find(m => m.label === preferredLabel);
      if (matchingMirror && !getDeadMirrors().includes(matchingMirror.embed_url)) {
        setInternalUrl(matchingMirror.embed_url);
        return;
      }
    }
    setInternalUrl(defaultUrl);
  }, [defaultUrl, isControlled, mirrors, src]);

  const handleMirrorChange = (url: string, label: string) => {
    if (!isControlled) {
      setInternalUrl(url);
    }
    setKey(prev => prev + 1);
    localStorage.setItem('dwizzy_preferred_mirror', label);
    onMirrorChange?.(url, label);
  };

  const handleReport = () => {
    if (confirm('Report this mirror as broken/expired?')) {
      reportDeadMirror(activeUrl || '');
      setDeadMirrors(prev => [...prev, activeUrl || '']);
      setReportedThisSession(prev => [...prev, activeUrl || '']);
      const nextMirror = mirrors.find(m => !getDeadMirrors().includes(m.embed_url) && m.embed_url !== activeUrl);
      if (nextMirror) handleMirrorChange(nextMirror.embed_url, nextMirror.label);
    }
  };

  const toggleLights = () => setLightsDimmed(!isLightsDimmed);
  const toggleTheater = () => {
    setTheaterMode(!isTheaterMode);
    if (!isTheaterMode) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch(e.key.toLowerCase()) {
        case 't': toggleTheater(); break;
        case 'l': toggleLights(); break;
        case 'f':
          (document.querySelector('iframe, video') as HTMLElement | null)?.requestFullscreen();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTheaterMode, isLightsDimmed]); // eslint-disable-line react-hooks/exhaustive-deps

  const overlayButtonClass =
    'h-11 w-11 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1/90 text-white backdrop-blur-md hover:bg-surface-elevated';

  return (
    <div className={cn(
      "relative space-y-4 md:space-y-6 transition-all duration-700 ease-in-out",
      format === 'shorts' ? "h-full w-full space-y-0" :
      isTheaterMode && device !== 'mobile' ? "fixed inset-0 z-[200] flex flex-col space-y-0 bg-background p-0" : "w-full z-[150]"
    )}>
      {isLightsDimmed && !isTheaterMode && format !== 'shorts' && (
        <div className="fixed inset-0 z-[140] bg-black/95 animate-in fade-in duration-500" onClick={toggleLights} />
      )}

      {/* Ambient Glow Effect (YouTube Style) */}
      {!isTheaterMode && format !== 'shorts' && (
        <div 
          className={cn(
            "absolute inset-0 z-0 opacity-20 blur-[120px] transition-all duration-1000",
            theme === 'anime' && 'bg-blue-600',
            theme === 'donghua' && 'bg-red-600',
            theme === 'movie' && 'bg-indigo-600',
            theme === 'drama' && 'bg-rose-600'
          )} 
          style={{ transform: 'scale(1.1)' }}
        />
      )}

      <div className={cn(
        "group relative z-10 overflow-hidden border border-border-subtle bg-surface-2 transition-all duration-700",
        frameClassName,
        !isTheaterMode && format !== 'shorts' && "hard-shadow-md",
        isLightsDimmed && !isTheaterMode && "ring-4 ring-zinc-100/10"
      )}>
        {activeUrl ? (
          useNativePlayer ? (
            <video
              key={key}
              src={activeUrl}
              className="h-full w-full bg-black object-contain"
              controls
              autoPlay={autoPlayProp}
              playsInline
              preload="metadata"
              onEnded={onEnded}
            />
          ) : (
            <iframe
              key={key}
              src={activeUrl}
              className="w-full h-full"
              allowFullScreen
              scrolling="no"
              allow="autoplay; encrypted-media"
              sandbox="allow-same-origin allow-scripts allow-forms allow-presentation"
            />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-surface-1">
             <div className={cn("mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent", accent.spinner)} />
             <p className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Preparing Stream...</p>
          </div>
        )}
        
        <div className={cn(
          "absolute top-4 right-4 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20",
          isTheaterMode && "top-8 right-8"
        )}>
          <div className="flex items-center gap-2 pointer-events-auto">
            {hasNext && onNext && (
              <Button
                variant="outline"
                size="icon"
                onClick={onNext}
                className={overlayButtonClass}
                title="Next Episode"
                aria-label="Next Episode"
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setKey(prev => prev + 1)}
              className={overlayButtonClass}
              title="Refresh Player"
              aria-label="Refresh Player"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleReport}
              className={cn(overlayButtonClass, reportedThisSession.includes(activeUrl || '') && "text-red-500")}
              title="Report Broken Mirror"
              aria-label="Report Broken Mirror"
            >
              <AlertCircle className="h-5 w-5" />
            </Button>
            {device !== 'mobile' && format !== 'shorts' && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleLights}
                  className={overlayButtonClass}
                  title={isLightsDimmed ? "Turn on lights" : "Dim lights"}
                  aria-label={isLightsDimmed ? "Turn on lights" : "Dim lights"}
                >
                  {isLightsDimmed ? <Lightbulb className="h-5 w-5" /> : <LightbulbOff className="h-5 w-5" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheater}
                  className={overlayButtonClass}
                  title={isTheaterMode ? "Exit theater mode" : "Theater mode"}
                  aria-label={isTheaterMode ? "Exit theater mode" : "Theater mode"}
                >
                  {isTheaterMode ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {showMirrorPanel && mirrors.length > 1 && format !== 'shorts' && (
        <Paper tone="muted" className="p-4 md:p-6" glassy shadow="sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-accent/20 bg-accent/10">
              <Layers className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-white/90">Available Mirrors</h4>
              <p className="text-[10px] font-bold text-zinc-500">Switch source if the current one is slow or broken</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {mirrors.map((mirror, idx) => {
              const isDead = deadMirrors.includes(mirror.embed_url);
              const isActive = activeUrl === mirror.embed_url;
              return (
                <button
                  key={mirror.embed_url}
                  disabled={isDead}
                  onClick={() => handleMirrorChange(mirror.embed_url, mirror.label)}
                  className={cn(
                    "px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-[var(--radius-sm)] border transition-all",
                    isActive 
                      ? "bg-accent text-black border-accent shadow-[0_0_15px_rgba(141,163,141,0.3)]" 
                      : isDead
                        ? "opacity-30 cursor-not-allowed border-white/5 bg-transparent"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {presentMirrorLabel(mirror.label, idx)}
                </button>
              );
            })}
          </div>
        </Paper>
      )}
    </div>
  );
}
