'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAnimeBatch, KanataAnimeBatch } from '@/lib/api';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { ChevronLeft, Download, HardDrive } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function AnimeBatchPage({ params }: PageProps) {
  const { slug } = use(params);
  const [data, setData] = useState<KanataAnimeBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const batchData = await getAnimeBatch(slug);
        setData(batchData);
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
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Batch tidak ditemukan</h1>
        <Button variant="anime" asChild>
          <Link href="/anime">Kembali ke Anime Hub</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <header className="relative py-20 px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 space-y-8">
          <Link href="/anime" className="text-zinc-400 hover:text-blue-400 transition-colors flex items-center gap-2 text-xs font-black uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4" /> Back to Browse
          </Link>
          
          <div className="flex flex-col md:flex-row gap-10 items-end">
            <div className="w-48 aspect-[2/3] flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
              <div className="relative h-full w-full">
                <Image
                  src={data.thumb}
                  alt={data.title}
                  fill
                  className="w-full h-full object-cover"
                  sizes="192px"
                  unoptimized
                />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase italic">{data.title}</h1>
              </div>
              <p className="text-zinc-500 font-medium max-w-2xl leading-relaxed">Pilih kualitas video dan server download di bawah ini untuk mengunduh seluruh episode sekaligus.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 mt-12 space-y-16">
        {data.download_list.map((section, sectionIdx) => (
          <section key={sectionIdx} className="space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black italic text-zinc-300 uppercase tracking-tighter">{section.title}</h2>
              <div className="flex-1 h-px bg-zinc-900" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.links.map((item: { quality: string; size: string; links: { url: string; name: string }[] }, itemIdx: number) => (
                <div key={itemIdx} className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all group shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <Badge variant="anime" className="px-4 py-1.5 rounded-xl">{item.quality}</Badge>
                    <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase tracking-widest">
                      <HardDrive className="w-3.5 h-3.5" /> {item.size}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {item.links.map((link: { url: string; name: string }, linkIdx: number) => (
                      <Button
                        key={linkIdx}
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                        asChild
                      >
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.name}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
