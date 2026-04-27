import type { Metadata } from 'next';
import { BookOpen, Clock3, Flame } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { CategoryCard } from '@/components/molecules/CategoryCard';
import { SegmentedNav } from '@/components/molecules/SegmentedNav';
import { MediaPageHeader } from '@/components/organisms/MediaPageHeader';
import { READ_PRIMARY_SEGMENTS } from '@/lib/media-hub-segments';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Baca Komik Bahasa Indonesia',
  description: 'Jelajahi manga, manhwa, dan manhua bahasa Indonesia dari satu halaman baca yang cepat.',
  path: '/read',
  keywords: ['read subtitle indonesia', 'comics subtitle indonesia', 'manga manhwa manhua'],
});

export default function ReadPage() {
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
        title="Baca"
        description="Pilih manga, manhwa, dan manhua dari satu katalog baca yang rapi."
        iconName="book-open"
        theme="manga"
        eyebrow="Rak baca"
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
      >
        <Button variant="manga" size="sm" asChild className="rounded-full px-4 font-black">
          <Link href="/read/comics">Komik</Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="rounded-full px-4 font-black">
          <Link href="/read/comics#latest">Terbaru</Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="rounded-full px-4 font-black">
          <Link href="/read/comics#popular">Populer</Link>
        </Button>
      </MediaPageHeader>

      <div className="mx-auto w-full max-w-6xl py-6 sm:py-7 md:py-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <CategoryCard
            href="/read/comics"
            title="Komik"
            eyebrow="Rak komik"
            description="Buka manga, manhwa, dan manhua dengan kelanjutan chapter yang mudah ditemukan."
            theme="manga"
            icon={BookOpen}
            highlights={['Manga', 'Manhwa', 'Manhua']}
          />
          <CategoryCard
            href="/read/comics#latest"
            title="Terbaru"
            eyebrow="Chapter baru"
            description="Masuk ke update chapter terbaru tanpa harus menelusuri seluruh rak."
            theme="manga"
            icon={Clock3}
            highlights={['Update', 'Baru', 'Cepat']}
          />
          <CategoryCard
            href="/read/comics#popular"
            title="Populer"
            eyebrow="Paling dibuka"
            description="Lihat judul yang paling ramai dibaca sekarang untuk discovery yang lebih cepat."
            theme="manga"
            icon={Flame}
            highlights={['Ramai', 'Populer', 'Aktif']}
          />
        </div>
      </div>
    </main>
  );
}
