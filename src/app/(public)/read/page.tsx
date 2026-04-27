import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight, BookOpen, Clock3, Flame, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { MediaCard } from '@/components/atoms/Card';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { SegmentedNav } from '@/components/molecules/SegmentedNav';
import { MediaPageHeader } from '@/components/organisms/MediaPageHeader';
import { loadComicPageData } from '@/features/comics/loadComicPageData';
import { extractSlugFromUrl } from '@/lib/adapters/comic-server';
import { formatComicCardSubtitle, getComicCardBadgeText } from '@/lib/card-presentation';
import { READ_PRIMARY_SEGMENTS } from '@/lib/media-hub-segments';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';
import { cn, THEME_CONFIG } from '@/lib/utils';
import type { MangaSearchResult } from '@/lib/types';

export const metadata: Metadata = buildMetadata({
  title: 'Baca Komik Bahasa Indonesia',
  description: 'Jelajahi manga, manhwa, dan manhua bahasa Indonesia dari satu halaman baca yang cepat.',
  path: '/read',
  keywords: ['read subtitle indonesia', 'comics subtitle indonesia', 'manga manhwa manhua'],
});

type ReadCategory = {
  href: string;
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  icon: LucideIcon;
  stats: readonly string[];
};

const READ_CATEGORIES: readonly ReadCategory[] = [
  {
    href: '/read/comics',
    title: 'Komik',
    eyebrow: 'Rak komik',
    description: 'Manga, manhwa, dan manhua dalam satu katalog baca dengan chapter yang mudah dilanjutkan.',
    image: '/Manga.png',
    icon: BookOpen,
    stats: ['Manga', 'Manhwa', 'Manhua'],
  },
  {
    href: '/read/comics#latest',
    title: 'Chapter baru',
    eyebrow: 'Update cepat',
    description: 'Masuk ke daftar update terbaru saat kamu ingin langsung lanjut baca.',
    image: '/New%20Release.png',
    icon: Clock3,
    stats: ['Terbaru', 'Update', 'Lanjut'],
  },
  {
    href: '/read/comics#popular',
    title: 'Populer',
    eyebrow: 'Paling dibuka',
    description: 'Lihat judul yang sedang ramai dibaca untuk menemukan bacaan berikutnya.',
    image: '/Popular.png',
    icon: Flame,
    stats: ['Ramai', 'Aktif', 'Pilihan'],
  },
];

async function loadReadSuggestions(): Promise<MangaSearchResult[]> {
  const { popular, newest } = await loadComicPageData('all', { includeNsfw: false })
    .catch(() => ({ popular: [], newest: [], subtypePosters: {} }));
  const seen = new Set<string>();

  return [...newest.slice(0, 6), ...popular.slice(0, 6)]
    .filter((item) => {
      const slug = extractSlugFromUrl(item.link) || item.slug;
      if (!slug || seen.has(slug)) {
        return false;
      }
      seen.add(slug);
      return true;
    })
    .slice(0, 8);
}

