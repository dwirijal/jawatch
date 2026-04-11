'use client';

import * as React from 'react';
import { Maximize, Minimize, Lightbulb, LightbulbOff, RefreshCw, Layers, AlertCircle, SkipForward, Play } from 'lucide-react';
import { cn, ThemeType } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { Switch } from '@/components/atoms/Switch';
import { useUIStore } from '@/store/useUIStore';
import { reportDeadMirror, getDeadMirrors } from '@/lib/store';

interface VideoPlayerProps {
  mirrors: Array<{ label: string; embed_url: string }>;
  defaultUrl: string;
  currentUrl?: string;
  onMirrorChange?: (url: string, label: string) => void;
  showMirrorPanel?: boolean;
  title?: string;
  showTitleOverlay?: boolean;
  theme?: 'anime' | 'donghua' | 'movie' | 'drama';
  format?: 'landscape' | 'vertical';
  onNext?: () => void;
  hasNext?: boolean;
  onEnded?: () => void;
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
  mirrors,
  defaultUrl,
  currentUrl,
  onMirrorChange,
  showMirrorPanel = true,
  theme = 'anime',
  format = 'landscape',
  onNext,
  hasNext,
  onEnded,
}: VideoPlayerProps) {
  const isControlled = typeof currentUrl === 'string';
  const [internalUrl, setInternalUrl] = React.useState(defaultUrl);
  const [key, setKey] = React.useState(0);
  const [deadMirrors, setDeadMirrors] = React.useState<string[]>([]);
  const [reportedThisSession, setReportedThisSession] = React.useState<string[]>([]);
  const [autoPlay, setAutoPlay] = React.useState(true);
  const { isTheaterMode, setTheaterMode, isLightsDimmed, setLightsDimmed, device } = useUIStore();
  const activeUrl = isControlled ? currentUrl : internalUrl;
  const accent = THEME_ACCENT[theme];
  const useNativePlayer = isDirectMediaUrl(activeUrl || '');
  const frameClassName =
    isTheaterMode && device !== 'mobile'
      ? 'h-full w-full rounded-none border-0'
      : format === 'vertical'
        ? 'mx-auto aspect-[9/16] w-full max-w-[26rem] rounded-[var(--radius-2xl)]'
        : 'aspect-video rounded-[var(--radius-2xl)]';

  React.useEffect(() => {
    setDeadMirrors(getDeadMirrors());
    if (isControlled) {
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
  }, [defaultUrl, isControlled, mirrors]);

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
      "relative z-[150] space-y-4 md:space-y-6 transition-all duration-700 ease-in-out",
      isTheaterMode && device !== 'mobile' ? "fixed inset-0 z-[200] flex flex-col space-y-0 bg-background p-0" : "w-full"
    )}>
      {isLightsDimmed && !isTheaterMode && (
        <div className="fixed inset-0 z-[140] bg-black/95 animate-in fade-in duration-500" onClick={toggleLights} />
      )}

      {/* Ambient Glow Effect (YouTube Style) */}
      {!isTheaterMode && (
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
        "group relative z-10 overflow-hidden border border-border-subtle bg-surface-2 hard-shadow-md transition-all duration-700",
        frameClassName,
        isLightsDimmed && !isTheaterMode && "ring-4 ring-zinc-100/10"
      )}>
        {activeUrl ? (
          useNativePlayer ? (
            <video
              key={key}
              src={activeUrl}
              className="h-full w-full bg-black object-contain"
              controls
              autoPlay={autoPlay}
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
        
        {/* Title overlay removed for cleaner aesthetic as title exists in sidebar */}
        
        <div className={cn(
          "absolute top-4 right-4 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20",
          isTheaterMode && "top-8 right-8"
        )}>
          <div className="flex items-center gap-2 pointer-events-auto">
            {hasNext && onNext && (
              <Button variant={theme} size="icon" onClick={onNext} className="h-11 w-11 rounded-[var(--radius-sm)]" title="Next Episode">
                <SkipForward className="w-5 h-5 fill-current" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleReport} disabled={reportedThisSession.includes(activeUrl || '')} className={cn(overlayButtonClass, reportedThisSession.includes(activeUrl || '') ? "text-green-400" : "hover:bg-red-500/20 hover:text-red-400")}><AlertCircle className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setKey(prev => prev + 1)} className={overlayButtonClass}><RefreshCw className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon" onClick={toggleLights} className={overlayButtonClass}>{isLightsDimmed ? <Lightbulb className="w-5 h-5" /> : <LightbulbOff className="w-5 h-5" />}</Button>
            {device !== 'mobile' && (
              <Button variant="ghost" size="icon" onClick={toggleTheater} className={overlayButtonClass}>{isTheaterMode ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</Button>
            )}
          </div>
        </div>

        {isTheaterMode && (
          <div className="absolute top-8 right-8 z-30 pointer-events-auto md:hidden">
             <Button variant="ghost" size="icon" onClick={toggleTheater} className="h-14 w-14 rounded-full border border-border-subtle bg-surface-1/90 text-white shadow-2xl backdrop-blur-md hover:bg-surface-elevated">
                <Minimize className="w-6 h-6" />
             </Button>
          </div>
        )}
      </div>

      {!isTheaterMode && showMirrorPanel && (
        <Paper tone="muted" shadow="sm" className={cn("p-4 md:p-6 transition-all", isLightsDimmed && "opacity-20 hover:opacity-100")}>
          <div className="mb-4 flex flex-col justify-between gap-4 md:mb-5 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-lg p-2", accent.panel)}>
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Watch Options</h2>
            </div>
            <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-4 py-2">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Auto Play</span>
                <Switch checked={autoPlay} onClick={() => setAutoPlay(!autoPlay)} className={!autoPlay ? 'bg-zinc-700' : undefined} />
             </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {mirrors.map((mirror, idx) => {
              const isDead = deadMirrors.includes(mirror.embed_url);
              const isActive = activeUrl === mirror.embed_url;
              return (
                <Button key={idx} variant={isActive ? theme as ThemeType : "outline"} onClick={() => handleMirrorChange(mirror.embed_url, mirror.label)} className={cn("relative overflow-hidden rounded-[var(--radius-sm)] px-6 text-[10px] uppercase tracking-[0.1em]", !isActive && "border-border-subtle bg-surface-1 hover:bg-surface-elevated", isDead && !isActive && "opacity-40 grayscale")}>
                  <div className="flex items-center gap-2 relative z-10">
                    {isDead ? <AlertCircle className="w-3 h-3 text-red-500" /> : <Play className={cn("w-3 h-3", isActive ? "fill-white" : "fill-zinc-500")} />}
                    {presentMirrorLabel(mirror.label, idx)}
                  </div>
                </Button>
              );
            })}
          </div>
        </Paper>
      )}
    </div>
  );
}
