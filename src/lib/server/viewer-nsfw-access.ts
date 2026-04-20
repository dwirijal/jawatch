import 'server-only';

import { canAccessNsfw } from '../auth/adult-access.ts';
import { getProfileAdultFields } from '../auth/profile.ts';
import { hasSupabaseAuthCookie } from '../auth/supabase-auth-cookie.ts';
import { getOrCreateUserPreferences } from './user-preferences.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';

export async function resolveViewerNsfwAccess(): Promise<boolean> {
  try {
    if (!(await hasSupabaseAuthCookie())) {
      return false;
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return false;
    }

    const [profile, preferences] = await Promise.all([
      getProfileAdultFields(supabase, data.user.id),
      getOrCreateUserPreferences(supabase, data.user.id),
    ]);

    return canAccessNsfw({
      birthDate: profile?.birthDate ?? null,
      adultContentEnabled: preferences.adultContentEnabled,
    });
  } catch {
    return false;
  }
}
