'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Clapperboard,
  Film,
  Flame,
  Heart,
  Play,
  Sparkles,
  Tag,
  Trophy,
  Tv,
  Zap,
  BookOpen,
  BookMarked,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Card } from '@/components/atoms/Card';
import { Link } from '@/components/atoms/Link';
import { AdSection } from '@/components/organisms/AdSection';
import { SectionCard } from '@/components/organisms/SectionCard';
import { type ThemeType } from '@/lib/utils';
import type { CardRailVariant } from '@/components/molecules/card/CardRail';

type HeroItem = {
  id: string;
  title: string;
  image: string;
  banner: string;
  description: string;
  type: 'anime' | 'movie' | 'manga' | 'donghua';
  tags: string[];
  rating: string;
};

type MixedRecommendationItem = {
  id: string;
  title: string;
  image: string;
  href: string;
  theme: 'anime' | 'movie' | 'manga' | 'donghua';
  subtitle?: string;
  badgeText?: string;
};

type HomeRecommendationSection = {
  id: string;
  title: string;
  subtitle: string;
  iconKey: string;
  items: MixedRecommendationItem[];
  viewAllHref?: string;
};

type HomePageClientProps = {
  heroItems: HeroItem[];
  sections: HomeRecommendationSection[];
};

type SectionLayoutMode = 'rail' | 'grid';
type CardGridDensity = 'dense' | 'default' | 'comfortable';
type SectionLayoutConfig = {
  mode: SectionLayoutMode;
  railVariant: CardRailVariant;
  gridDensity: CardGridDensity;
};

const HERO_TITLE_CLAMP_STYLE: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const HERO_DESC_CLAMP_STYLE: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const ICON_MAP: Record<string, LucideIcon> = {
  featured: Sparkles,
  fresh: Flame,
  anime: Play,
  movie: Film,
  series: Tv,
  manga: BookOpen,
  reading: BookMarked,
  manhwa: BookOpen,
  manhua: BookOpen,
  donghua: Zap,
  blockbuster: Clapperboard,
  community: Heart,
  mal: Trophy,
  popular: Sparkles,
  genre: Tag,
  imdb: Star,
};

const HOME_SECTION_MAX_ITEMS = 12;
const HOME_SECTION_MIN_ITEMS = 4;

const HOMEPAGE_SECTION_LAYOUTS: Partial<Record<string, SectionLayoutConfig>> = {
  'fresh-week': { mode: 'rail', railVariant: 'default', gridDensity: 'dense' },
  'blockbuster': { mode: 'rail', railVariant: 'default', gridDensity: 'dense' },
  'popular-media': { mode: 'rail', railVariant: 'default', gridDensity: 'dense' },
  'community-lovers': { mode: 'rail', railVariant: 'default', gridDensity: 'dense' },
};

function getGridColumnsByViewport(viewportWidth: number): number {
  if (viewportWidth >= 1200) return 8;
  if (viewportWidth >= 500) return 4;
  return 2;
}

function getThemeLabel(theme: MixedRecommendationItem['theme'] | HeroItem['type']) {
  switch (theme) {
    case 'anime':
      return 'Anime';
    case 'movie':
      return 'Movie';
    case 'manga':
      return 'Manga';
    case 'donghua':
      return 'Donghua';
    default:
      return 'Media';
  }
}

function getThemeFromIconKey(iconKey: string): ThemeType {
  switch (iconKey) {
    case 'anime':
    case 'mal':
      return 'anime';
    case 'movie':
    case 'series':
    case 'blockbuster':
    case 'imdb':
      return 'movie';
    case 'manga':
    case 'reading':
    case 'manhwa':
    case 'manhua':
      return 'manga';
    case 'donghua':
      return 'donghua';
    default:
      return 'default';
  }
}

function getSectionLayoutConfig(section: HomeRecommendationSection): SectionLayoutConfig {
  const explicit = HOMEPAGE_SECTION_LAYOUTS[section.id];
  if (explicit) {
    return explicit;
  }

  if (section.iconKey === 'fresh' || section.iconKey === 'blockbuster' || section.iconKey === 'popular' || section.iconKey === 'community') {
    return {
      mode: 'rail',
      railVariant: 'default',
      gridDensity: 'dense',
    };
  }

  return {
    mode: 'grid',
    railVariant: 'default',
    gridDensity: 'dense',
  };
}

function normalizeHomeSections(sections: HomeRecommendationSection[], gridColumns: number): HomeRecommendationSection[] {
  return sections
    .map((section) => {
      const layoutMode = getSectionLayoutConfig(section).mode;
      const cappedItems = section.items.slice(0, HOME_SECTION_MAX_ITEMS);

      if (layoutMode === 'rail') {
        return {
          ...section,
          items: cappedItems,
        };
      }

      if (cappedItems.length <= gridColumns) {
        return {
          ...section,
          items: cappedItems,
        };
      }

      const fullRowsItemCount = Math.floor(cappedItems.length / gridColumns) * gridColumns;
      return {
        ...section,
        items: cappedItems.slice(0, fullRowsItemCount),
      };
    })
    .filter((section) => section.items.length >= HOME_SECTION_MIN_ITEMS);
}

function toDetailHref(item: HeroItem) {
  return item.type === 'movie' ? `/movies/${item.id}` : `/${item.type}/${item.id}`;
}

