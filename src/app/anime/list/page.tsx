'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAnimeList, AnimeListGroup } from '@/lib/api';
import { ScrollArea, ScrollBar } from '@/components/atoms/ScrollArea';
import { List, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnimeListPage() {
  const [data, setData] = useState<AnimeListGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLetter, setActiveLetter] = useState('#');

  useEffect(() => {
    async function fetchData() {
      try {
        const list = await getAnimeList();
        setData(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const scrollToLetter = (letter: string) => {
    setActiveLetter(letter);
    const element = document.getElementById(`letter-${letter}`);
    if (element) {
      const offset = 100; // Account for sticky nav
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <header className="py-16 px-8 border-b border-zinc-900 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <List className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Anime Index</h1>
          </div>
          <p className="text-zinc-500 font-medium max-w-md">Browse our complete library of anime titles organized from A to Z.</p>
        </div>
      </header>

      {/* Sticky Alphabet Nav */}
      <nav className="sticky top-16 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800 py-4 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <ScrollArea className="w-full">
            <div className="flex gap-1">
              {data.map((group) => (
                <button
                  key={group.letter}
                  onClick={() => scrollToLetter(group.letter)}
                  className={cn(
                    "w-10 h-10 shrink-0 flex items-center justify-center rounded-xl text-xs font-black transition-all",
                    activeLetter === group.letter 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                  )}
                >
                  {group.letter}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 mt-12">
        {loading ? (
          <div className="space-y-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-6">
                <div className="w-12 h-12 bg-zinc-900 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                    <div key={j} className="h-12 bg-zinc-900/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-20">
            {data.map((group) => (
              <section key={group.letter} id={`letter-${group.letter}`} className="space-y-8 scroll-mt-32">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl font-black text-blue-500 shadow-xl">
                    {group.letter}
                  </div>
                  <div className="flex-1 h-px bg-zinc-900" />
                  <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em]">{group.list.length} TITLES</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {group.list.map((anime) => (
                    <Link
                      key={anime.slug}
                      href={`/anime/${anime.slug}`}
                      className="group flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl hover:bg-zinc-900 hover:border-blue-500/30 transition-all shadow-sm"
                    >
                      <span className="text-sm font-bold text-zinc-400 group-hover:text-blue-400 transition-colors line-clamp-1">
                        {anime.title}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-800 group-hover:text-blue-500 transition-colors" />
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
