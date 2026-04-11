import type { SupabaseClient } from "@supabase/supabase-js";

type UserPreferencesRow = {
  user_id: string;
  adult_content_enabled: boolean;
  subtitle_locale: string | null;
  theme: string | null;
};

export type UserPreferences = {
  userId: string;
  adultContentEnabled: boolean;
  subtitleLocale: string | null;
  theme: string | null;
};

const USER_PREFERENCES_SELECT = "user_id,adult_content_enabled,subtitle_locale,theme";

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

export async function getUserPreferences(supabase: SupabaseClient, userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select(USER_PREFERENCES_SELECT)
    .eq("user_id", userId)
    .maybeSingle<UserPreferencesRow>();

  if (error) {
    throw error;
  }

  return data ? toUserPreferences(data) : null;
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
