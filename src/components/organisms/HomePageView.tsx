import { HomeHeroStage } from '@/features/home/HomeHeroStage';
import { HomeContinueRail } from '@/features/home/HomeContinueRail';
import { HomeSectionGrid } from '@/features/home/HomeSectionGrid';
import type { HeroItem, HomeRecommendationSection } from '@/features/home/home-page-types';
import { curateHomeSections } from '@/lib/home-curation';

type HomePageClientProps = {
  heroItems: HeroItem[];
  sections: HomeRecommendationSection[];
};

export function HomePageView({ heroItems, sections }: HomePageClientProps) {
  const featuredHero = heroItems[0];
  const secondaryHeroes = heroItems.slice(1, 4);
  const curatedSections = curateHomeSections(sections);

  return (
    <main className="app-shell relative overflow-hidden" data-view-mode="compact">
      <div className="relative z-10 app-container-wide flex flex-col gap-5 py-3 sm:gap-8 sm:py-5 lg:gap-10">
        <div className="flex flex-col gap-6 sm:gap-9 lg:gap-10">
          {featuredHero ? (
            <HomeHeroStage item={featuredHero} secondaryItems={secondaryHeroes} />
          ) : (
            <section className="surface-panel h-[44vh] animate-pulse" />
          )}
          <HomeContinueRail />
          <HomeSectionGrid sections={curatedSections} />
        </div>
      </div>
    </main>
  );
}
