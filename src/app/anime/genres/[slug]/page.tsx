'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Film, ArrowLeft, Tag } from 'lucide-react';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { AdSection } from '@/components/organisms/AdSection';
import { SkeletonCard } from '@/components/molecules/SkeletonCard';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { StateInfo } from '@/components/molecules/StateInfo';
import { getKanataAnimeByGenre, getKanataGenres } from '@/lib/adapters/anime';
import type { KanataAnime, KanataGenre } from '@/lib/types';

export default function GenrePage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const [animeList, setAnimeList] = useState<KanataAnime[]>([]);
  const [genres, setGenres] = useState<KanataGenre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const [genreList, anime] = await Promise.all([
          getKanataGenres(),
          getKanataAnimeByGenre(slug),
        ]);

        if (cancelled) return;

        setGenres(genreList);
        setAnimeList(anime);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch genre page:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const genreName = genres.find((genre) => genre.slug === slug)?.name ?? slug.replace(/-/g, ' ');

  const handleGenreClick = (nextSlug: string) => {
    if (nextSlug === slug) return;
    router.push(`/anime/genres/${nextSlug}`);
  };

  return (
    <main className="app-shell bg-zinc-950 font-sans text-zinc-50">
      <div className="app-container space-y-8 py-4 sm:py-6">
        <nav>
          <Link
            href="/anime"
            className="inline-flex items-center gap-2 text-zinc-400 transition-colors hover:text-zinc-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Anime Hub
          </Link>
        </nav>

        <section className="surface-panel-elevated p-6 sm:p-8">
          <SectionHeader
            title={genreName || 'Genre'}
            subtitle="Browse anime in this category"
            icon={Tag}
            contentClassName="max-w-3xl"
            className="border-0 pb-0"
          />

          <Paper tone="muted" className="mt-6 rounded-[var(--radius-xl)] p-4 sm:mt-8 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Film className="h-4 w-4 text-zinc-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">All Genres</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <Button
                  key={genre.slug}
                  onClick={() => handleGenreClick(genre.slug)}
                  variant={slug === genre.slug ? 'anime' : 'outline'}
                  size="sm"
                  className={slug === genre.slug ? 'rounded-xl px-4' : 'rounded-xl px-4 text-zinc-300'}
                >
                  {genre.name}
                </Button>
              ))}
            </div>
          </Paper>
        </section>

        <AdSection theme="anime" />

        <section className="space-y-4 sm:space-y-5">
          <SectionHeader
            title={genreName ? `${genreName} Anime` : 'Anime List'}
            subtitle={`${animeList.length} titles`}
            icon={Film}
          />

          <div className="media-grid" data-grid-density="default">
            {loading ? (
              Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            ) : animeList.length > 0 ? (
              animeList.map((anime, index) => (
                <Card
                  key={`${anime.slug}-${index}`}
                  href={`/anime/${anime.slug}`}
                  image={anime.thumb}
                  title={anime.title}
                  subtitle={anime.type}
                  badgeText={anime.episode ? anime.episode.toUpperCase() : 'TBA'}
                  theme="anime"
                />
              ))
            ) : (
              <StateInfo
                title="No anime found"
                description="This genre does not have synced titles yet. Try another genre or browse the full anime hub."
                className="col-span-full py-20"
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