function HeroStage({
  item,
  secondaryItems,
}: {
  item: HeroItem;
  secondaryItems: HeroItem[];
}) {
  return (
    <section className="surface-panel-elevated relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={item.banner || item.image || '/favicon.ico'}
          alt={item.title}
          fill
          sizes="100vw"
          className="object-cover opacity-35"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/72 to-black/42" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/28 to-transparent" />
        <div className="absolute -left-[10%] top-[-12%] h-[60%] w-[72%] bg-[radial-gradient(circle_at_18%_36%,rgba(59,130,246,0.18),transparent_62%)] blur-3xl" />
      </div>

      <div className="relative z-10 px-4 py-5 sm:px-5 sm:py-6 lg:px-6 lg:py-8">
        <div className="grid min-h-[56vh] grid-cols-1 items-end gap-4 lg:min-h-[58vh] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)] lg:gap-6">
          <div className="max-w-[44rem] space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-200">
              <Badge variant="solid" className="text-[10px]">Featured</Badge>
              <Badge variant={item.type} className="text-[10px]">{getThemeLabel(item.type)}</Badge>
              <Badge variant="outline" className="text-[10px]">★ {item.rating || 'N/A'}</Badge>
              {item.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
              ))}
            </div>

            <h1 className="type-display text-white" style={HERO_TITLE_CLAMP_STYLE}>
              {item.title}
            </h1>

            <p className="max-w-[36rem] text-sm leading-6 text-zinc-200/88 sm:text-base sm:leading-7" style={HERO_DESC_CLAMP_STYLE}>
              {item.description}
            </p>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button variant={item.type} size="lg" asChild className="w-full sm:w-auto">
                <Link href={toDetailHref(item)}>Start Watching</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <Link href={toDetailHref(item)}>View Detail</Link>
              </Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="grid gap-2">
              {secondaryItems.map((secondary) => (
                <Link
                  key={secondary.id}
                  href={toDetailHref(secondary)}
                  className="surface-panel group flex items-center gap-3 p-2 transition-colors hover:bg-surface-elevated"
                >
                  <div className="relative h-[4.5rem] w-[3.5rem] shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-surface-2">
                    <Image
                      src={secondary.image || secondary.banner || '/favicon.ico'}
                      alt={secondary.title}
                      fill
                      sizes="112px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant={secondary.type} className="text-[10px]">{getThemeLabel(secondary.type)}</Badge>
                      <span className="text-[10px] font-semibold text-zinc-400">★ {secondary.rating || 'N/A'}</span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-black tracking-tight text-white group-hover:text-zinc-100">
                      {secondary.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RecommendationSection({
  section,
  layoutConfig,
}: {
  section: HomeRecommendationSection;
  layoutConfig: SectionLayoutConfig;
}) {
  if (!section.items?.length) return null;
  const Icon = ICON_MAP[section.iconKey] || Sparkles;
  const sectionTheme = getThemeFromIconKey(section.iconKey);

  return (
    <SectionCard
      title={section.title}
      subtitle={section.subtitle}
      icon={Icon}
      viewAllHref={section.viewAllHref}
      mode={layoutConfig.mode}
      gridDensity={layoutConfig.gridDensity}
      railVariant={layoutConfig.railVariant}
    >
      {section.items.map((item) => (
        <Card
          key={item.id}
          href={item.href}
          image={item.image}
          title={item.title}
          subtitle={item.subtitle}
          badgeText={item.badgeText}
          theme={item.theme || sectionTheme}
        />
      ))}
    </SectionCard>
  );
}

function SectionGrid({ sections }: { sections: HomeRecommendationSection[] }) {
  return (
    <div className="flex flex-col gap-7 sm:gap-8 lg:gap-10">
      {sections.map((section) => (
        <RecommendationSection
          key={section.id}
          section={section}
          layoutConfig={getSectionLayoutConfig(section)}
        />
      ))}
    </div>
  );
}

export function HomePageView({ heroItems, sections }: HomePageClientProps) {
  const featuredHero = heroItems[0];
  const secondaryHeroes = heroItems.slice(1, 4);
  const [gridColumns, setGridColumns] = React.useState(2);

  React.useEffect(() => {
    const updateGridColumns = () => {
      setGridColumns(getGridColumnsByViewport(window.innerWidth));
    };

    updateGridColumns();
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);

  const normalizedSections = React.useMemo(
    () => normalizeHomeSections(sections, gridColumns),
    [sections, gridColumns]
  );

  return (
    <main className="app-shell relative overflow-hidden" data-view-mode="compact">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-[-8rem] h-[24rem] w-[24rem] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-[-10rem] top-[18rem] h-[20rem] w-[20rem] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[12%] h-[16rem] w-[16rem] rounded-full bg-red-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 app-container-wide flex flex-col gap-6 py-3 sm:gap-8 sm:py-5 lg:gap-10">
        {featuredHero ? (
          <HeroStage item={featuredHero} secondaryItems={secondaryHeroes} />
        ) : (
          <section className="surface-panel h-[44vh] animate-pulse" />
        )}
        <AdSection
          title="Partner Spotlight"
          subtitle="Featured campaigns and partner placements that keep the same compact editorial rhythm as the rest of the homepage."
        />
        <SectionGrid sections={normalizedSections} />
      </div>
    </main>
  );
}
