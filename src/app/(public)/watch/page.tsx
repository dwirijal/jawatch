import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight, CalendarDays, Clapperboard, Clock3, Film, Play, Tv, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { SegmentedNav } from '@/components/molecules/SegmentedNav';
import { MediaPageHeader } from '@/components/organisms/MediaPageHeader';
import { WATCH_PRIMARY_SEGMENTS } from '@/lib/media-hub-segments';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';
import { SHORTS_HUB_ENABLED } from '@/lib/shorts-paths';
import { cn, THEME_CONFIG, type ThemeType } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'Nonton Subtitle Indonesia',
  description: SHORTS_HUB_ENABLED
    ? 'Jelajahi film, series, anime, donghua, drama Asia, dan shorts subtitle Indonesia dari satu halaman watch.'
    : 'Jelajahi film, series, anime, donghua, dan drama Asia subtitle Indonesia dari satu halaman watch.',
  path: '/watch',
  keywords: SHORTS_HUB_ENABLED
    ? ['watch subtitle indonesia', 'movies subtitle indonesia', 'series subtitle indonesia', 'shorts subtitle indonesia']
    : ['watch subtitle indonesia', 'movies subtitle indonesia', 'series subtitle indonesia'],
});

type WatchCategory = {
  href: string;
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  theme: Extract<ThemeType, 'movie' | 'drama'>;
  icon: LucideIcon;
  stats: readonly string[];
  cta: string;
};

const WATCH_CATEGORIES: readonly WatchCategory[] = [
  {
    href: '/watch/series',
    title: 'Series',
    eyebrow: 'Episode berjalan',
    description: 'Anime, donghua, dan drama Asia dalam satu halaman browse yang cepat untuk lanjut episode.',
    image: '/Series.png',
    theme: 'drama',
    icon: Tv,
    stats: ['Anime', 'Donghua', 'Drama'],
    cta: 'Buka series',
  },
  {
    href: '/watch/movies',
    title: 'Film',
    eyebrow: 'Film pilihan',
    description: 'Film populer, baru update, dan siap ditonton dari katalog yang lebih ringkas.',
    image: '/Movie.png',
    theme: 'movie',
    icon: Film,
    stats: ['Populer', 'Terbaru', 'Rating'],
    cta: 'Buka film',
  },
];

const QUICK_LINKS = [
  {
    href: '/watch/series#latest',
    label: 'Update episode',
    description: 'Masuk ke daftar episode terbaru.',
    icon: Clock3,
  },
  {
    href: '/watch/series?type=anime',
    label: 'Anime',
    description: 'Filter series ke anime saja.',
    icon: Clapperboard,
  },
  {
    href: '/watch/movies',
    label: 'Film populer',
    description: 'Lihat film yang ramai ditonton.',
    icon: Play,
  },
  {
    href: '/watch/series?type=drama',
    label: 'Drama Asia',
    description: 'Browse drama dalam rak series.',
    icon: CalendarDays,
  },
] as const;

