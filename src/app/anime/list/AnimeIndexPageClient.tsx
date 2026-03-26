'use client';

import { useState } from 'react';
import { List } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { AdSection } from '@/components/organisms/AdSection';
import { ScrollArea, ScrollBar } from '@/components/atoms/ScrollArea';
import { CardGrid } from '@/components/molecules/card';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { cn } from '@/lib/utils';

type AnimeIndexCard = {
  slug: string;
  title: string;
  thumb: string;
  episode: string;
  type: string;
  status: string;
};

type AnimeIndexGroup = {
  letter: string;
  list: AnimeIndexCard[];
};

interface AnimeIndexPageClientProps {
  groups: AnimeIndexGroup[];
}

export default function AnimeIndexPageClient({ groups }: AnimeIndexPageClientProps) {
  const [activeLetter, setActiveLetter] = useState(groups[0]?.letter || '#');

  const scrollToLetter = (letter: string) => {
    setActiveLetter(letter);
    const element = document.getElementById(`letter-${letter}`);

    if (!element) {
      return;
    }

    const offset = 100;
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = element.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  };

  return (
    <div className="app-shell" data-theme="anime" data-view-mode="comfortable">
      <header className="border-b border-border-subtle bg-[linear-gradient(160deg,var(--surface-1),var(--surface-2))] px-4 py-5 sm:px-6 sm:py-7">
        <div className="app-container">
          <SectionHeader
            title="Anime Index"
            subtitle="Browse the full anime library from gateway-backed catalog data, organized from A to Z."
            icon={List}
            contentClassName="max-w-2xl"
            className="border-0 pb-0"
          />
        </div>
      </header>

      <nav className="sticky top-16 z-50 border-b border-border-subtle bg-background/85 px-4 py-3 backdrop-blur-xl">
        <div className="app-container">
          <ScrollArea className="w-full">
            <div className="flex gap-1.5">
              {groups.map((group) => (
                <button
                  key={group.letter}
                  onClick={() => scrollToLetter(group.letter)}
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border text-[10px] font-black uppercase tracking-[0.18em] transition-all',
                    activeLetter === group.letter
                      ? 'border-border-subtle bg-surface-elevated text-white shadow-sm shadow-black/10'
                      : 'border-border-subtle bg-surface-1 text-zinc-500 hover:bg-surface-elevated hover:text-zinc-200'
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

      <main className="app-container mt-6 sm:mt-8 md:mt-10">
        <AdSection className="mb-6 sm:mb-8 md:mb-10" />
        {groups.length === 0 ? (
          <div className="surface-panel-elevated px-6 py-14 text-center md:px-8 md:py-16">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Anime index unavailable</p>
            <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-400">
              Anime catalog from the API gateway could not be loaded for the index page right now.
            </p>
          </div>
        ) : (
          <div className="space-y-12 md:space-y-16">
            {groups.map((group) => (
              <section key={group.letter} id={`letter-${group.letter}`} className="scroll-mt-28 space-y-5 md:space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-border-subtle bg-surface-1 text-lg font-black text-blue-500 shadow-sm">
                    {group.letter}
                  </div>
                  <div className="h-px flex-1 bg-border-subtle/70" />
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-700">
                    {group.list.length} Titles
                  </span>
                </div>

                <CardGrid>
                  {group.list.map((anime) => (
                    <Card
                      key={anime.slug}
                      href={`/anime/${anime.slug}`}
                      image={anime.thumb}
                      title={anime.title}
                      subtitle={anime.status || anime.episode}
                      badgeText={anime.type || 'Anime'}
                      theme="anime"
                    />
                  ))}
                </CardGrid>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
