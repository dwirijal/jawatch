import { redirect } from 'next/navigation';
import { getAdultAccessState } from '@/lib/auth/adult-access';
import { requireCompletedOnboarding } from '@/lib/auth/session';
import { getProfileAdultFields, setProfileAdultFields } from '@/lib/auth/profile';
import { getOrCreateUserPreferences, setAdultContentEnabled } from '@/lib/server/user-preferences';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function sanitizeBirthDateInput(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (parsed.getTime() > Date.now()) {
    return null;
  }

  return trimmed;
}

async function saveAdultAccessSettings(formData: FormData) {
  'use server';

  const user = await requireCompletedOnboarding('/account/age');
  const birthDate = sanitizeBirthDateInput(formData.get('birthDate'));
  const adultContentEnabled = formData.get('adultContentEnabled') === 'on';

  if (!birthDate) {
    redirect('/account/age?error=birth-date');
  }

  const supabase = await createSupabaseServerClient();
  await setProfileAdultFields(supabase, {
    userId: user.id,
    birthDate,
  });
  await setAdultContentEnabled(supabase, user.id, adultContentEnabled);

  redirect('/account/age?saved=1');
}

export default async function AccountAgePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireCompletedOnboarding('/account/age');
  const supabase = await createSupabaseServerClient();
  const [profileAdultFields, preferences] = await Promise.all([
    getProfileAdultFields(supabase, user.id),
    getOrCreateUserPreferences(supabase, user.id),
  ]);

  const accessState = getAdultAccessState({
    birthDate: profileAdultFields?.birthDate ?? null,
    adultContentEnabled: preferences.adultContentEnabled,
  });

  const resolvedSearchParams = await searchParams;
  const errorCode = typeof resolvedSearchParams.error === 'string' ? resolvedSearchParams.error : '';
  const saved = resolvedSearchParams.saved === '1';

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <section className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-6">
        <h1 className="text-xl font-black uppercase tracking-[0.16em] text-white">Age And Adult Access</h1>
        <p className="mt-2 text-sm text-zinc-400">
          NSFW content on movies, series, and comic is available only when age is 21+ and adult access is enabled.
        </p>
      </section>

      {errorCode ? (
        <section className="rounded-[var(--radius-sm)] border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          Invalid birth date. Use a valid date in the past.
        </section>
      ) : null}

      {saved ? (
        <section className="rounded-[var(--radius-sm)] border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Adult access settings updated.
        </section>
      ) : null}

      <section className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-6">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-200">Current Status</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Age:{' '}
          <span className="font-semibold text-white">
            {accessState.age !== null ? `${accessState.age} years` : 'Not set'}
          </span>
        </p>
        <p className="mt-1 text-sm text-zinc-300">
          Adult preference:{' '}
          <span className="font-semibold text-white">{accessState.adultContentEnabled ? 'Enabled' : 'Disabled'}</span>
        </p>
        <p className="mt-1 text-sm text-zinc-300">
          NSFW access:{' '}
          <span className="font-semibold text-white">{accessState.canAccessNsfw ? 'Allowed' : 'Blocked'}</span>
        </p>
      </section>

      <form action={saveAdultAccessSettings} className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-6">
        <label htmlFor="birthDate" className="block text-xs font-black uppercase tracking-[0.16em] text-zinc-300">
          Birth Date
        </label>
        <input
          id="birthDate"
          name="birthDate"
          type="date"
          required
          defaultValue={profileAdultFields?.birthDate ?? ''}
          max={new Date().toISOString().slice(0, 10)}
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 transition-colors focus:border-zinc-300"
        />

        <label className="mt-4 flex items-start gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 p-3">
          <input
            id="adultContentEnabled"
            name="adultContentEnabled"
            type="checkbox"
            defaultChecked={preferences.adultContentEnabled}
            className="mt-0.5 h-4 w-4 rounded border-border-subtle bg-surface-1"
          />
          <span className="text-sm text-zinc-300">
            I am 21+ and I want to enable adult content in normal catalog routes.
          </span>
        </label>

        <button
          type="submit"
          className="mt-4 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-elevated px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-zinc-700"
        >
          Save Settings
        </button>
      </form>
    </main>
  );
}
