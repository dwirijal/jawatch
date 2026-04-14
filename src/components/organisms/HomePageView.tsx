import type { CSSProperties } from 'react';
import { AdSection } from '@/components/organisms/AdSection';
import { SectionCard } from '@/components/organisms/SectionCard';
import { MediaCard } from '@/components/atoms/Card';
import { HeroCarousel } from '@/components/organisms/HeroCarousel';
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

const HOME_SECTION_MAX_ITEMS = 12;
const HOME_SECTION_MIN_ITEMS = 4;

const HOMEPAGE_SECTION_LAYOUTS: Partial<Record<string, SectionLayoutConfig>> = {
  'fresh-week': { mode: 'rail', railVariant: 'default', gridDensity: 'dense' },
  'blockbuster': { mode: 'rail', railVariant: 'default', gridDensity: 'dense' },
  'popular-media': { mode: 'rail', railVariant: 'default', gridDensity: 'dense' },
  'community-lovers': { mode: 'rail', railVariant: 'default', gridDensity: 'dense' },
};

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
  const normalizedSections = normalizeHomeSections(sections);

  return (
    <main className="app-shell relative overflow-hidden" data-view-mode="compact">
      <div className="relative z-10 app-container-wide flex flex-col gap-6 py-3 sm:gap-8 sm:py-5 lg:gap-10">
        <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
          {heroItems.length > 0 ? (
            <HeroCarousel items={heroItems} />
          ) : (
            <section className="surface-panel h-[85vh] animate-pulse" />
          )}
          
          <div className="-mt-[120px] relative z-20 flex flex-col gap-6 sm:gap-8 lg:gap-10">
            <AdSection
              title="Partner Spotlight"
              subtitle="Featured campaigns and partner placements that keep the same compact editorial rhythm as the rest of the homepage."
            />
            <SectionGrid sections={normalizedSections} />
          </div>
        </div>
      </div>
    </main>
  );
}