function ReadCategoryCard({ category, priority = false }: { category: ReadCategory; priority?: boolean }) {
  const Icon = category.icon;
  const config = THEME_CONFIG.manga ?? THEME_CONFIG.default;

  return (
    <Link
      href={category.href}
      className="focus-tv group relative min-h-[20rem] overflow-hidden rounded-[var(--radius-2xl)] border border-border-subtle bg-surface-1 hard-shadow-md transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[0_34px_90px_-58px_var(--shadow-color-strong)]"
    >
      <Image
        src={category.image}
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 33vw"
        className="object-cover opacity-[0.76] transition-transform duration-700 group-hover:scale-[1.035]"
        priority={priority}
        unoptimized
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,8,11,0.32)_0%,rgba(7,8,11,0.68)_44%,rgba(7,8,11,0.96)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--accent-soft),transparent_54%)]" />

      <div className="relative z-10 flex h-full min-h-[20rem] flex-col justify-end p-[var(--space-md)] md:p-6">
        <div className="mb-auto flex items-start justify-between gap-[var(--space-md)]">
          <span className="type-kicker rounded-full border border-white/14 bg-black/24 px-[var(--space-sm)] py-[var(--space-2xs)] text-white backdrop-blur-md">
            {category.eyebrow}
          </span>
          <span className={cn('inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] border border-white/14 shadow-[0_18px_44px_-34px_var(--shadow-color)]', config.primary)}>
            <Icon className={cn('h-5 w-5', config.contrast)} />
          </span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="font-[var(--font-heading)] text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[0.94] tracking-[var(--type-tracking-normal)] text-white">
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
                className="rounded-full border border-white/12 bg-black/24 px-[var(--space-sm)] py-[var(--space-2xs)] text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-white backdrop-blur-md"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-sm font-black text-white">Buka rak</span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/24 text-white transition-transform duration-200 group-hover:translate-x-1">
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function ReadPage() {
  const suggestions = await loadReadSuggestions();

  return (
    <main className="app-shell" data-theme="manga">
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'Baca Komik Bahasa Indonesia',
          description: 'Halaman baca untuk manga, manhwa, dan manhua bahasa Indonesia.',
          path: '/read',
          items: READ_PRIMARY_SEGMENTS.map((item) => ({
            name: item.label,
            url: item.href,
          })),
        })}
      />

      <MediaPageHeader
        title="Baca komik bahasa Indonesia"
        description="Pilih manga, manhwa, atau manhua dari rak baca yang cepat untuk discovery dan lanjut chapter."
        iconName="book-open"
        theme="manga"
        eyebrow="Rak baca"
        layoutVariant="editorial"
        containerClassName="app-container-wide"
        featuredItem={{
          label: 'Read',
          meta: 'Manga • Manhwa • Manhua',
          image: '/Manga.png',
          imageAlt: 'Kolase visual komik jawatch',
          badges: ['Komik', 'Chapter baru', 'Populer'],
          actions: (
            <>
              <Button variant="manga" size="sm" asChild className="rounded-full px-4 font-black">
                <Link href="/read/comics">
                  Komik
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="rounded-full px-4 font-black">
                <Link href="/read/comics#latest">
                  Terbaru
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          ),
        }}
        featuredPriority
        footer={(
          <SegmentedNav
            ariaLabel="Read segments"
            items={READ_PRIMARY_SEGMENTS.map((item) => ({
              href: item.href,
              label: item.label,
              title: item.description,
            }))}
          />
        )}
      />

      <div className="app-container-wide py-6 sm:py-7 md:py-9">
        <section className="grid gap-4 lg:grid-cols-3">
          {READ_CATEGORIES.map((category, index) => (
            <ReadCategoryCard key={category.href} category={category} priority={index === 0} />
          ))}
        </section>

        {suggestions.length > 0 ? (
          <section className="mt-8 space-y-4 md:mt-10">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="type-kicker">Saran bacaan</p>
                <h2 className="type-section-title text-foreground">Pilih komik dan lanjut baca.</h2>
              </div>
              <Button variant="link" asChild>
                <Link href="/read/comics">Lihat katalog</Link>
              </Button>
            </div>
            <div className="media-grid" data-grid-density="default">
              {suggestions.map((item) => {
                const slug = extractSlugFromUrl(item.link) || item.slug;
                return (
                  <MediaCard
                    key={slug}
                    href={`/comics/${slug}`}
                    image={item.image || item.thumbnail}
                    title={item.title}
                    subtitle={formatComicCardSubtitle(item)}
                    badgeText={getComicCardBadgeText(item)}
                    theme="manga"
                  />
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-[var(--radius-2xl)] border border-border-subtle bg-[linear-gradient(135deg,var(--surface-1)_0%,var(--surface-2)_100%)] p-[var(--space-md)] md:p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="space-y-2">
              <p className="type-kicker">Cari langsung</p>
              <h2 className="type-section-title text-foreground">Temukan judul atau chapter yang kamu cari.</h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
                Pencarian katalog menyatukan watch dan read, jadi judul komik tetap mudah ditemukan dari satu tempat.
              </p>
            </div>
            <Button variant="outline" size="lg" asChild className="rounded-full">
              <Link href="/search?type=comic">
                Cari komik
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
