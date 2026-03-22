'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { movie, getMovieStream, MovieDetail, getMovieMetadata, getHDThumbnail } from '@/lib/api';
import { ChevronLeft, Info, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { VideoPlayer } from '@/components/molecules/VideoPlayer';
import { CircularLoader } from '@/components/atoms/CircularLoader';
import { saveHistory } from '@/lib/store';
import { Badge } from '@/components/atoms/Badge';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function MovieWatchPage({ params }: PageProps) {
  const { slug } = use(params);
  const [movieData, setMovie] = useState<MovieDetail | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [poster, setPoster] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await movie.getDetail(slug);
        setMovie(data);
        
        // Initial poster
        setPoster(getHDThumbnail(data.poster));

        const stream = await movie.getStream(slug, data.type);
        setStreamUrl(stream);

        // Async enrichment for metadata and poster
        getMovieMetadata(data.title).then(meta => {
          if (meta.poster) setPoster(meta.poster);
          if (meta.actors && !data.cast) {
            setMovie(prev => prev ? { ...prev, cast: meta.actors } : null);
          }
        });

        // Record to History
        saveHistory({
          id: slug,
          type: 'movie',
          title: data.title,
          image: data.poster,
          lastChapterOrEpisode: data.type?.toUpperCase() || 'MOVIE',
          lastLink: `/movies/watch/${slug}`,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <CircularLoader theme="movie" text=" • MOVIETUBE • SECURING STREAM • " />
      </div>
    );
  }

  if (!movieData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-black text-indigo-500 uppercase italic">Stream not found</h1>
        <Button variant="movie" className="mt-6" asChild>
          <Link href="/movies">Back to Movies</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Immersive Header */}
      <header className="bg-zinc-900/50 border-b border-zinc-800 p-4 sticky top-0 z-[160] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
              <Link href={`/movies/${slug}`}>
                <ChevronLeft className="w-6 h-6" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-black line-clamp-1 uppercase italic text-white">{movieData.title}</h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Streaming in {movieData.quality}</p>
              </div>
            </div>
          </div>
          
          <Button variant="outline" size="sm" asChild className="rounded-xl border-zinc-800 hidden md:flex">
            <Link href="/movies">
              <LayoutGrid className="w-4 h-4 mr-2" /> More Movies
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <VideoPlayer 
          mirrors={[{ label: 'Primary Server', embed_url: streamUrl || '' }]} 
          defaultUrl={streamUrl || ''} 
          title={movieData.title}
          theme="movie"
        />

        <div className="mt-12 bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-32 aspect-[2/3] rounded-2xl overflow-hidden border border-zinc-800 shrink-0 hidden md:block">
                 <img src={poster} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-4">
                 <div className="flex items-center gap-3">
                    <Badge variant="movie">{movieData.year}</Badge>
                    <Badge variant="outline" className="text-zinc-500">{movieData.duration}</Badge>
                 </div>
                 <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">{movieData.title}</h2>
                 <p className="text-zinc-400 leading-relaxed text-sm max-w-3xl">{movieData.synopsis}</p>
                 
                 <div className="pt-4">
                    <Button variant="ghost" asChild className="text-indigo-400 hover:text-indigo-300 p-0 h-auto">
                       <Link href={`/movies/${slug}`}>
                          <Info className="w-4 h-4 mr-2" /> View Full Movie Details
                       </Link>
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
