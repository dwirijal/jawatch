export const ONBOARDING_MEDIA_TYPES = [
  "movies",
  "series",
  "anime",
  "donghua",
  "drachin",
  "comic",
  "novel",
] as const;

export type OnboardingMediaType = (typeof ONBOARDING_MEDIA_TYPES)[number];

export type OnboardingTitleSeedInput = {
  title: string;
  mediaType?: OnboardingMediaType | null;
};

export type OnboardingTitleSeed = {
  title: string;
  mediaType: OnboardingMediaType | null;
  source: string;
};

export type OnboardingCompletionInput = {
  displayName?: string | null;
  birthDate?: string | Date | null;
  adultChoiceSaved?: boolean | null;
  onboardingCompletedAt?: string | Date | null;
};

export type OnboardingStatus = {
  userId: string;
  displayName: string | null;
  birthDate: string | null;
  age: number | null;
  adultContentEnabled: boolean;
  adultChoiceSaved: boolean;
  canAccessNsfw: boolean;
  onboardingCompletedAt: string | null;
  complete: boolean;
  newsletterOptIn: boolean;
  communityOptIn: boolean;
  mediaTypes: OnboardingMediaType[];
  genreKeys: string[];
  titleSeeds: OnboardingTitleSeed[];
};
