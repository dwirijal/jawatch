'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { getDonghuaDetail, AnichinDetail } from '@/lib/api';
import { incrementInterest } from '@/lib/store';
import { Play, Calendar, Monitor, BookOpen, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { StatCard } from '@/components/molecules/StatCard';
import { BookmarkButton } from '@/components/molecules/BookmarkButton';
import { ShareButton } from '@/components/molecules/ShareButton';
import { UserReviewSection } from '@/components/molecules/UserReviewSection';
import { CircularLoader } from '@/components/atoms/CircularLoader';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function DonghuaDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const [donghua, setDonghua] = useState<AnichinDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDonghuaDetail(slug);
        setDonghua(data);
        incrementInterest('donghua');
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
        <CircularLoader theme="donghua" />
      </div>
    );
  }

  if (error || !donghua) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4 uppercase italic font-black text-red-500">Donghua tidak ditemukan</h1>
        <Button variant="donghua" asChild>
          <Link href="/donghua">Kembali ke Donghua</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="relative h-[500px] w-full overflow-hidden">
        <div className="relative h-full w-full">
          <Image
            src={donghua.thumb}
            alt={donghua.title}
            fill
            className="w-full h-full object-cover blur-3xl opacity-20 scale-110"
            sizes="100vw"
            unoptimized
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
          <nav className="mb-8">
            <Link href="/donghua" className="text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest">
              <ChevronLeft className="w-4 h-4" /> Back to Browse
            </Link>
          </nav>
          
          <div className="flex flex-col md:flex-row gap-10 items-end">
            <div className="w-56 aspect-[2/3] flex-shrink-0 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-zinc-800 bg-zinc-900">
              <div className="relative h-full w-full">
                <Image
                  src={donghua.thumb}
                  alt={donghua.title}
                  fill
                  className="w-full h-full object-cover"
                  sizes="224px"
                  unoptimized
                />
              </div>
            </div>
            <div className="flex-1 pb-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {donghua.genres.map((genre: string) => (
                  <Badge key={genre} variant="donghua">{genre}</Badge>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase text-white">{donghua.title}</h1>
                <div className="flex items-center gap-2">
                  <ShareButton title={donghua.title} theme="donghua" />
                  <BookmarkButton 
                    item={{
                      id: slug,
                      type: 'donghua',
                      title: donghua.title,
                      image: donghua.thumb,
                      timestamp: Date.now()
                    }}
                    theme="donghua"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Studio" value={donghua.meta.studio} icon={Monitor} />
                <StatCard label="Status" value={donghua.meta.status} icon={Calendar} />
                <StatCard label="Total Eps" value={donghua.meta.episodes} icon={BookOpen} />
                <StatCard label="Season" value={donghua.meta.season} icon={Play} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="text-2xl font-black mb-6 italic border-l-4 border-red-600 pl-4 uppercase tracking-tighter text-white">Synopsis</h2>
            <p className="text-zinc-400 leading-relaxed text-lg font-light">
              {donghua.synopsis || "No synopsis available for this donghua."}
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black italic border-l-4 border-red-600 pl-4 uppercase tracking-tighter text-white">Episodes</h2>
              <Badge variant="outline">Updated: {donghua.meta.updated_on}</Badge>
            </div>
            
            <ScrollArea.Root className="w-full h-[600px] overflow-hidden rounded-3xl bg-zinc-900/30 border border-zinc-800">
              <ScrollArea.Viewport className="w-full h-full p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {donghua.episodes.map((ep) => (
                    <Link 
                      key={ep.slug}
                      href={`/donghua/episode/${ep.slug}`}
                      className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:bg-zinc-800 hover:border-red-500/30 transition-all group shadow-sm"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                        <Play className="w-4 h-4 text-red-500 group-hover:text-white fill-red-400 group-hover:fill-white" />
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-xs block group-hover:text-red-400 transition-colors tracking-tight text-zinc-200">{ep.title}</span>
                        <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{ep.date}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar className="flex select-none touch-none p-1 bg-zinc-900/10 w-2" orientation="vertical">
                <ScrollArea.Thumb className="flex-1 bg-zinc-800 rounded-full" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
          </section>

          <UserReviewSection mediaId={slug} theme="donghua" />
        </div>

        <aside className="space-y-12">
           <div className="p-8 bg-gradient-to-br from-red-600 to-red-800 rounded-[2rem] shadow-xl shadow-red-900/20 relative overflow-hidden group">
              <div className="relative z-10">
                <h3 className="text-xl font-black mb-2 italic uppercase tracking-tighter text-white">Latest Cultivation</h3>
                <p className="text-red-100 text-sm font-medium mb-6 opacity-80 leading-relaxed">Continue your path to the peak of immortality.</p>
                {donghua.episodes.length > 0 && (
                  <Button variant="default" className="rounded-xl px-8" asChild>
                    <Link href={`/donghua/episode/${donghua.episodes[0].slug}`}>
                      Watch Episode {donghua.episodes[0].episode} <Play className="w-3 h-3 ml-2 fill-current" />
                    </Link>
                  </Button>
                )}
              </div>
              <Play className="absolute -bottom-10 -right-10 w-40 h-40 text-white/5 rotate-12 transition-transform group-hover:scale-110" />
           </div>
           
           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Production Details</h3>
              <div className="grid grid-cols-1 gap-3">
                 <StatCard label="Country" value={donghua.meta.country} />
                 <StatCard label="Network" value={donghua.meta.network} />
                 <StatCard label="Duration" value={donghua.meta.duration} />
                 <StatCard label="Released" value={donghua.meta.released} />
              </div>
           </div>
        </aside>
      </main>
    </div>
  );
}
