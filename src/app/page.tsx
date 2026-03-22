'use client';

import * as React from 'react';
import { Play, BookOpen, Film, Zap } from 'lucide-react';
import { HeroCarousel } from '@/components/organisms/HeroCarousel';
import { ContinueWatching } from '@/components/organisms/ContinueWatching';
import { HomeContentSection } from '@/components/organisms/HomeContentSection';
import { anime, manga, movie, donghua } from '@/lib/api';
import { getInterests } from '@/lib/store';
import { ThemeType } from '@/lib/utils';

type HomeSectionItem = {
  slug: string;
  title: string;
  thumb?: string;
  poster?: string;
  image?: string;
  thumbnail?: string;
  episode?: string;
  chapter?: string;
  year?: string;
  status?: string;
  type?: string;
};

type HomeSectionKey = Exclude<ThemeType, 'default'>;

export default function Home() {
  const [mounted, setMounted] = React.useState(false);
  const [sectionOrder, setSectionOrder] = React.useState<HomeSectionKey[]>(['anime', 'manga', 'donghua', 'movie']);
  
  // Data States
  const [data, setData] = React.useState<Record<HomeSectionKey, HomeSectionItem[]>>({
    anime: [],
    manga: [],
    movie: [],
    donghua: []
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
    
    async function init() {
      try {
        // 1. Determine Section Order based on Interests
        const interests = getInterests();
        const sorted = Object.entries(interests)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .map(([key]) => key as HomeSectionKey);
        
        const defaults: HomeSectionKey[] = ['anime', 'manga', 'donghua', 'movie'];
        const finalOrder = Array.from(new Set([...sorted, ...defaults]));
        setSectionOrder(finalOrder);

        // 2. Fetch Data for all sections parallelly
        const [animeData, mangaData, movieData, donghuaData] = await Promise.all([
          anime.getSchedule().then(s => s[0]?.anime_list.slice(0, 6) || []),
          manga.getPopular().then(m => m.comics.slice(0, 6)),
          movie.getHome('popular').then(mv => mv.slice(0, 6)),
          donghua.getHome().then(d => d.latest_updates.slice(0, 6))
        ]);

        setData({
          anime: animeData,
          manga: mangaData,
          movie: movieData,
          donghua: donghuaData
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  if (!mounted) return null;

  const sectionConfig = {
    anime: {
      title: "Trending Anime",
      subtitle: "New releases this season",
      icon: Play,
      viewAll: "/anime",
      itemType: "anime" as const
    },
    manga: {
      title: "Popular Manga",
      subtitle: "Read the hottest chapters",
      icon: BookOpen,
      viewAll: "/manga",
      itemType: "manga" as const
    },
    movie: {
      title: "Blockbuster Movies",
      subtitle: "Trending cinema & series",
      icon: Film,
      viewAll: "/movies",
      itemType: "movie" as const
    },
    donghua: {
      title: "Donghua Realm",
      subtitle: "Freshly cultivated episodes",
      icon: Zap,
      viewAll: "/donghua",
      itemType: "donghua" as const
    }
  };

  return (
    <div className="flex flex-col gap-24 pb-20">
      <HeroCarousel />
      
      <main className="max-w-7xl mx-auto px-8 space-y-32">
        <ContinueWatching />

        {sectionOrder.map((type) => {
          const config = sectionConfig[type];
          if (!config) return null;

          return (
            <HomeContentSection
              key={type}
              title={config.title}
              subtitle={config.subtitle}
              icon={config.icon}
              theme={type}
              items={data[type]}
              loading={loading}
              viewAllHref={config.viewAll}
              itemType={config.itemType}
            />
          );
        })}
      </main>
    </div>
  );
}
