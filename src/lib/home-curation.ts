import type { HomeRecommendationSection } from '@/app/home-page-types';

export const HOME_EDITORIAL_SECTION_ORDER = [
  'fresh-week',
  'popular-media',
  'movie-latest',
  'series-radar',
  'top-reading',
  'community-lovers',
  'series-anime',
  'series-donghua',
] as const;

export const HOME_EDITORIAL_MAX_SECTIONS = 6;
export const HOME_EDITORIAL_MAX_ITEMS = 8;
export const HOME_EDITORIAL_MIN_ITEMS = 3;

function normalizeSectionItems(section: HomeRecommendationSection): HomeRecommendationSection {
  return {
    ...section,
    items: section.items.slice(0, HOME_EDITORIAL_MAX_ITEMS),
  };
}

export function curateHomeSections(
  sections: HomeRecommendationSection[],
  maxSections = HOME_EDITORIAL_MAX_SECTIONS,
): HomeRecommendationSection[] {
  const byId = new Map(sections.map((section) => [section.id, section]));
  const picked: HomeRecommendationSection[] = [];
  const seen = new Set<string>();

  const pushSection = (section: HomeRecommendationSection | undefined) => {
    if (!section || seen.has(section.id)) {
      return;
    }

    const normalized = normalizeSectionItems(section);
    if (normalized.items.length < HOME_EDITORIAL_MIN_ITEMS) {
      return;
    }

    seen.add(normalized.id);
    picked.push(normalized);
  };

  for (const id of HOME_EDITORIAL_SECTION_ORDER) {
    pushSection(byId.get(id));
    if (picked.length >= maxSections) {
      return picked;
    }
  }

  for (const section of sections) {
    pushSection(section);
    if (picked.length >= maxSections) {
      return picked;
    }
  }

  return picked;
}
