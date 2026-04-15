import type { Metadata } from 'next';
import { Link } from '@/components/atoms/Link';
import { requireCompletedOnboarding } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getProfileAdultFields } from '@/lib/auth/profile';
import { getAdultAccessState } from '@/lib/auth/adult-access';
import { getOrCreateUserPreferences } from '@/lib/server/user-preferences';

export const metadata: Metadata = {
  title: 'Vault Profile',
  description: 'Profile and access settings for your Vault on jawatch.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function VaultProfilePage() {
  const user = await requireCompletedOnboarding('/vault/profile');
  const supabase = await createSupabaseServerClient();

  const [profileAdultFields, preferences] = await Promise.all([
    getProfileAdultFields(supabase, user.id),
    getOrCreateUserPreferences(supabase, user.id),
  ]);

  const accessState = getAdultAccessState({
    birthDate: profileAdultFields?.birthDate ?? null,
    adultContentEnabled: preferences.adultContentEnabled,
  });

  return (
    <main className="app-shell">
      <div className="app-container space-y-8 py-4 sm:py-6">
        <section className="surface-panel-elevated p-6 sm:p-8">
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-400">Vault</p>
            <h1 className="font-[var(--font-heading)] text-4xl tracking-tight text-zinc-900">Profile</h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-500">
              Identity and access settings for this account live here.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="surface-panel-elevated p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-900">Identity</h2>
            <dl className="mt-4 space-y-3 text-sm text-zinc-500">
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">Display Name</dt>
                <dd className="font-semibold text-zinc-900">{user.displayName}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">Email</dt>
                <dd className="font-semibold text-zinc-900">{user.email ?? 'Unavailable'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">Provider</dt>
                <dd className="font-semibold text-zinc-900">{user.provider ?? 'Supabase'}</dd>
              </div>
            </dl>
          </div>

          <div className="surface-panel-elevated p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-900">Access</h2>
            <dl className="mt-4 space-y-3 text-sm text-zinc-500">
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">Birth Date</dt>
                <dd className="font-semibold text-zinc-900">{profileAdultFields?.birthDate ?? 'Not set'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">Age</dt>
                <dd className="font-semibold text-zinc-900">{accessState.age !== null ? `${accessState.age} years` : 'Not set'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">Adult Content</dt>
                <dd className="font-semibold text-zinc-900">{accessState.adultContentEnabled ? 'Enabled' : 'Disabled'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">NSFW Access</dt>
                <dd className="font-semibold text-zinc-900">{accessState.canAccessNsfw ? 'Allowed' : 'Blocked'}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <Link
                href="/account/age"
                className="inline-flex items-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-900 transition-colors hover:bg-surface-elevated"
              >
                Manage age and access
              </Link>
            </div>
          </div>
        </section>

        <section className="surface-panel-elevated p-6">
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-900">Preferences</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            Theme, language, and other future Vault preferences will surface here.
          </p>
        </section>
      </div>
    </main>
  );
}
