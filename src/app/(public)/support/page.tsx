import type { Metadata } from 'next';
import { HeartHandshake, Server, Sparkles, Zap } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { buildSupportCta } from '@/lib/marketing';
import { absoluteUrl, buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Dukung jawatch via Trakteer',
  description:
    'Bantu jawatch tetap cepat, rapi, dan aktif lewat dukungan sukarela via Trakteer untuk biaya server, indexing, dan maintenance katalog.',
  path: '/support',
  keywords: ['dukung jawatch', 'trakteer jawatch', 'support jawatch', 'donasi jawatch'],
});

const SUPPORT_POINTS = [
  {
    title: 'Server tetap ringan',
    description: 'Dukungan membantu menutup biaya hosting, cache, dan bandwidth untuk sesi nonton dan baca yang panjang.',
    icon: Server,
  },
  {
    title: 'Katalog tetap rapi',
    description: 'Indexing, metadata, poster, chapter, episode, dan canonical route butuh maintenance rutin.',
    icon: Sparkles,
  },
  {
    title: 'Fitur growth aman',
    description: 'Ads, share preview, dan support surface dijaga tetap sekunder supaya tidak mengganggu pengalaman utama.',
    icon: Zap,
  },
] as const;

export default function SupportPage() {
  const supportCta = buildSupportCta();

  return (
    <main className="app-shell" data-theme="movie">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'DonateAction',
          name: supportCta.label,
          description: supportCta.description,
          target: supportCta.href,
          recipient: {
            '@type': 'Organization',
            name: 'jawatch',
            url: absoluteUrl('/'),
          },
        }}
      />

      <div className="app-container-wide py-8 md:py-12">
        <section className="surface-panel-elevated relative overflow-hidden p-6 md:p-10">
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(209,168,111,0.18),transparent_64%)]" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.75fr)] lg:items-center">
            <div className="max-w-3xl space-y-6">
              <Badge variant="solid" className="text-[10px]">
                Support jawatch
              </Badge>
              <div className="space-y-4">
                <h1 className="font-[var(--font-heading)] text-[clamp(2.5rem,8vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.07em] text-foreground">
                  Bantu jawatch tetap cepat dan rapi.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                  Kalau jawatch membantu kamu menemukan tontonan atau bacaan berikutnya, dukungan kecil via Trakteer
                  membantu biaya server, indexing, dan maintenance katalog.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="primary" size="lg" asChild className="w-full sm:w-auto">
                  <Link href={supportCta.href}>{supportCta.label}</Link>
                </Button>
                <Button variant="secondary" size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/">Kembali ke katalog</Link>
                </Button>
              </div>
            </div>

            <Paper tone="muted" shadow="sm" className="p-5 md:p-6">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border-subtle bg-accent-soft">
                  <HeartHandshake className="h-6 w-6 text-[var(--accent)]" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">Dukungan sukarela</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Tidak ada konten yang dikunci di halaman ini. Trakteer hanya jalur support buat pengguna yang ingin
                    ikut bantu operasional jawatch.
                  </p>
                </div>
              </div>
            </Paper>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {SUPPORT_POINTS.map((item) => (
            <Paper key={item.title} tone="muted" shadow="sm" className="p-5">
              <item.icon className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="mt-4 text-base font-bold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
            </Paper>
          ))}
        </section>
      </div>
    </main>
  );
}
