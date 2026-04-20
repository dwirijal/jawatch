import { MediaCard } from '@/components/atoms/Card';
import { SectionCard } from '@/components/organisms/SectionCard';
import type { HomeRecommendationSection } from '@/features/home/home-page-types';
import {
  getSectionIconName,
  getSectionLayoutConfig,
  getThemeFromIconKey,
  type SectionLayoutConfig,
} from '@/features/home/home-view-helpers';

type HomeRecommendationSectionCardProps = {
  layoutConfig: SectionLayoutConfig;
  section: HomeRecommendationSection;
};

function HomeRecommendationSectionCard({
  layoutConfig,
  section,
}: HomeRecommendationSectionCardProps) {
  if (!section.items?.length) {
    return null;
  }

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

export function HomeSectionGrid({ sections }: { sections: HomeRecommendationSection[] }) {
  return (
    <div className="flex flex-col gap-7 sm:gap-8 lg:gap-10">
      {sections.map((section) => (
        <HomeRecommendationSectionCard
          key={section.id}
          section={section}
          layoutConfig={getSectionLayoutConfig(section)}
        />
      ))}
    </div>
  );
}
