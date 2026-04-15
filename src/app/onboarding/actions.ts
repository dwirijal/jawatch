'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { setProfileDisplayName } from '@/lib/auth/profile';
import {
  getOnboardingStatus,
  markOnboardingComplete,
  replaceGenrePreferences,
  replaceMediaPreferences,
  replaceTitleSeeds,
  saveAgeAccessFields,
} from '@/lib/onboarding/server';
import { type OnboardingMediaType, ONBOARDING_MEDIA_TYPES } from '@/lib/onboarding/types';
import { setPreferenceOptIns } from '@/lib/server/user-preferences';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ONBOARDING_ROUTE = '/onboarding';

function toStringValue(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveRequiredStepForStatus(status: {
  displayName: string | null;
  birthDate: string | null;
  adultChoiceSaved: boolean;
}): 'identity' | 'age-access' {
  if (!status.displayName) {
    return 'identity';
  }

  return 'age-access';
}

function parseMediaTypes(formData: FormData): OnboardingMediaType[] {
  const allowedMediaTypes = new Set<string>(ONBOARDING_MEDIA_TYPES);
  return formData
    .getAll('mediaTypes')
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry): entry is OnboardingMediaType => allowedMediaTypes.has(entry));
}

function parseGenreKeys(formData: FormData): string[] {
  return toStringValue(formData.get('genreKeys'))
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function parseTitleSeeds(formData: FormData): Array<{ title: string; mediaType: null }> {
  return toStringValue(formData.get('favoriteTitles'))
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((title) => ({ title, mediaType: null }));
}

function hasRequiredOnboardingFields(status: {
  displayName: string | null;
  birthDate: string | null;
  adultChoiceSaved: boolean;
}): boolean {
  return Boolean(status.displayName) && Boolean(status.birthDate) && status.adultChoiceSaved;
}

export async function saveIdentityStep(formData: FormData) {
  const user = await requireUser(ONBOARDING_ROUTE);
  const displayName = toStringValue(formData.get('displayName'));

  if (!displayName) {
    redirect('/onboarding?step=identity&error=display-name');
  }

  const supabase = await createSupabaseServerClient();

  try {
    await setProfileDisplayName(supabase, user.id, displayName);
  } catch {
    redirect('/onboarding?step=identity&error=display-name');
  }

  redirect('/onboarding?step=age-access');
}

export async function saveAgeAccessStep(formData: FormData) {
  const user = await requireUser(ONBOARDING_ROUTE);
  const birthDate = toStringValue(formData.get('birthDate'));
  const adultContentEnabled = formData.get('adultContentEnabled') === 'on';

  const supabase = await createSupabaseServerClient();

  try {
    await saveAgeAccessFields(supabase, user.id, {
      birthDate,
      adultContentEnabled,
    });
  } catch {
    redirect('/onboarding?step=age-access&error=birth-date');
  }

  redirect('/onboarding?step=media');
}

export async function saveMediaPreferences(formData: FormData) {
  const user = await requireUser(ONBOARDING_ROUTE);
  const mediaTypes = parseMediaTypes(formData);

  const supabase = await createSupabaseServerClient();

  try {
    await replaceMediaPreferences(supabase, user.id, mediaTypes);
  } catch {
    redirect('/onboarding?step=media&error=media');
  }

  redirect('/onboarding?step=taste');
}

export async function saveTasteSeeds(formData: FormData) {
  const user = await requireUser(ONBOARDING_ROUTE);
  const genreKeys = parseGenreKeys(formData);
  const titleSeeds = parseTitleSeeds(formData);

  const supabase = await createSupabaseServerClient();

  try {
    await replaceGenrePreferences(supabase, user.id, genreKeys);
    await replaceTitleSeeds(supabase, user.id, titleSeeds);
  } catch {
    redirect('/onboarding?step=taste&error=taste');
  }

  redirect('/onboarding?step=opt-ins');
}

export async function saveOptInsAndFinishOnboarding(formData: FormData) {
  const user = await requireUser(ONBOARDING_ROUTE);
  const newsletterOptIn = formData.get('newsletterOptIn') === 'on';
  const communityOptIn = formData.get('communityOptIn') === 'on';

  const supabase = await createSupabaseServerClient();
  let requiredStepRedirect: 'identity' | 'age-access' | null = null;

  try {
    await setPreferenceOptIns(supabase, user.id, {
      newsletterOptIn,
      communityOptIn,
    });

    const status = await getOnboardingStatus(supabase, user.id);
    const canComplete = hasRequiredOnboardingFields(status);

    if (!canComplete) {
      requiredStepRedirect = resolveRequiredStepForStatus(status);
      return;
    }

    await markOnboardingComplete(supabase, user.id);
  } catch {
    redirect('/onboarding?step=opt-ins&error=finish');
  }

  if (requiredStepRedirect) {
    redirect(`/onboarding?step=${requiredStepRedirect}&error=required`);
  }

  redirect('/vault');
}
