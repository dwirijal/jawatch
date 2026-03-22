'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { movie, getHDThumbnail, MovieDetail, getMovieMetadata } from '@/lib/api';
import { Play, Star, Calendar, Clock, ChevronLeft, Film, Users, Globe } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { StatCard } from '@/components/molecules/StatCard';
import { BookmarkButton } from '@/components/molecules/BookmarkButton';
import { CircularLoader } from '@/components/atoms/CircularLoader';
import { MediaCard } from '@/components/molecules/MediaCard';
import { UserReviewSection } from '@/components/molecules/UserReviewSection';
import { ShareButton } from '@/components/molecules/ShareButton';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function MovieDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const [movieData, setMovie] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [poster, setPoster] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await movie.getDetail(slug);
        setMovie(data);
        
        // Initial poster
        const initialPoster = getHDThumbnail(data.poster);
        setPoster(initialPoster);

        // Enrich poster and actors from IMDB
        const meta = await getMovieMetadata(data.title);
        if (meta.poster) setPoster(meta.poster);
        if (meta.actors && !data.cast) {
          setMovie(prev => prev ? { ...prev, cast: meta.actors } : null);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <CircularLoader theme="movie" text=" • MOVIETUBE • ENRICHING DATA • " />
      </div>
    );
  }

  if (error || !movieData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4 uppercase italic font-black text-indigo-500">Movie not found</h1>
        <Button variant="movie" asChild>
          <Link href="/movies">Back to Movie Hub</Link>
        </Button>
      </div>
    );
  }

  const genres = movieData.genres ? movieData.genres.split(',').map(g => g.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <img 
          src={poster} 
          alt={movieData.title} 
          className="w-full h-full object-cover blur-3xl opacity-20 scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
          <nav className="mb-8">
            <Link href="/movies" className="text-zinc-400 hover:text-indigo-500 transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4" /> Back to Movies
            </Link>
          </nav>
          
          <div className="flex flex-col md:flex-row gap-10 items-end">
            <div className="w-56 aspect-[2/3] flex-shrink-0 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 bg-zinc-900">
              <img src={poster} alt={movieData.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 pb-4 text-center md:text-left">
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                {genres.map(genre => (
                  <Badge key={genre} variant="movie" className="rounded-xl">{genre}</Badge>
                ))}
                <Badge variant="outline" className="opacity-50">{movieData.quality || 'HD'}</Badge>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase text-white leading-none">{movieData.title}</h1>
                <div className="flex items-center gap-2">
                  <ShareButton title={movieData.title} theme="movie" />
                  <BookmarkButton 
                    item={{
                      id: slug,
                      type: 'movie' as any,
                      title: movieData.title,
                      image: poster,
                      timestamp: Date.now()
                    }}
                    theme="movie"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <StatCard label="Rating" value={movieData.rating?.toString() || 'N/A'} icon={Star} />
                <StatCard label="Year" value={movieData.year || 'N/A'} icon={Calendar} />
                <StatCard label="Duration" value={movieData.duration || 'N/A'} icon={Clock} />
                <StatCard label="Type" value={movieData.type?.toUpperCase() || 'MOVIE'} icon={Film} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-16 mt-8">
        <div className="lg:col-span-2 space-y-12">
          <section className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-900 shadow-2xl shadow-indigo-900/20 relative overflow-hidden group">
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                <div className="space-y-2">
                   <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Stream this {movieData.type}</h2>
                   <p className="text-indigo-100/80 font-medium text-sm">Experience {movieData.title} in {movieData.quality} quality.</p>
                </div>
                <Button variant="default" size="lg" className="rounded-2xl px-12 h-16 text-lg group/play" asChild>
                   <Link href={`/movies/watch/${slug}`}>
                      WATCH NOW <Play className="ml-3 w-6 h-6 fill-current group-hover/play:scale-110 transition-transform" />
                   </Link>
                </Button>
             </div>
             <Play className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 -rotate-12 transition-transform group-hover:scale-110" />
          </section>

          <section className="space-y-6">
            <h2 className="text-2xl font-black italic border-l-4 border-indigo-600 pl-4 uppercase tracking-tighter text-white">Synopsis</h2>
            <p className="text-zinc-400 leading-relaxed text-lg font-light">
              {movieData.synopsis || "No description available."}
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-zinc-900">
             {movieData.cast && (
               <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Cast
                  </h3>
                  <p className="text-sm font-medium text-zinc-300 leading-relaxed">{movieData.cast}</p>
               </div>
             )}
             {movieData.director && (
               <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                    <Film className="w-4 h-4" /> Director
                  </h3>
                  <p className="text-sm font-black text-indigo-400 uppercase italic tracking-wider">{movieData.director}</p>
               </div>
             )}
          </div>

          <UserReviewSection mediaId={slug} theme="movie" />
        </div>

        <aside className="space-y-12">
           <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] p-8 space-y-8">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest px-2">More Information</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                    <span className="text-xs font-bold text-zinc-500">Country</span>
                    <span className="text-xs font-black uppercase flex items-center gap-2 text-zinc-300">
                       <Globe className="w-3.5 h-3.5" /> {movieData.country || 'International'}
                    </span>
                 </div>
                 <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                    <span className="text-xs font-bold text-zinc-500">Release Date</span>
                    <span className="text-xs font-black uppercase text-zinc-300">{movieData.year}</span>
                 </div>
              </div>
           </div>

           {movieData.recommendations && movieData.recommendations.length > 0 && (
             <div className="space-y-8">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest px-2">You May Also Like</h3>
                <div className="grid grid-cols-1 gap-6">
                   {movieData.recommendations.slice(0, 4).map((rec, i) => (
                     <MediaCard 
                       key={i}
                       href={`/movies/${rec.slug}`}
                       image={rec.poster}
                       title={rec.title}
                       subtitle={rec.year}
                       theme="movie"
                     />
                   ))}
                </div>
             </div>
           )}
        </aside>
      </main>
    </div>
  );
}
