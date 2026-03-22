'use client';

import * as React from 'react';
import { Maximize, Minimize, Lightbulb, LightbulbOff, RefreshCw, Layers, AlertCircle, SkipForward, Play } from 'lucide-react';
import { cn, ThemeType } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
import { useUIStore } from '@/store/useUIStore';
import { reportDeadMirror, getDeadMirrors } from '@/lib/store';

interface VideoPlayerProps {
  mirrors: Array<{ label: string; embed_url: string }>;
  defaultUrl: string;
  title?: string;
  theme?: 'anime' | 'donghua' | 'movie';
  onNext?: () => void;
  hasNext?: boolean;
}

export function VideoPlayer({ mirrors, defaultUrl, title, theme = 'anime', onNext, hasNext }: VideoPlayerProps) {
  const [currentUrl, setCurrentUrl] = React.useState(defaultUrl);
  const [key, setKey] = React.useState(0);
  const [deadMirrors, setDeadMirrors] = React.useState<string[]>([]);
  const [reportedThisSession, setReportedThisSession] = React.useState<string[]>([]);
  const [autoPlay, setAutoPlay] = React.useState(true);
  const { isTheaterMode, setTheaterMode, isLightsDimmed, setLightsDimmed, device } = useUIStore();

  React.useEffect(() => {
    setDeadMirrors(getDeadMirrors());
    const preferredLabel = localStorage.getItem('dwizzy_preferred_mirror');
    if (preferredLabel) {
      const matchingMirror = mirrors.find(m => m.label === preferredLabel);
      if (matchingMirror && !getDeadMirrors().includes(matchingMirror.embed_url)) {
        setCurrentUrl(matchingMirror.embed_url);
        return;
      }
    }
    setCurrentUrl(defaultUrl);
  }, [defaultUrl, mirrors]);

  const handleMirrorChange = (url: string, label: string) => {
    setCurrentUrl(url);
    setKey(prev => prev + 1);
    localStorage.setItem('dwizzy_preferred_mirror', label);
  };

  const handleReport = () => {
    if (confirm('Report this mirror as broken/expired?')) {
      reportDeadMirror(currentUrl);
      setDeadMirrors(prev => [...prev, currentUrl]);
      setReportedThisSession(prev => [...prev, currentUrl]);
      const nextMirror = mirrors.find(m => !getDeadMirrors().includes(m.embed_url) && m.embed_url !== currentUrl);
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
          document.querySelector('iframe')?.requestFullscreen();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTheaterMode, isLightsDimmed]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn(
      "relative z-[150] space-y-6 transition-all duration-700 ease-in-out",
      isTheaterMode && device !== 'mobile' ? "fixed inset-0 z-[200] bg-zinc-950 flex flex-col p-0 space-y-0" : "w-full"
    )}>
      {isLightsDimmed && !isTheaterMode && (
        <div className="fixed inset-0 z-[140] bg-black/95 animate-in fade-in duration-500" onClick={toggleLights} />
      )}

      <div className={cn(
        "relative bg-zinc-900 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-zinc-800 group transition-all duration-700",
        isTheaterMode && device !== 'mobile' ? "h-full w-full rounded-0 border-0" : "aspect-video rounded-[2rem]",
        isLightsDimmed && !isTheaterMode && "ring-4 ring-zinc-100/10"
      )}>
        {currentUrl ? (
          <iframe
            key={key}
            src={currentUrl}
            className="w-full h-full"
            allowFullScreen
            scrolling="no"
            allow="autoplay; encrypted-media"
            sandbox="allow-same-origin allow-scripts allow-forms allow-presentation"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950">
             <div className={cn("w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4", 
               theme === 'anime' ? "border-blue-600" : theme === 'donghua' ? "border-red-600" : "border-indigo-600"
             )} />
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 animate-pulse">Preparing Stream...</p>
          </div>
        )}
        
        <div className={cn(
          "absolute top-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20",
          isTheaterMode && "top-8 left-8 right-8"
        )}>
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 pointer-events-auto flex items-center gap-3">
            <p className="text-xs font-black text-white uppercase italic tracking-wider">{title || 'Streaming Now'}</p>
          </div>
          
          <div className="flex items-center gap-2 pointer-events-auto">
            {hasNext && onNext && (
              <Button variant="ghost" size="icon" onClick={onNext} className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-600/20 h-12 w-12" title="Next Episode">
                <SkipForward className="w-5 h-5 fill-current" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleReport} disabled={reportedThisSession.includes(currentUrl)} className={cn("bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white h-12 w-12", reportedThisSession.includes(currentUrl) ? "text-green-400" : "hover:bg-red-500/20 hover:text-red-400")}><AlertCircle className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setKey(prev => prev + 1)} className="bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white h-12 w-12"><RefreshCw className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon" onClick={toggleLights} className="bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white h-12 w-12">{isLightsDimmed ? <Lightbulb className="w-5 h-5" /> : <LightbulbOff className="w-5 h-5" />}</Button>
            {device !== 'mobile' && (
              <Button variant="ghost" size="icon" onClick={toggleTheater} className="bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white h-12 w-12">{isTheaterMode ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</Button>
            )}
          </div>
        </div>

        {isTheaterMode && (
          <div className="absolute top-8 right-8 z-30 pointer-events-auto md:hidden">
             <Button variant="ghost" size="icon" onClick={toggleTheater} className="bg-black/60 backdrop-blur-md rounded-full text-white h-14 w-14 shadow-2xl">
                <Minimize className="w-6 h-6" />
             </Button>
          </div>
        )}
      </div>

      {!isTheaterMode && (
        <div className={cn("bg-zinc-900/30 border border-zinc-800 rounded-[2rem] p-6 transition-all", isLightsDimmed && "opacity-20 hover:opacity-100")}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", theme === 'anime' ? "bg-blue-600/20 text-blue-400" : theme === 'donghua' ? "bg-red-600/20 text-red-400" : "bg-indigo-600/20 text-indigo-400")}>
                <Layers className="w-4 h-4" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Stream Source</h2>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Auto Play</span>
                <button onClick={() => setAutoPlay(!autoPlay)} className={cn("w-8 h-4 rounded-full transition-all relative", autoPlay ? "bg-orange-600" : "bg-zinc-700")}>
                  <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", autoPlay ? "left-4.5" : "left-0.5")} />
                </button>
             </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {mirrors.map((mirror, idx) => {
              const isDead = deadMirrors.includes(mirror.embed_url);
              const isActive = currentUrl === mirror.embed_url;
              return (
                <Button key={idx} variant={isActive ? theme as ThemeType : "outline"} onClick={() => handleMirrorChange(mirror.embed_url, mirror.label)} className={cn("rounded-2xl px-6 border-zinc-800 text-[10px] uppercase tracking-[0.1em] relative overflow-hidden", isDead && !isActive && "opacity-40 grayscale")}>
                  <div className="flex items-center gap-2 relative z-10">
                    {isDead ? <AlertCircle className="w-3 h-3 text-red-500" /> : <Play className={cn("w-3 h-3", isActive ? "fill-white" : "fill-zinc-500")} />}
                    {mirror.label}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