function WatchCategoryCard({ category, priority = false }: { category: WatchCategory; priority?: boolean }) {
  const Icon = category.icon;
  const config = THEME_CONFIG[category.theme] ?? THEME_CONFIG.default;

  return (
    <Link
      href={category.href}
      className="focus-tv group relative min-h-[22rem] overflow-hidden rounded-[var(--radius-2xl)] border border-border-subtle bg-surface-1 hard-shadow-md transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_34px_90px_-58px_var(--shadow-color-strong)]"
    >
      <Image
        src={category.image}
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover opacity-[0.72] transition-transform duration-700 group-hover:scale-[1.035]"
        priority={priority}
        unoptimized
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,11,0.34)_0%,rgba(7,8,11,0.72)_42%,rgba(7,8,11,0.96)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_54%)]" />

      <div className="relative z-10 flex h-full min-h-[22rem] flex-col justify-end p-[var(--space-md)] md:p-6">
        <div className="mb-auto flex items-start justify-between gap-[var(--space-md)]">
          <span className="type-kicker rounded-full border border-white/14 bg-black/24 px-[var(--space-sm)] py-[var(--space-2xs)] text-foreground backdrop-blur-md">
            {category.eyebrow}
          </span>
          <span className={cn('inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] border border-white/14 shadow-[0_18px_44px_-34px_var(--shadow-color)]', config.primary)}>
            <Icon className={cn('h-5 w-5', config.contrast)} />
          </span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-[var(--font-heading)] text-[clamp(2rem,4vw,3.45rem)] font-bold leading-[0.94] tracking-[var(--type-tracking-normal)] text-[var(--accent-contrast)]">
              {category.title}
            </h2>
            <p className="max-w-xl text-sm leading-6 text-white/84 md:text-base md:leading-7">
              {category.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-[var(--space-xs)]">
            {category.stats.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/12 bg-surface-1/28 px-[var(--space-sm)] py-[var(--space-2xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-foreground backdrop-blur-md"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-sm font-black text-[var(--accent-contrast)]">{category.cta}</span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-surface-1/38 text-foreground transition-transform duration-200 group-hover:translate-x-1">
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function WatchPage() {
  return (
    <main className="app-shell" data-theme="movie">
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'Nonton Subtitle Indonesia',
          description: SHORTS_HUB_ENABLED
            ? 'Halaman watch untuk film, series, anime, donghua, drama Asia, dan shorts subtitle Indonesia.'
            : 'Halaman watch untuk film, series, anime, donghua, dan drama Asia subtitle Indonesia.',
          path: '/watch',
          items: WATCH_PRIMARY_SEGMENTS.map((item) => ({
            name: item.label,
            url: item.href,
          })),
        })}
      />

      <MediaPageHeader
        title="Nonton subtitle Indonesia"
        description={
          SHORTS_HUB_ENABLED
            ? 'Pilih film, series, atau shorts dari satu pintu. Masuk lewat kategori yang paling dekat dengan sesi nontonmu sekarang.'
            : 'Pilih film atau series dari satu pintu. Masuk lewat kategori yang paling dekat dengan sesi nontonmu sekarang.'
        }
        iconName="clapperboard"
        theme="movie"
        eyebrow="Rak tontonan"
        layoutVariant="editorial"
        containerClassName="app-container-wide"
        featuredItem={{
          label: 'Watch',
          meta: 'Film • Anime • Donghua • Drama',
          image: '/bg-placeholder.jpg',
          imageAlt: 'Kolase visual film dan tontonan jawatch',
          badges: SHORTS_HUB_ENABLED ? ['Film', 'Series', 'Shorts'] : ['Film', 'Series', 'Update episode'],
          actions: (
            <>
              <Button variant="movie" size="sm" asChild className="rounded-full px-4 font-black">
                <Link href="/watch/movies">
                  Film
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="drama" size="sm" asChild className="rounded-full px-4 font-black">
                <Link href="/watch/series">
                  Series
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          ),
        }}
        featuredPriority
        footer={(
          <SegmentedNav
            ariaLabel="Watch segments"
            items={WATCH_PRIMARY_SEGMENTS.map((item) => ({
              href: item.href,
              label: item.label,
              title: item.description,
            }))}
          />
        )}
      />

      <div className="app-container-wide py-6 sm:py-7 md:py-9">
        <section className="grid gap-4 lg:grid-cols-2">
          {WATCH_CATEGORIES.map((category, index) => (
            <WatchCategoryCard key={category.href} category={category} priority={index === 0} />
          ))}
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="focus-tv group flex min-h-32 items-start gap-[var(--space-sm)] rounded-[var(--radius-xl)] border border-border-subtle bg-surface-1 p-[var(--space-md)] transition-[background,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-elevated"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-border-subtle bg-accent-soft text-[var(--accent-contrast)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="block text-sm font-black text-foreground">{item.label}</span>
                  <span className="block text-sm leading-6 text-muted-foreground">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </section>

        <section className="mt-6 overflow-hidden rounded-[var(--radius-2xl)] border border-border-subtle bg-[linear-gradient(135deg,var(--surface-1)_0%,var(--surface-2)_100%)] p-[var(--space-md)] md:p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="space-y-2">
              <p className="type-kicker">Cari langsung</p>
              <h2 className="type-section-title text-foreground">Temukan judul yang sudah kamu incar.</h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
                Film, anime, donghua, dan drama tersedia dari pencarian katalog yang sama.
              </p>
            </div>
            <Button variant="outline" size="lg" asChild className="rounded-full">
              <Link href="/search?type=all">
                Cari judul
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
