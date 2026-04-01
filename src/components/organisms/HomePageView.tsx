import type { CSSProperties } from 'react';
import Image from 'next/image';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { MediaCard } from '@/components/atoms/Card';
import { Link } from '@/components/atoms/Link';
import { AdSection } from '@/components/organisms/AdSection';
import { SectionCard } from '@/components/organisms/SectionCard';
import { type ThemeType } from '@/lib/utils';
import type { CardRailVariant } from '@/components/molecules/card/CardRail';
import type { HeroItem, HomeRecommendationSection, MixedRecommendationItem } from '@/app/home-page-types';

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

const HERO_TITLE_CLAMP_STYLE: CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const HERO_DESC_CLAMP_STYLE: CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const HOME_SECTION_MAX_ITEMS = 12;
const HOME_SECTION_MIN_ITEMS = 4;

const HOMEPAGE_SECTION_LAYOUTS: Partial<Record<string, SectionLayoutConfig>> = {
  'fresh-week': { mode: 'rail', railVariant: 'default', gridDensity: 'dense' },
  'blockbuster': { mode: 'rail', railVariant: 'default', gridDensity: 'dense' },
  'popular-media': { mode: 'rail', railVariant: 'default', gridDensity: 'dense' },
  'community-lovers': { mode: 'rail', railVariant: 'default', gridDensity: 'dense' },
};

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
    case 'series':
    case 'drama':
      return 'Series';
    case 'novel':
      return 'Novel';
    default:
      return 'Media';
  }
}

function getSectionIconName(iconKey: HomeRecommendationSection['iconKey']) {
  switch (iconKey) {
    case 'fresh':
      return 'Flame';
    case 'anime':
      return 'Sparkles';
    case 'movie':
    case 'blockbuster':
    case 'imdb':
      return 'Film';
    case 'series':
      return 'Tv';
    case 'manga':
    case 'manhwa':
    case 'manhua':
    case 'reading':
      return 'BookOpen';
    case 'donghua':
      return 'Zap';
    case 'genre':
      return 'Tag';
    case 'popular':
    case 'mal':
    case 'community':
    default:
      return 'Sparkles';
  }
}

function getThemeFromIconKey(iconKey: string): ThemeType {
  switch (iconKey) {
    case 'anime':
    case 'mal':
      return 'anime';
    case 'movie':
    case 'blockbuster':
    case 'imdb':
      return 'movie';
    case 'series':
      return 'drama';
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

function normalizeHomeSections(sections: HomeRecommendationSection[]): HomeRecommendationSection[] {
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
      return {
        ...section,
        items: cappedItems,
      };
    })
    .filter((section) => section.items.length >= HOME_SECTION_MIN_ITEMS);
}

function toDetailHref(item: HeroItem) {
  if (item.type === 'movie') {
    return `/movies/${item.id}`;
  }

  if (item.type === 'series') {
    return `/series/${item.id}`;
  }

  return `/${item.type}/${item.id}`;
}

function HeroStage({
  item,
  secondaryItems,
}: {
  item: HeroItem;
  secondaryItems: HeroItem[];
}) {
  const itemVariant = item.type === 'series' ? 'drama' : item.type;
  const heroImage = item.image || item.banner || '/favicon.ico';

  return (
    <section className="surface-panel-elevated relative overflow-hidden bg-[linear-gradient(145deg,rgba(13,15,20,0.98),rgba(10,10,12,0.94))]">
      <div className="absolute inset-x-0 top-0 h-px bg-white/8" />
      <div className="absolute inset-y-0 right-0 hidden w-[34%] bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_65%)] lg:block" />

      <div className="relative z-10 px-4 py-5 sm:px-5 sm:py-6 lg:px-6 lg:py-7">
        <div className="grid min-h-[26rem] grid-cols-1 gap-5 lg:min-h-[30rem] lg:grid-cols-[minmax(0,1.7fr)_minmax(16rem,20rem)] lg:items-stretch lg:gap-8">
          <div className="flex min-w-0 flex-col justify-between gap-5">
            <div className="max-w-[42rem] space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-200">
              <Badge variant="solid" className="text-[10px]">Featured</Badge>
              <Badge variant={itemVariant} className="text-[10px]">{getThemeLabel(item.type)}</Badge>
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
              <Button variant={itemVariant} size="lg" asChild className="w-full sm:w-auto">
                <Link href={toDetailHref(item)}>Start Watching</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <Link href={toDetailHref(item)}>View Detail</Link>
              </Button>
            </div>
          </div>

            {secondaryItems.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {secondaryItems.map((secondary) => {
                  const secondaryVariant = secondary.type === 'series' ? 'drama' : secondary.type;

                  return (
                    <Link
                      key={secondary.id}
                      href={toDetailHref(secondary)}
                      className="surface-panel group flex items-center gap-3 p-2.5 transition-colors hover:bg-surface-elevated"
                    >
                      <div className="relative h-[4.5rem] w-[3.25rem] shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-surface-2">
                        <Image
                          src={secondary.image || secondary.banner || '/favicon.ico'}
                          alt={secondary.title}
                          fill
                          sizes="104px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant={secondaryVariant} className="text-[10px]">{getThemeLabel(secondary.type)}</Badge>
                          <span className="text-[10px] font-semibold text-zinc-400">★ {secondary.rating || 'N/A'}</span>
                        </div>
                        <h3 className="line-clamp-2 text-sm font-black tracking-tight text-white group-hover:text-zinc-100">
                          {secondary.title}
                        </h3>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="hidden lg:flex lg:items-end lg:justify-end">
            <Link
              href={toDetailHref(item)}
              className="surface-panel group relative flex h-full w-full max-w-[19rem] overflow-hidden bg-surface-2"
            >
              <Image
                src={heroImage}
                alt={item.title}
                fill
                sizes="(min-width: 1024px) 304px, 70vw"
                priority
                fetchPriority="high"
                quality={60}
                className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300">
                    {item.tags[0] || 'Rilis Baru'}
                  </p>
                  <p className="line-clamp-2 text-sm font-black tracking-tight text-white">
                    {item.title}
                  </p>
                </div>
              </div>
            </Link>
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
  const sectionTheme = getThemeFromIconKey(section.iconKey);

  return (
    <SectionCard
      title={section.title}
      subtitle={section.subtitle}
      iconName={getSectionIconName(section.iconKey)}
      viewAllHref={section.viewAllHref}
      mode={layoutConfig.mode}
      gridDensity={layoutConfig.gridDensity}
      railVariant={layoutConfig.railVariant}
    >
      {section.items.map((item) => (
        <MediaCard
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
  const normalizedSections = normalizeHomeSections(sections);

  return (
    <main className="app-shell relative overflow-hidden" data-view-mode="compact">
      <div className="relative z-10 app-container-wide flex flex-col gap-6 py-3 sm:gap-8 sm:py-5 lg:gap-10">
        <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
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
      </div>
    </main>
  );
}
