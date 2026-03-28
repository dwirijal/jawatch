'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { ChevronLeft, Download, HardDrive, Info } from 'lucide-react';
import { getAnimeBatch } from '@/lib/adapters/anime';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { CircularLoader } from '@/components/atoms/CircularLoader';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { StateInfo } from '@/components/molecules/StateInfo';
import { DetailActionCard } from '@/components/molecules/DetailActionCard';
import { DetailSectionHeading } from '@/components/molecules/DetailSectionHeading';
import { DownloadMediaPage } from '@/components/organisms/DownloadMediaPage';
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
      } catch {
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
        <CircularLoader theme="anime" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center bg-background p-8 text-white">
        <StateInfo
          type="error"
          title="Batch not found"
          description="This download pack could not be loaded."
          actionLabel="Back to Anime"
          onAction={() => window.location.assign('/anime')}
          className="w-full max-w-xl"
        />
      </div>
    );
  }

  return (
    <DownloadMediaPage
      theme="anime"
      hero={
        <section className="surface-panel-elevated relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={data.thumb || '/favicon.ico'}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-20 blur-2xl scale-110"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/80" />
          </div>

          <div className="relative z-10 px-5 py-5 md:px-6 md:py-6">
            <nav className="mb-6">
              <Button variant="outline" size="sm" asChild className="w-fit rounded-[var(--radius-lg)] border-border-subtle bg-surface-1 hover:bg-surface-elevated">
                <Link href="/anime">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back to Anime
                </Link>
              </Button>
            </nav>

            <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-end">
              <div className="relative mx-auto aspect-[2/3] w-44 overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-surface-2 hard-shadow-md md:mx-0 md:w-52">
                <Image
                  src={data.thumb}
                  alt={data.title}
                  fill
                  className="object-cover"
                  sizes="208px"
                  unoptimized
                />
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="anime">Batch Download</Badge>
                  <Badge variant="outline">{data.download_list.length} Sections</Badge>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">{data.title}</h1>
                  <p className="max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                    Pick your preferred quality and server below to download the whole run in one go.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="anime" size="lg" asChild>
                    <Link href="#downloads">
                      Browse Packs
                      <Download className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      }
      sidebar={
        <>
          <DetailActionCard
            theme="anime"
            title="Ready to download"
            description="This flow is utility-first. Pick a pack below or jump back to the anime hub if you want to keep browsing."
            actions={[
              { href: '#downloads', label: 'Open Download Packs', icon: Download },
              { href: '/anime', label: 'Back to Anime Hub', icon: Info, variant: 'outline' },
            ]}
          />

          <Paper tone="muted" shadow="sm" className="space-y-4 p-5 md:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">At A Glance</p>
            <div className="grid gap-2.5">
              <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-3.5 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Sections</p>
                <p className="mt-1.5 text-sm font-bold text-white">{data.download_list.length}</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-2 px-3.5 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Flow</p>
                <p className="mt-1.5 text-sm font-bold text-white">Batch Download</p>
              </div>
            </div>
          </Paper>
        </>
      }
    >
      <section id="downloads" className="space-y-8">
        <DetailSectionHeading title="Download Packs" theme="anime" />

        {data.download_list.map((section: KanataAnimeBatch['download_list'][number], sectionIdx: number) => (
          <Paper key={sectionIdx} tone="muted" shadow="sm" className="space-y-6 p-5 md:p-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-black tracking-tight text-white">{section.title}</h2>
              <div className="h-px flex-1 bg-border-subtle" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {section.links.map((item: { quality: string; size: string; links: { url: string; name: string }[] }, itemIdx: number) => (
                <Paper key={itemIdx} tone="muted" shadow="sm" className="group p-5 transition-colors hover:border-blue-500/30">
                  <div className="mb-6 flex items-center justify-between">
                    <Badge variant="anime" className="rounded-xl px-4 py-1.5">{item.quality}</Badge>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      <HardDrive className="h-3.5 w-3.5" /> {item.size}
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
          </Paper>
        ))}
      </section>
    </DownloadMediaPage>
  );
}
