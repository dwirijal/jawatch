'use client';

import * as React from 'react';
import { getHistory, getBookmarks, HistoryItem, BookmarkItem } from '@/lib/store';
import { LibraryBig, Clock, Bookmark, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { MediaCard } from '@/components/molecules/MediaCard';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';
import Link from 'next/link';

export default function CollectionPage() {
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [bookmarks, setBookmarks] = React.useState<BookmarkItem[]>([]);
  const [activeTab, setActiveTab] = React.useState<'history' | 'bookmarks'>('history');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setHistory(getHistory());
    setBookmarks(getBookmarks());
    setMounted(true);
  }, []);

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear your entire history?')) {
      localStorage.removeItem('dwizzy_history');
      setHistory([]);
    }
  };

  const clearBookmarks = () => {
    if (confirm('Are you sure you want to clear all bookmarks?')) {
      localStorage.removeItem('dwizzy_bookmarks');
      setBookmarks([]);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <header className="py-16 md:py-20 px-8 border-b border-zinc-900 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl shadow-lg bg-zinc-100 text-zinc-900">
                <LibraryBig className="w-8 h-8 fill-current" />
              </div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase italic">
                Your Library
              </h1>
            </div>
            <p className="text-zinc-500 font-medium max-w-md leading-relaxed">
              Your personal collection of watched episodes, read chapters, and saved favorites.
            </p>
          </div>
          
          <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800">
            <button 
              onClick={() => setActiveTab('history')}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
                activeTab === 'history' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
            >
              <Clock className="w-4 h-4" /> History
            </button>
            <button 
              onClick={() => setActiveTab('bookmarks')}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
                activeTab === 'bookmarks' ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
            >
              <Bookmark className="w-4 h-4" /> Bookmarks
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 mt-12 space-y-12">
        {activeTab === 'history' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">Continue Watching & Reading</h2>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-xs font-black text-red-500 hover:text-red-400 uppercase flex items-center gap-2 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((item) => {
                   const config = THEME_CONFIG[item.type as ThemeType] || THEME_CONFIG.default;
                   return (
                    <Link 
                      key={item.id}
                      href={item.lastLink}
                      className={cn(
                        "flex gap-4 p-4 rounded-[2rem] bg-zinc-900/30 border border-zinc-800 hover:bg-zinc-900 transition-all group",
                        config.hoverBorder
                      )}
                    >
                      <div className="w-24 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 relative">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                           <Play className={cn("w-6 h-6 fill-current", config.text)} />
                        </div>
                      </div>
                      <div className="flex-1 py-2 flex flex-col justify-between">
                        <div>
                          <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-2 block", config.text)}>
                            {item.type}
                          </span>
                          <h3 className="font-black text-sm text-white line-clamp-2 uppercase italic leading-snug">{item.title}</h3>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                            {item.type === 'manga' ? 'Read:' : 'Watch:'} {item.lastChapterOrEpisode}
                          </p>
                          <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">
                             {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="py-24 text-center border-2 border-dashed border-zinc-900 rounded-[3rem]">
                <Clock className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                <h3 className="text-xl font-black text-zinc-500 uppercase tracking-widest">No History Yet</h3>
                <p className="text-sm text-zinc-600 mt-2 font-medium">Start watching or reading to build your history.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === 'bookmarks' && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">Your Saved Favorites</h2>
              {bookmarks.length > 0 && (
                <button onClick={clearBookmarks} className="text-xs font-black text-red-500 hover:text-red-400 uppercase flex items-center gap-2 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>

            {bookmarks.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                {bookmarks.map((item) => (
                  <MediaCard
                    key={item.id}
                    href={`/${item.type === 'movie' ? 'movies' : item.type}/${item.id}`}
                    image={item.image}
                    title={item.title}
                    badgeText={item.type}
                    theme={item.type as ThemeType}
                  />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center border-2 border-dashed border-zinc-900 rounded-[3rem]">
                <Bookmark className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                <h3 className="text-xl font-black text-zinc-500 uppercase tracking-widest">No Bookmarks Yet</h3>
                <p className="text-sm text-zinc-600 mt-2 font-medium">Save your favorite series to quickly access them later.</p>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
