'use client';

import * as React from 'react';
import { Download, X, Share, PlusSquare, ArrowUp } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

export function PWAInstallPrompt() {
  const { showPrompt, showIOSGuide, handleInstall, isStandalone } = usePWAInstall();
  const [isVisible, setIsVisible] = React.useState(true);

  if (isStandalone || !isVisible) return null;
  if (!showPrompt && !showIOSGuide) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[300] animate-in slide-in-from-bottom-10 duration-700">
      <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-colors" />
        
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>

        <div className="flex items-start gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/20">
            <Download className="w-7 h-7 text-white" />
          </div>
          
          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-black uppercase italic tracking-tight text-white">Install dwizzyWEEB</h3>
            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
              {showIOSGuide 
                ? "Tap 'Share' and 'Add to Home Screen' for the best experience." 
                : "Get faster access and premium features directly from your home screen."}
            </p>
          </div>
        </div>

        <div className="mt-6">
          {showIOSGuide ? (
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl border border-white/10">
               <div className="flex items-center gap-3">
                  <Share className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase">Share</span>
               </div>
               <div className="w-px h-4 bg-zinc-800" />
               <div className="flex items-center gap-3">
                  <PlusSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase">Add to Home</span>
               </div>
               <ArrowUp className="w-4 h-4 text-blue-500 animate-bounce" />
            </div>
          ) : (
            <Button 
              onClick={handleInstall}
              variant="anime" 
              className="w-full rounded-2xl h-12 shadow-xl shadow-blue-900/20"
            >
              INSTALL NOW
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
