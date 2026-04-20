import type { SupabaseClient } from "@supabase/supabase-js";
import { buildComicCacheKey, rememberComicCacheValue } from "./comic-cache.ts";

type UserPreferencesRow = {
  user_id: string;
  adult_content_enabled: boolean;
  subtitle_locale: string | null;
  theme: string | null;
  adult_content_choice_set_at?: string | null;
  newsletter_opt_in?: boolean;
  community_opt_in?: boolean;
};

export type UserPreferences = {
  userId: string;
  adultContentEnabled: boolean;
  subtitleLocale: string | null;
  theme: string | null;
};

const USER_PREFERENCES_SELECT = "user_id,adult_content_enabled,subtitle_locale,theme";
const USER_PREFERENCE_ONBOARDING_SELECT =
  "user_id,adult_content_enabled,adult_content_choice_set_at,newsletter_opt_in,community_opt_in";
const ONBOARDING_VALIDATION_MODULE_URL = new URL("../onboarding/validation.ts", import.meta.url).href;
const PREFERENCES_CACHE_TTL_SECONDS = 60 * 5;

export type UserPreferenceOnboardingFields = {
  userId: string;
  adultContentEnabled: boolean;
  adultContentChoiceSetAt: string | null;
  newsletterOptIn: boolean;
  communityOptIn: boolean;
};

function toUserPreferences(row: UserPreferencesRow): UserPreferences {
  return {
    userId: row.user_id,
    adultContentEnabled: Boolean(row.adult_content_enabled),
    subtitleLocale: row.subtitle_locale ?? null,
    theme: row.theme ?? null,
  };
}

function buildDefaultRow(userId: string): UserPreferencesRow {
  return {
    user_id: userId,
    adult_content_enabled: false,
    subtitle_locale: null,
    theme: null,
  };
}

function toOnboardingPreferenceFields(row: UserPreferencesRow): UserPreferenceOnboardingFields {
  return {
    userId: row.user_id,
    adultContentEnabled: Boolean(row.adult_content_enabled),
    adultContentChoiceSetAt: row.adult_content_choice_set_at ?? null,
    newsletterOptIn: Boolean(row.newsletter_opt_in),
    communityOptIn: Boolean(row.community_opt_in),
  };
}

export async function getUserPreferences(supabase: SupabaseClient, userId: string): Promise<UserPreferences | null> {
  const cacheKey = buildComicCacheKey('user', userId, 'preferences');

  return rememberComicCacheValue(cacheKey, PREFERENCES_CACHE_TTL_SECONDS, async () => {
    const { data, error } = await supabase
      .from("user_preferences")
      .select(USER_PREFERENCES_SELECT)
      .eq("user_id", userId)
      .maybeSingle<UserPreferencesRow>();

    if (error) {
      throw error;
    }

    return data ? toUserPreferences(data) : null;
  });
}

export async function getOrCreateUserPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserPreferences> {
  const existing = await getUserPreferences(supabase, userId);
  if (existing) {
    return existing;
  }

  const defaultRow = buildDefaultRow(userId);
  const { data, error } = await supabase
    .from("user_preferences")
    .insert(defaultRow)
    .select(USER_PREFERENCES_SELECT)
    .single<UserPreferencesRow>();

  if (!error && data) {
    return toUserPreferences(data);
  }

  if (error && error.code === "23505") {
    const raceWinner = await getUserPreferences(supabase, userId);
    if (raceWinner) {
      return raceWinner;
    }
  }

  throw error ?? new Error("Failed to initialize user preferences");
}

export async function setAdultContentEnabled(
  supabase: SupabaseClient,
  userId: string,
  adultContentEnabled: boolean,
): Promise<UserPreferences> {
  const payload = {
    user_id: userId,
    adult_content_enabled: adultContentEnabled,
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select(USER_PREFERENCES_SELECT)
    .single<UserPreferencesRow>();

  if (error) {
    throw error;
  }

  return toUserPreferences(data);
}

export async function getUserPreferenceOnboardingFields(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserPreferenceOnboardingFields | null> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select(USER_PREFERENCE_ONBOARDING_SELECT)
    .eq("user_id", userId)
    .maybeSingle<UserPreferencesRow>();

  if (error) {
    throw error;
  }

  return data ? toOnboardingPreferenceFields(data) : null;
}

export async function setAdultContentChoice(
  supabase: SupabaseClient,
  userId: string,
  input: {
    adultContentEnabled: boolean;
    adultContentChoiceSetAt?: string | Date;
  },
): Promise<UserPreferenceOnboardingFields> {
  const { normalizeAdultChoiceTimestamp } = (await import(
    ONBOARDING_VALIDATION_MODULE_URL
  )) as typeof import("../onboarding/validation");
  const adultContentChoiceSetAt = normalizeAdultChoiceTimestamp(input.adultContentChoiceSetAt);

  const payload = {
    user_id: userId,
    adult_content_enabled: input.adultContentEnabled,
    adult_content_choice_set_at: adultContentChoiceSetAt,
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select(USER_PREFERENCE_ONBOARDING_SELECT)
    .single<UserPreferencesRow>();

  if (error) {
    throw error;
  }

  return toOnboardingPreferenceFields(data);
}

export async function setPreferenceOptIns(
  supabase: SupabaseClient,
  userId: string,
  input: {
    newsletterOptIn: boolean;
    communityOptIn: boolean;
  },
): Promise<UserPreferenceOnboardingFields> {
  const payload = {
    user_id: userId,
    newsletter_opt_in: input.newsletterOptIn,
    community_opt_in: input.communityOptIn,
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select(USER_PREFERENCE_ONBOARDING_SELECT)
    .single<UserPreferencesRow>();

  if (error) {
    throw error;
  }

  return toOnboardingPreferenceFields(data);
}

export async function setUserPreferencesProfile(
  supabase: SupabaseClient,
  userId: string,
  input: {
    theme: string | null;
    subtitleLocale: string | null;
  },
): Promise<UserPreferences> {
  const payload = {
    user_id: userId,
    theme: input.theme,
    subtitle_locale: input.subtitleLocale,
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select(USER_PREFERENCES_SELECT)
    .single<UserPreferencesRow>();

  if (error) {
    throw error;
  }

  return toUserPreferences(data);
}
