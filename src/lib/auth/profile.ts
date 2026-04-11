import type { SupabaseClient, User } from "@supabase/supabase-js";

type ProfileUpsertRow = {
  id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  provider: string | null;
};

type ProfileAdultFieldsRow = {
  id: string;
  birth_date: string | null;
  age_verified_at: string | null;
};

export type ProfileAdultFields = {
  userId: string;
  birthDate: string | null;
  ageVerifiedAt: string | null;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function buildDisplayName(user: User): string {
  const metadata = user.user_metadata ?? {};
  const fromMetadata =
    asString(metadata.display_name) ??
    asString(metadata.full_name) ??
    asString(metadata.name) ??
    asString(metadata.user_name) ??
    asString(metadata.preferred_username);

  if (fromMetadata) {
    return fromMetadata;
  }

  if (user.email) {
    const [token] = user.email.split("@");
    if (token && token.length > 0) {
      return token;
    }

    return user.email;
  }

  return `user-${user.id.slice(0, 8)}`;
}

function buildProvider(user: User): string | null {
  const providerFromAppMetadata = asString(user.app_metadata?.provider);
  if (providerFromAppMetadata) {
    return providerFromAppMetadata;
  }

  if (Array.isArray(user.identities)) {
    for (const identity of user.identities) {
      const provider = asString(identity?.provider);
      if (provider) {
        return provider;
      }
    }
  }

  return null;
}

export function toProfileUpsertRow(user: User): ProfileUpsertRow {
  return {
    id: user.id,
    email: user.email ?? null,
    display_name: buildDisplayName(user),
    avatar_url:
      asString(user.user_metadata?.avatar_url) ??
      asString(user.user_metadata?.picture) ??
      asString(user.user_metadata?.avatar),
    provider: buildProvider(user),
  };
}

export async function bootstrapProfileForUser(
  supabase: SupabaseClient,
  user: User,
): Promise<ProfileUpsertRow> {
  const row = toProfileUpsertRow(user);
  const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });

  if (error) {
    throw error;
  }

  return row;
}

export async function bootstrapProfileFromSession(supabase: SupabaseClient): Promise<ProfileUpsertRow | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }

  if (!data.user) {
    return null;
  }

  return bootstrapProfileForUser(supabase, data.user);
}

function toIsoDateOnly(value: string | Date): string | null {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

export async function getProfileAdultFields(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileAdultFields | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,birth_date,age_verified_at")
    .eq("id", userId)
    .maybeSingle<ProfileAdultFieldsRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    userId: data.id,
    birthDate: data.birth_date ?? null,
    ageVerifiedAt: data.age_verified_at ?? null,
  };
}

export async function setProfileAdultFields(
  supabase: SupabaseClient,
  input: {
    userId: string;
    birthDate: string | Date;
    ageVerifiedAt?: string | Date | null;
  },
): Promise<ProfileAdultFields> {
  const birthDate = toIsoDateOnly(input.birthDate);
  if (!birthDate) {
    throw new Error("Invalid birth date");
  }

  const ageVerifiedAt =
    input.ageVerifiedAt === undefined
      ? new Date().toISOString()
      : input.ageVerifiedAt instanceof Date
        ? input.ageVerifiedAt.toISOString()
        : input.ageVerifiedAt;

  const payload = {
    id: input.userId,
    birth_date: birthDate,
    age_verified_at: ageVerifiedAt ?? null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id,birth_date,age_verified_at")
    .single<ProfileAdultFieldsRow>();

  if (error) {
    throw error;
  }

  return {
    userId: data.id,
    birthDate: data.birth_date ?? null,
    ageVerifiedAt: data.age_verified_at ?? null,
  };
}
