'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { getMangaByGenre, extractSlugFromUrl, getHDThumbnail, getPopularManga, getNewManga, MangaSearchResult } from "@/lib/api";
import { incrementInterest } from '@/lib/store';
import { BookOpen, Sparkles } from "lucide-react";
import { MediaCard } from "@/components/molecules/MediaCard";
import { MediaHubTemplate } from '@/components/organisms/MediaHubTemplate';
import { ContentRow } from '@/components/molecules/ContentRow';
import { SurpriseButton } from '@/components/molecules/SurpriseButton';

const COMMON_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Isekai", "Mystery", "Romance", "School", "Sci-fi", "Seinen", "Shoujo", "Shounen", "Slice of Life", "Sports"
];

export default function MangaPage() {
  const [results, setResults] = useState<MangaSearchResult[] | null>(null);
  const [popular, setPopular] = useState<MangaSearchResult[]>([]);
  const [newest, setNewest] = useState<MangaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [popData, newData] = await Promise.all([
          getPopularManga(),
          getNewManga(1, 12)
        ]);
        setPopular(popData.comics || []);
        setNewest(newData.comics || []);
        incrementInterest('manga');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleGenreClick = async (genre: string) => {
    setSearching(true);
    setActiveGenre(genre);
    try {
      const response = await getMangaByGenre(genre.toLowerCase());
      setResults(response.comics || []);
    } catch {
      // Error handling
    } finally {
      setSearching(false);
    }
  };

  return (
    <MediaHubTemplate
      title="Manga Library"
      description="Read thousands of premium manga titles with our high-speed, optimized reading experience."
      icon={BookOpen}
      theme="manga"
      genres={COMMON_GENRES}
      results={results}
      loading={loading}
      error={null}
      activeGenre={activeGenre}
      onGenreClick={handleGenreClick}
      onClearResults={() => {
        setResults(null);
        setActiveGenre(null);
      }}
      extraHeaderActions={<SurpriseButton type="manga" theme="manga" />}
    >
      <div className="space-y-32">
        <ContentRow title="Trending Manga" subtitle="Most popular this week" viewAllHref="/manga">
          {popular.map((mangaItem, index) => (
            <div key={index} className="flex-shrink-0 w-48">
              <MediaCard
                href={`/manga/${extractSlugFromUrl(mangaItem.link)}`}
                image={getHDThumbnail(mangaItem.image)}
                title={mangaItem.title}
                subtitle={mangaItem.chapter}
                badgeText={`#${index + 1}`}
                theme="manga"
              />
            </div>
          ))}
        </ContentRow>

        <section className="space-y-8">
           <div className="flex items-center gap-3 border-b border-zinc-900 pb-6">
              <Sparkles className="w-6 h-6 text-orange-500" />
              <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-white">New Releases</h2>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              {newest.map((mangaItem, index) => (
                <MediaCard
                  key={index}
                  href={`/manga/${extractSlugFromUrl(mangaItem.link)}`}
                  image={getHDThumbnail(mangaItem.image)}
                  title={mangaItem.title}
                  subtitle={mangaItem.time_ago}
                  badgeText={mangaItem.chapter}
                  theme="manga"
                />
              ))}
           </div>
        </section>
      </div>
    </MediaHubTemplate>
  );
}
