'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { getAnimeBatch } from '@/lib/adapters/anime';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { AdSection } from '@/components/organisms/AdSection';
import { Badge } from '@/components/atoms/Badge';
import { Paper } from '@/components/atoms/Paper';
import { ChevronLeft, Download, HardDrive } from 'lucide-react';
import type { KanataAnimeBatch } from '@/lib/types';

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
      <div className="app-shell flex min-h-screen items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app-shell flex min-h-screen flex-col items-center justify-center bg-background p-8 text-white">
        <h1 className="text-2xl font-bold mb-4">Batch tidak ditemukan</h1>
        <Button variant="anime" asChild>
          <Link href="/anime">Kembali ke Anime Hub</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="app-shell bg-background text-white">
      <header className="relative overflow-hidden py-16 sm:py-18">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
        <div className="app-container-wide relative z-10 space-y-6 md:space-y-8">
          <Button variant="outline" size="sm" asChild className="w-fit rounded-[var(--radius-lg)] border-border-subtle bg-surface-1 hover:bg-surface-elevated">
            <Link href="/anime">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Anime
            </Link>
          </Button>
          
          <div className="flex flex-col md:flex-row gap-10 items-end">
            <div className="w-48 aspect-[2/3] flex-shrink-0 overflow-hidden rounded-2xl border border-border-subtle shadow-2xl">
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

      <main className="app-container-wide space-y-12 pb-20 pt-6 md:space-y-14 md:pt-8">
        <AdSection theme="anime" />
        {data.download_list.map((section: KanataAnimeBatch['download_list'][number], sectionIdx: number) => (
          <section key={sectionIdx} className="space-y-8">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black italic text-zinc-300 uppercase tracking-tighter">{section.title}</h2>
              <div className="h-px flex-1 bg-border-subtle" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.links.map((item: { quality: string; size: string; links: { url: string; name: string }[] }, itemIdx: number) => (
                <Paper key={itemIdx} tone="muted" shadow="sm" className="group p-5 transition-colors hover:border-blue-500/30">
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
                        className="rounded-[var(--radius-sm)] border-border-subtle bg-surface-1 text-[10px] font-black uppercase tracking-widest hover:bg-surface-elevated hover:text-white"
                        asChild
                      >
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          {link.name}
                        </a>
                      </Button>
                    ))}
                  </div>
                </Paper>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
