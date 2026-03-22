'use client';

import * as React from 'react';
import { Star, TrendingUp, Users, ExternalLink, Play } from 'lucide-react';
import { JikanEnrichment } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/atoms/Badge';
import { StatCard } from '@/components/molecules/StatCard';

interface JikanEnrichmentPanelProps {
  data: JikanEnrichment | null;
  loading: boolean;
}

export function JikanEnrichmentPanel({ data, loading }: JikanEnrichmentPanelProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-zinc-900/50 rounded-2xl border border-zinc-800" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  // Filter out null/undefined tags
  const tags = [
    data.status,
    data.source,
    data.rating,
    data.year ? String(data.year) : null,
    data.season,
  ].filter(Boolean) as string[];

  const allTags = [
    ...tags,
    ...data.genres,
    ...data.themes,
    ...data.studios,
  ].slice(0, 10);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Dynamic Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl flex flex-col justify-between group hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">MAL Score</span>
          </div>
          <p className="text-2xl font-black text-white italic">{data.score || 'N/A'}</p>
        </div>

        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl flex flex-col justify-between group hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Global Rank</span>
          </div>
          <p className="text-2xl font-black text-white italic">#{data.rank || 'N/A'}</p>
        </div>

        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl flex flex-col justify-between group hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Users className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Popularity</span>
          </div>
          <p className="text-2xl font-black text-white italic">#{data.popularity || 'N/A'}</p>
        </div>

        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl flex flex-col justify-between group hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <ExternalLink className="w-3.5 h-3.5 text-green-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Official Source</span>
          </div>
          <a 
            href={data.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-black text-blue-400 hover:text-blue-300 underline underline-offset-4"
          >
            MYANIMELIST.NET
          </a>
        </div>
      </div>

      {/* Extended Tags */}
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag, i) => (
          <Badge key={i} variant="outline" className="rounded-xl border-zinc-800 text-zinc-500">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Trailer if available */}
      {data.trailer_url && (
        <div className="p-8 rounded-[2.5rem] bg-zinc-900/50 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="space-y-2 text-center md:text-left">
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Official Trailer</h3>
              <p className="text-zinc-500 text-xs font-medium">Watch the official promotional video for this series.</p>
           </div>
           <a 
             href={data.trailer_url} 
             target="_blank" 
             rel="noopener noreferrer"
             className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 active:scale-95"
           >
             Watch on YouTube <Play className="w-3.5 h-3.5 fill-current" />
           </a>
        </div>
      )}
    </div>
  );
}
