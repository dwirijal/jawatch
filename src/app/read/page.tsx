import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { JsonLd } from '@/components/atoms/JsonLd';
import { Link } from '@/components/atoms/Link';
import { HubLaneCard } from '@/components/molecules/HubLaneCard';
import { MediaHubHeader } from '@/components/organisms/MediaHubHeader';
import { buildCollectionPageJsonLd, buildMetadata } from '@/lib/seo';

const READ_LINKS = [
  {
    href: '/read/comics',
    label: 'Comics',
    description: 'Manga, manhwa, and manhua on the reading shelf.',
  },
] as const;

export const metadata: Metadata = buildMetadata({
  title: 'Read Subtitle Indonesia',
  description: 'Browse manga, manhwa, and manhua from the reading hub.',
  path: '/read',
  keywords: ['read subtitle indonesia', 'comics subtitle indonesia', 'manga manhwa manhua'],
});

export default function ReadPage() {
  return (
    <main className="app-shell" data-theme="manga">
      <JsonLd
        data={buildCollectionPageJsonLd({
          title: 'Read Subtitle Indonesia',
          description: 'Reading hub for manga, manhwa, and manhua.',
          path: '/read',
          items: READ_LINKS.map((item) => ({
            name: item.label,
            url: item.href,
          })),
        })}
      />

      <MediaHubHeader
        title="Read"
        description="Jump into manga, manhwa, and manhua from the unified reading surface."
        iconName="book-open"
        theme="manga"
        eyebrow="Reading Hub"
        footer={(
          <div className="flex flex-wrap gap-2">
            {READ_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-tv rounded-full border border-border-subtle bg-surface-1 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      />

      <div className="app-container-wide py-6 sm:py-7 md:py-8">
        <div className="grid gap-4">
          <HubLaneCard
            href="/read/comics"
            title="Comics"
            eyebrow="Graphic shelf"
            description="Open manga, manhwa, and manhua with faster continuation, clearer subtype browsing, and a calmer reading-first surface."
            theme="manga"
            icon={BookOpen}
            highlights={['Manga', 'Manhwa', 'Manhua']}
          />
        </div>
      </div>
    </main>
  );
}
