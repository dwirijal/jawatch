import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  OnboardingCompletionInput,
  OnboardingMediaType,
  OnboardingStatus,
  OnboardingTitleSeed,
  OnboardingTitleSeedInput,
} from "./types";

type ProfileOnboardingRow = {
  id: string;
  display_name: string | null;
  birth_date: string | null;
  onboarding_completed_at: string | null;
};

type UserPreferenceOnboardingRow = {
  user_id: string;
  adult_content_enabled: boolean;
  adult_content_choice_set_at: string | null;
  newsletter_opt_in: boolean | null;
  community_opt_in: boolean | null;
};

type UserMediaPreferenceRow = {
  media_type: OnboardingMediaType;
};

type UserGenrePreferenceRow = {
  genre_key: string;
};

type UserTitleSeedRow = {
  title: string;
  media_type: OnboardingMediaType | null;
  source: string | null;
};

type OnboardingValidationModule = typeof import("./validation");
type ProfileModule = typeof import("../auth/profile");

let onboardingValidationPromise: Promise<OnboardingValidationModule> | null = null;
let profileModulePromise: Promise<ProfileModule> | null = null;
const ONBOARDING_VALIDATION_MODULE_URL = new URL("./validation.ts", import.meta.url).href;
const PROFILE_MODULE_URL = new URL("../auth/profile.ts", import.meta.url).href;

function loadOnboardingValidation(): Promise<OnboardingValidationModule> {
  if (!onboardingValidationPromise) {
    onboardingValidationPromise = import(ONBOARDING_VALIDATION_MODULE_URL) as Promise<OnboardingValidationModule>;
  }

  return onboardingValidationPromise;
}

function loadProfileModule(): Promise<ProfileModule> {
  if (!profileModulePromise) {
    profileModulePromise = import(PROFILE_MODULE_URL) as Promise<ProfileModule>;
  }

  return profileModulePromise;
}

function hasNonEmptyDisplayName(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isStrictPastBirthDate(value: string | Date | null | undefined): boolean {
  if (!value) {
    return false;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return false;
    }

    return value.toISOString().slice(0, 10) < new Date().toISOString().slice(0, 10);
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return false;
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().slice(0, 10) === trimmed && trimmed < new Date().toISOString().slice(0, 10);
}

function hasCompletedAt(value: string | Date | null | undefined): boolean {
  if (!value) {
    return false;
  }

  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }

  const parsed = new Date(trimmed);
  return !Number.isNaN(parsed.getTime());
}

