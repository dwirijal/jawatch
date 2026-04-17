import type { CSSProperties } from 'react';
import Image from 'next/image';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { MediaCard } from '@/components/atoms/Card';
import { Link } from '@/components/atoms/Link';
import { ContinueWatching } from '@/components/organisms/ContinueWatching';
import { SectionCard } from '@/components/organisms/SectionCard';
import { type ThemeType } from '@/lib/utils';
import type { CardRailVariant } from '@/components/molecules/card/CardRail';
import type { HeroItem, HomeRecommendationSection, MixedRecommendationItem } from '@/app/home-page-types';
import { curateHomeSections } from '@/lib/home-curation';

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

const HERO_FALLBACK_DESCRIPTION = 'Curated picks from the unified Jawatch catalog, tuned for long watch and long read sessions.';
const HOME_LANE_LINKS = [
  { href: '/watch/movies', label: 'Movies' },
  { href: '/watch/series', label: 'Series' },
  { href: '/read/comics', label: 'Comics' },
  { href: '/watch/shorts', label: 'Shorts' },
] as const;

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

function normalizeHeroValue(value: string | undefined, fallback: string) {
  const trimmed = value?.trim() || '';
  if (!trimmed || trimmed.toUpperCase() === 'N/A') {
    return fallback;
  }

  return trimmed;
}

function getHeroAuxiliaryTags(item: HeroItem) {
  const themeLabel = getThemeLabel(item.type).toLowerCase();
  const seen = new Set<string>();

  return item.tags.filter((tag) => {
    const normalized = tag.trim().toLowerCase();
    if (!normalized || normalized === themeLabel || normalized === 'recommended' || seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  }).slice(0, 2);
}

function toDetailHref(item: HeroItem) {
  if (item.type === 'movie') {
    return `/movies/${item.id}`;
  }

  if (item.type === 'series') {
    return `/series/${item.id}`;
  }

  if (item.type === 'manga') {
    return `/comics/${item.id}`;
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
  const description = normalizeHeroValue(item.description, HERO_FALLBACK_DESCRIPTION);
  const rating = normalizeHeroValue(item.rating, '');
  const auxiliaryTags = getHeroAuxiliaryTags(item);
  const primaryContext = auxiliaryTags[0] || 'Cinematic pick';
  const secondaryContext = auxiliaryTags[1] || null;

  return (
    <section className="surface-panel-elevated relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(209,168,111,0.16),transparent_68%)]" />

      <div className="relative z-10 grid gap-5 p-4 sm:gap-6 sm:p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,20rem)] lg:items-center lg:gap-8 lg:p-8">
        <div className="order-1 flex min-w-0 flex-col gap-6 lg:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="solid" className="text-[10px]">Featured</Badge>
              <Badge variant={itemVariant} className="text-[10px]">{getThemeLabel(item.type)}</Badge>
              {rating ? <Badge variant="outline" className="text-[10px]">★ {rating}</Badge> : null}
            </div>

            <div className="space-y-3">
              <h1
                className="max-w-4xl font-[var(--font-heading)] text-[clamp(2.3rem,7vw,4.4rem)] font-bold leading-[0.94] tracking-[-0.06em] text-foreground"
                style={HERO_TITLE_CLAMP_STYLE}
              >
                {item.title}
              </h1>

              <p className="max-w-[40rem] text-base leading-7 text-muted-foreground" style={HERO_DESC_CLAMP_STYLE}>
                {description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              <span>{primaryContext}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
              <span>{rating ? `Rated ${rating}` : 'Fresh today'}</span>
              {secondaryContext ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
                  <span>{secondaryContext}</span>
                </>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button variant="primary" size="lg" asChild className="w-full sm:w-auto">
                <Link href={toDetailHref(item)}>{item.type === 'manga' ? 'Start reading' : 'Start watching'}</Link>
              </Button>
              <Button variant="secondary" size="lg" asChild className="w-full sm:w-auto">
                <Link href={toDetailHref(item)}>View detail</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {HOME_LANE_LINKS.map((lane) => (
                <Link
                  key={lane.href}
                  href={lane.href}
                  className="focus-tv inline-flex min-h-11 items-center rounded-full border border-border-subtle bg-surface-1 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
                >
                  {lane.label}
                </Link>
              ))}
            </div>
          </div>

          {secondaryItems.length > 0 ? (
            <div className="hidden space-y-3 border-t border-border-subtle pt-4 lg:block">
              <p className="type-kicker">Continue browsing</p>
              <div className="grid gap-3 md:grid-cols-3">
                {secondaryItems.map((secondary) => {
                  const secondaryVariant = secondary.type === 'series' ? 'drama' : secondary.type;
                  const secondaryRating = normalizeHeroValue(secondary.rating, '');

                  return (
                    <Link
                      key={secondary.id}
                      href={toDetailHref(secondary)}
                      className="group flex min-w-0 items-center gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-1 p-3 transition-colors hover:bg-surface-elevated"
                    >
                      <div className="relative h-[4.75rem] w-[3.4rem] shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-surface-2">
                        <Image
                          src={secondary.image || secondary.banner || '/favicon.ico'}
                          alt={secondary.title}
                          fill
                          sizes="108px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={secondaryVariant} className="text-[10px]">{getThemeLabel(secondary.type)}</Badge>
                          {secondaryRating ? (
                            <span className="text-[10px] font-semibold text-muted-foreground">★ {secondaryRating}</span>
                          ) : null}
                        </div>
                        <h3 className="line-clamp-2 text-sm font-black tracking-tight text-foreground">
                          {secondary.title}
                        </h3>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <Link
          href={toDetailHref(item)}
          className="focus-tv group relative order-2 overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle bg-[#0d1015]"
        >
          <div className="relative aspect-[16/9] w-full sm:aspect-[7/5] lg:aspect-[4/5]">
            <Image
              src={heroImage}
              alt={item.title}
              fill
              sizes="(min-width: 1024px) 336px, (min-width: 640px) 92vw, 100vw"
              priority
              fetchPriority="high"
              quality={72}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/12 to-transparent lg:hidden" />
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 lg:hidden">
            <Badge variant="solid" className="text-[10px]">Featured</Badge>
            <Badge variant={itemVariant} className="text-[10px]">{getThemeLabel(item.type)}</Badge>
          </div>
          <div className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-5 lg:block">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="solid" className="text-[10px]">Featured</Badge>
              <Badge variant={itemVariant} className="text-[10px]">{getThemeLabel(item.type)}</Badge>
            </div>
            <p className="mt-3 line-clamp-2 text-lg font-black tracking-tight text-white">{item.title}</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-300">
              {primaryContext}
            </p>
          </div>
        </Link>
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
          metaLine={item.metaLine}
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
  const curatedSections = curateHomeSections(sections);

  return (
    <main className="app-shell relative overflow-hidden" data-view-mode="compact">
      <div className="relative z-10 app-container-wide flex flex-col gap-6 py-3 sm:gap-8 sm:py-5 lg:gap-10">
        <div className="flex flex-col gap-7 sm:gap-9 lg:gap-10">
          {featuredHero ? (
            <HeroStage item={featuredHero} secondaryItems={secondaryHeroes} />
          ) : (
            <section className="surface-panel h-[44vh] animate-pulse" />
          )}
          <ContinueWatching title="Continue Your Session" limit={8} />
          <SectionGrid sections={curatedSections} />
        </div>
      </div>
    </main>
  );
}
