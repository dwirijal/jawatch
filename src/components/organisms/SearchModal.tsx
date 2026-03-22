'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, X, Command, Play, BookOpen, Zap, Loader2, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
import { manga, anime, donghua, movie, MangaSearchResult, KanataAnime, AnichinDonghua, MovieCardItem, getMovieMetadata } from '@/lib/api';
import { ScrollArea, ScrollBar } from '@/components/atoms/ScrollArea';
import { useUIStore } from '@/store/useUIStore';

export function SearchModal() {
  const { isSearchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<{ type: string; title: string; slug: string; image: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isSearchOpen, setSearchOpen]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const [mangaRes, animeRes, donghuaRes, movieRes] = await Promise.all([
        manga.search(val).catch(() => ({ data: [] as MangaSearchResult[] })),
        anime.search(val).catch(() => [] as KanataAnime[]),
        donghua.search(val).catch(() => [] as AnichinDonghua[]),
        movie.search(val).catch(() => [] as MovieCardItem[])
      ]);

      const initialCombined = [
        ...(mangaRes.data || []).map((m) => ({ type: 'manga', title: m.title, slug: m.slug, image: m.thumbnail })),
        ...(animeRes || []).slice(0, 5).map((a) => ({ type: 'anime', title: a.title, slug: a.slug, image: a.thumb })),
        ...(donghuaRes || []).slice(0, 5).map((d) => ({ type: 'donghua', title: d.title, slug: d.slug, image: d.thumb || d.image || '' })),
        ...(movieRes || []).slice(0, 5).map((mv) => ({ type: 'movies', title: mv.title, slug: mv.slug, image: mv.poster }))
      ];

      setResults(initialCombined);

      // Async enrichment for movies in background
      const movieIndices = initialCombined.map((item, idx) => item.type === 'movies' ? idx : -1).filter(idx => idx !== -1);
      
      if (movieIndices.length > 0) {
        Promise.all(movieIndices.map(async (idx) => {
          const item = initialCombined[idx];
          const meta = await getMovieMetadata(item.title);
          if (meta.poster) {
            setResults(prev => {
              const updated = [...prev];
              if (updated[idx]) updated[idx] = { ...updated[idx], image: meta.poster };
              return updated;
            });
          }
        }));
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSelect = (type: string, slug: string) => {
    setSearchOpen(false);
    setQuery('');
    setResults([]);
    router.push(`/${type === 'movies' ? 'movies' : type}/${slug}`);
  };

  return (
    <>
      <Button 
        variant="ghost" 
        onClick={() => setSearchOpen(true)}
        className="hidden md:flex items-center gap-4 px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-xl hover:border-zinc-700"
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Search anything...</span>
        </div>
        <div className="flex items-center gap-1 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
          <Command className="w-2.5 h-2.5" />
          <span className="text-[10px] font-black">K</span>
        </div>
      </Button>

      <Dialog.Root open={isSearchOpen} onOpenChange={setSearchOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[201] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 p-4 animate-in zoom-in-95 duration-300 outline-none">
            <div className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-2xl">
              <div className="flex items-center border-b border-zinc-900 p-4">
                <Search className="mr-3 h-5 w-5 text-zinc-500" />
                <input
                  autoFocus
                  placeholder="Search Movies, Anime, Manga..."
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 bg-transparent text-lg font-medium outline-none placeholder:text-zinc-600"
                />
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
                ) : (
                  <button 
                    onClick={() => setSearchOpen(false)}
                    className="rounded-lg p-1 hover:bg-zinc-900 transition-colors"
                  >
                    <X className="h-5 w-5 text-zinc-500" />
                  </button>
                )}
              </div>

              <ScrollArea className="max-h-[60vh]">
                <div className="p-4 space-y-6">
                  {results.length > 0 ? (
                    <div className="space-y-2">
                      {results.map((item, idx) => (
                        <button
                          key={`${item.slug}-${idx}`}
                          onClick={() => onSelect(item.type, item.slug)}
                          className="flex w-full items-center gap-4 rounded-2xl p-3 hover:bg-zinc-900 transition-all group border border-transparent hover:border-zinc-800"
                        >
                          <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800">
                            <img src={item.image} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              {item.type === 'manga' && <BookOpen className="w-3 h-3 text-orange-500" />}
                              {item.type === 'anime' && <Play className="w-3 h-3 text-blue-500 fill-current" />}
                              {item.type === 'donghua' && <Zap className="w-3 h-3 text-red-500 fill-current" />}
                              {item.type === 'movies' && <Film className="w-3 h-3 text-indigo-500 fill-current" />}
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                item.type === 'manga' && "text-orange-500",
                                item.type === 'anime' && "text-blue-500",
                                item.type === 'donghua' && "text-red-500",
                                item.type === 'movies' && "text-indigo-500",
                              )}>
                                {item.type}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors line-clamp-1">{item.title}</h4>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : query.length >= 3 && !loading ? (
                    <div className="py-12 text-center">
                      <p className="text-zinc-500 font-medium text-sm">No results found for &quot;{query}&quot;</p>
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-2">
                      <p className="text-xs font-black text-zinc-700 uppercase tracking-[0.3em]">Start typing to search</p>
                      <p className="text-[10px] text-zinc-800 font-bold">MINIMUM 3 CHARACTERS</p>
                    </div>
                  )}
                </div>
                <ScrollBar />
              </ScrollArea>
              
              <div className="bg-zinc-900/50 p-3 px-6 border-t border-zinc-900 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                       <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-[10px] font-black border border-zinc-700">ESC</kbd>
                       <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">to close</span>
                    </div>
                 </div>
                 <span className="text-[9px] font-black text-zinc-600 italic uppercase">Powered by dwizzyWEEB</span>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
