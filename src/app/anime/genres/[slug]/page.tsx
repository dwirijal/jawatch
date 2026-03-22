'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getKanataAnimeByGenre, getKanataGenres, KanataAnime, KanataGenre } from '@/lib/api';
import { Film, ArrowLeft, Tag } from 'lucide-react';

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
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <nav className="mb-8">
          <Link
            href="/anime"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Anime Hub
          </Link>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Tag className="w-6 h-6 text-blue-400" />
            <h1 className="text-4xl font-black tracking-tight text-blue-400">
              {genreName || 'Genre'}
            </h1>
          </div>
          <p className="text-zinc-500">
            Browse anime in this category
          </p>
        </div>

        {/* Genre Tags */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Film className="w-4 h-4 text-zinc-500" />
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">All Genres</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre.slug}
                onClick={() => handleGenreClick(genre.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  slug === genre.slug
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-blue-500/50 hover:text-blue-400'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        {/* Anime Grid */}
        <main>
          <div className="flex items-center gap-3 mb-6">
            <Film className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">
              {genreName ? `${genreName} Anime` : 'Anime List'}
            </h2>
            <span className="text-sm text-zinc-500 font-medium">
              ({animeList.length} titles)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {loading ? (
              Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-zinc-900 rounded-2xl overflow-hidden animate-pulse aspect-[2/3]" />
              ))
            ) : animeList.length > 0 ? (
              animeList.map((anime, index) => (
                <Link
                  key={`${anime.slug}-${index}`}
                  href={`/anime/${anime.slug}`}
                  className="group relative flex flex-col"
                >
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-4 border border-zinc-800 transition-all group-hover:border-blue-500/50 group-hover:scale-[1.02] shadow-2xl">
                    <Image
                      src={anime.thumb}
                      alt={anime.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 20vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent opacity-100" />
                    <div className="absolute bottom-3 left-3 flex flex-col gap-1">
                      <span className="text-[9px] bg-blue-600 text-white px-2 py-1 rounded-md font-black tracking-widest w-fit">
                        {anime.episode.toUpperCase()}
                      </span>
                    </div>
                    {anime.type && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[8px] bg-zinc-900/90 text-zinc-300 px-1.5 py-0.5 rounded font-bold">
                          {anime.type}
                        </span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-black text-sm line-clamp-2 group-hover:text-blue-400 transition-colors leading-tight px-1">
                    {anime.title}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1 px-1">{anime.type}</p>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-zinc-500 font-medium">
                  No anime found in this genre.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