function ageInYears(birthDate: string | Date | null | undefined, now = new Date()): number | null {
  if (!birthDate) {
    return null;
  }

  const parsed = birthDate instanceof Date ? birthDate : new Date(`${birthDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  let age = now.getUTCFullYear() - parsed.getUTCFullYear();
  const hasHadBirthday =
    now.getUTCMonth() > parsed.getUTCMonth() ||
    (now.getUTCMonth() === parsed.getUTCMonth() && now.getUTCDate() >= parsed.getUTCDate());

  if (!hasHadBirthday) {
    age -= 1;
  }

  return age;
}

export function isOnboardingComplete(input: OnboardingCompletionInput): boolean {
  return (
    hasNonEmptyDisplayName(input.displayName) &&
    isStrictPastBirthDate(input.birthDate) &&
    Boolean(input.adultChoiceSaved) &&
    hasCompletedAt(input.onboardingCompletedAt)
  );
}

export async function getOnboardingStatus(
  supabase: SupabaseClient,
  userId: string,
  now = new Date(),
): Promise<OnboardingStatus> {
  const { isAdultChoiceTimestampSet, normalizeGenreKeys, normalizeMediaTypes } =
    await loadOnboardingValidation();

  const [profileResult, preferenceResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,display_name,birth_date,onboarding_completed_at")
      .eq("id", userId)
      .maybeSingle<ProfileOnboardingRow>(),
    supabase
      .from("user_preferences")
      .select("user_id,adult_content_enabled,adult_content_choice_set_at,newsletter_opt_in,community_opt_in")
      .eq("user_id", userId)
      .maybeSingle<UserPreferenceOnboardingRow>(),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }
  if (preferenceResult.error) {
    throw preferenceResult.error;
  }

  const [mediaPreferencesResult, genrePreferencesResult, titleSeedsResult] = await Promise.all([
    supabase
      .from("user_media_preferences")
      .select("media_type")
      .eq("user_id", userId),
    supabase
      .from("user_genre_preferences")
      .select("genre_key")
      .eq("user_id", userId),
    supabase
      .from("user_title_seeds")
      .select("title,media_type,source")
      .eq("user_id", userId),
  ]);
  if (mediaPreferencesResult.error) {
    throw mediaPreferencesResult.error;
  }
  if (genrePreferencesResult.error) {
    throw genrePreferencesResult.error;
  }
  if (titleSeedsResult.error) {
    throw titleSeedsResult.error;
  }

  const profile = profileResult.data;
  const preferences = preferenceResult.data;

  const displayName = profile?.display_name?.trim() || null;
  const birthDate = profile?.birth_date ?? null;
  const onboardingCompletedAt = profile?.onboarding_completed_at ?? null;
  const adultContentEnabled = Boolean(preferences?.adult_content_enabled);
  const adultChoiceSaved = isAdultChoiceTimestampSet(preferences?.adult_content_choice_set_at ?? null);
  const age = ageInYears(birthDate, now);
  const isAdultByAge = age !== null && age >= 21;
  const canAccessNsfw = isAdultByAge && adultContentEnabled;
  const mediaTypes = normalizeMediaTypes(
    ((mediaPreferencesResult.data ?? []) as UserMediaPreferenceRow[]).map((row) => row.media_type),
  );
  const genreKeys = normalizeGenreKeys(
    ((genrePreferencesResult.data ?? []) as UserGenrePreferenceRow[]).map((row) => row.genre_key),
  );
  const titleSeeds: OnboardingTitleSeed[] = ((titleSeedsResult.data ?? []) as UserTitleSeedRow[]).map((row) => ({
    title: row.title,
    mediaType: row.media_type ?? null,
    source: row.source ?? "onboarding",
  }));

  return {
    userId,
    displayName,
    birthDate,
    age,
    adultContentEnabled,
    adultChoiceSaved,
    canAccessNsfw,
    onboardingCompletedAt,
    complete: isOnboardingComplete({
      displayName,
      birthDate,
      adultChoiceSaved,
      onboardingCompletedAt,
    }),
    newsletterOptIn: Boolean(preferences?.newsletter_opt_in),
    communityOptIn: Boolean(preferences?.community_opt_in),
    mediaTypes,
    genreKeys,
    titleSeeds,
  };
}

export async function markOnboardingComplete(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { setOnboardingCompletedAt } = await loadProfileModule();
  const result = await setOnboardingCompletedAt(supabase, userId);
  return result.onboardingCompletedAt;
}

export async function replaceMediaPreferences(
  supabase: SupabaseClient,
  userId: string,
  mediaTypes: OnboardingMediaType[],
): Promise<OnboardingMediaType[]> {
  const { normalizeMediaTypes } = await loadOnboardingValidation();
  const normalizedMediaTypes = normalizeMediaTypes(mediaTypes);
  const { error: deleteError } = await supabase
    .from("user_media_preferences")
    .delete()
    .eq("user_id", userId);
  if (deleteError) {
    throw deleteError;
  }

  if (normalizedMediaTypes.length === 0) {
    return [];
  }

  const payload = normalizedMediaTypes.map((mediaType) => ({
    user_id: userId,
    media_type: mediaType,
  }));

  const { data, error } = await supabase
    .from("user_media_preferences")
    .insert(payload)
    .select("media_type");
  if (error) {
    throw error;
  }

  return normalizeMediaTypes(((data ?? []) as UserMediaPreferenceRow[]).map((row) => row.media_type));
}

export async function replaceGenrePreferences(
  supabase: SupabaseClient,
  userId: string,
  genreKeys: string[],
): Promise<string[]> {
  const { normalizeGenreKeys } = await loadOnboardingValidation();
  const normalizedGenreKeys = normalizeGenreKeys(genreKeys);
  const { error: deleteError } = await supabase
    .from("user_genre_preferences")
    .delete()
    .eq("user_id", userId);
  if (deleteError) {
    throw deleteError;
  }

  if (normalizedGenreKeys.length === 0) {
    return [];
  }

  const payload = normalizedGenreKeys.map((genreKey) => ({
    user_id: userId,
    genre_key: genreKey,
  }));

  const { data, error } = await supabase
    .from("user_genre_preferences")
    .insert(payload)
    .select("genre_key");
  if (error) {
    throw error;
  }

  return normalizeGenreKeys(((data ?? []) as UserGenrePreferenceRow[]).map((row) => row.genre_key));
}

export async function replaceTitleSeeds(
  supabase: SupabaseClient,
  userId: string,
  titleSeeds: OnboardingTitleSeedInput[],
): Promise<OnboardingTitleSeed[]> {
  const { normalizeTitleSeeds } = await loadOnboardingValidation();
  const normalizedTitleSeeds = normalizeTitleSeeds(titleSeeds);
  const { error: deleteError } = await supabase
    .from("user_title_seeds")
    .delete()
    .eq("user_id", userId);
  if (deleteError) {
    throw deleteError;
  }

  if (normalizedTitleSeeds.length === 0) {
    return [];
  }

  const payload = normalizedTitleSeeds.map((seed) => ({
    user_id: userId,
    title: seed.title,
    media_type: seed.mediaType ?? null,
    source: "onboarding",
  }));

  const { data, error } = await supabase
    .from("user_title_seeds")
    .insert(payload)
    .select("title,media_type,source");
  if (error) {
    throw error;
  }

  return ((data ?? []) as UserTitleSeedRow[]).map((row) => ({
    title: row.title,
    mediaType: row.media_type ?? null,
    source: row.source ?? "onboarding",
  }));
}

export async function saveAgeAccessFields(
  supabase: SupabaseClient,
  userId: string,
  input: {
    birthDate: string | Date;
    adultContentEnabled: boolean;
  },
): Promise<{
  birthDate: string | null;
  ageVerifiedAt: string | null;
  adultContentEnabled: boolean;
  adultContentChoiceSetAt: string | null;
}> {
  const { assertValidBirthDate, normalizeAdultChoiceTimestamp } = await loadOnboardingValidation();
  const { setProfileAdultFields } = await loadProfileModule();
  const birthDate = assertValidBirthDate(input.birthDate);
  const adultChoiceSetAt = normalizeAdultChoiceTimestamp();
  const profileWrite = setProfileAdultFields(supabase, {
    userId,
    birthDate,
  });

  const preferenceWrite = supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        adult_content_enabled: input.adultContentEnabled,
        adult_content_choice_set_at: adultChoiceSetAt,
      },
      { onConflict: "user_id" },
    )
    .select("adult_content_enabled,adult_content_choice_set_at")
    .single<{ adult_content_enabled: boolean; adult_content_choice_set_at: string | null }>();

  const [profileResult, preferenceResult] = await Promise.all([profileWrite, preferenceWrite]);
  if (preferenceResult.error) {
    throw preferenceResult.error;
  }

  return {
    birthDate: profileResult.birthDate ?? null,
    ageVerifiedAt: profileResult.ageVerifiedAt ?? null,
    adultContentEnabled: Boolean(preferenceResult.data.adult_content_enabled),
    adultContentChoiceSetAt: preferenceResult.data.adult_content_choice_set_at ?? null,
  };
}
