import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Link } from '@/components/atoms/Link';
import { requireCompletedOnboarding } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/platform/supabase/server';
import { getProfileAdultFields } from '@/lib/auth/profile';
import { getAdultAccessState } from '@/lib/auth/adult-access';
import { getOrCreateUserPreferences, setUserPreferencesProfile } from '@/lib/server/user-preferences';

export const metadata: Metadata = {
  title: 'Profil Koleksi',
  description: 'Profil dan pengaturan akses untuk koleksi jawatch kamu.',
  robots: {
    index: false,
    follow: false,
  },
};

function normalizePreferenceValue(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

async function saveVaultProfilePreferences(formData: FormData) {
  'use server';

  const user = await requireCompletedOnboarding('/vault/profile');
  const theme = normalizePreferenceValue(formData.get('theme'));
  const subtitleLocale = normalizePreferenceValue(formData.get('subtitleLocale'));
  const supabase = await createSupabaseServerClient();

  await setUserPreferencesProfile(supabase, user.id, {
    theme,
    subtitleLocale,
  });

  redirect('/vault/profile?saved=1');
}

export default async function VaultProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>;
}) {
  const user = await requireCompletedOnboarding('/vault/profile');
  const params = searchParams ? await searchParams : undefined;
  const saved = params?.saved === '1';
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
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-400">Koleksi</p>
            <h1 className="font-[var(--font-heading)] text-4xl tracking-tight text-zinc-900">Profil</h1>
            <p className="max-w-2xl text-sm leading-6 text-zinc-500">
              Identitas dan pengaturan akses akun kamu ada di sini.
            </p>
          </div>

          {saved ? (
            <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--theme-movie-border)] bg-[var(--theme-movie-surface)] px-4 py-3 text-sm font-medium text-[var(--theme-movie-text)]">
              Preferensi profil berhasil diperbarui.
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="surface-panel-elevated p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-900">Identitas</h2>
            <dl className="mt-4 space-y-3 text-sm text-zinc-500">
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">Nama tampilan</dt>
                <dd className="font-semibold text-zinc-900">{user.displayName}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">Email</dt>
                <dd className="font-semibold text-zinc-900">{user.email ?? 'Belum tersedia'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">Provider</dt>
                <dd className="font-semibold text-zinc-900">{user.provider ?? 'Supabase'}</dd>
              </div>
            </dl>
          </div>

          <div className="surface-panel-elevated p-6">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-900">Akses</h2>
            <dl className="mt-4 space-y-3 text-sm text-zinc-500">
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">Tanggal lahir</dt>
                <dd className="font-semibold text-zinc-900">{profileAdultFields?.birthDate ?? 'Belum diatur'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">Umur</dt>
                <dd className="font-semibold text-zinc-900">{accessState.age !== null ? `${accessState.age} tahun` : 'Belum diatur'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">Konten dewasa</dt>
                <dd className="font-semibold text-zinc-900">{accessState.adultContentEnabled ? 'Aktif' : 'Nonaktif'}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="uppercase tracking-[0.18em] text-zinc-400">Akses NSFW</dt>
                <dd className="font-semibold text-zinc-900">{accessState.canAccessNsfw ? 'Diizinkan' : 'Diblokir'}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <Link
                href="/account/age"
                className="inline-flex items-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-900 transition-colors hover:bg-surface-elevated"
              >
                Atur umur dan akses
              </Link>
            </div>
          </div>
        </section>

        <section className="surface-panel-elevated p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-900">Preferensi</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                Tema dan bahasa disimpan di sini. Kontrol cepat pemutar dan reader tetap lokal di browser ini.
              </p>
            </div>

            <Link
              href="/account/age"
              className="inline-flex items-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-zinc-900 transition-colors hover:bg-surface-elevated"
            >
              NSFW dan akses umur
            </Link>
          </div>

          <form action={saveVaultProfilePreferences} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-zinc-500">
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-zinc-400">Tema</span>
              <select
                name="theme"
                defaultValue={preferences.theme ?? ''}
                className="h-11 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-3 text-sm text-zinc-900"
              >
                <option value="">Ikuti sistem</option>
                <option value="light">Terang</option>
                <option value="dark">Gelap</option>
              </select>
            </label>

            <label className="space-y-2 text-sm text-zinc-500">
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-zinc-400">Bahasa subtitle</span>
              <select
                name="subtitleLocale"
                defaultValue={preferences.subtitleLocale ?? ''}
                className="h-11 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-3 text-sm text-zinc-900"
              >
                <option value="">Ikuti sumber</option>
                <option value="id-ID">Bahasa Indonesia</option>
                <option value="en-US">English</option>
                <option value="original">Asli</option>
              </select>
            </label>

            <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">Pemutar</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Pilihan sumber, kontrol reader, dan penyesuaian pemutar tetap lokal di sesi browser ini.
              </p>
            </div>

            <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">Nilai tersimpan</p>
              <p className="mt-2 text-sm text-zinc-500">Tema: <span className="font-semibold text-zinc-900">{preferences.theme ?? 'Ikuti sistem'}</span></p>
              <p className="mt-1 text-sm text-zinc-500">Bahasa subtitle: <span className="font-semibold text-zinc-900">{preferences.subtitleLocale ?? 'Ikuti sumber'}</span></p>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-[var(--radius-sm)] border border-border-subtle bg-zinc-900 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-zinc-700"
              >
                Simpan preferensi
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
