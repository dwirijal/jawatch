import { redirect } from 'next/navigation';
import { normalizeVaultAwareNextPath } from '@/lib/auth/next-path';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function resolveAppOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim() || 'https://jawatch.web.id';
}

function buildAuthCallbackUrl(nextPath: string): string {
  const callbackUrl = new URL('/auth/callback', resolveAppOrigin());
  callbackUrl.searchParams.set('next', normalizeVaultAwareNextPath(nextPath));
  return callbackUrl.toString();
}

async function signInWithOAuth(provider: 'google' | 'discord', nextPath: string) {
  'use server';

  const supabase = await createSupabaseServerClient();
  const redirectTo = buildAuthCallbackUrl(nextPath);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error || !data.url) {
    redirect(`/login?next=${encodeURIComponent(normalizeVaultAwareNextPath(nextPath))}&error=oauth`);
  }

  redirect(data.url);
}

async function signInWithMagicLink(formData: FormData) {
  'use server';

  const emailValue = formData.get('email');
  const nextValue = formData.get('next');
  const email = typeof emailValue === 'string' ? emailValue.trim() : '';
  const nextPath = normalizeVaultAwareNextPath(typeof nextValue === 'string' ? nextValue : undefined);

  if (!email) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}&error=email`);
  }

  const supabase = await createSupabaseServerClient();
  const redirectTo = buildAuthCallbackUrl(nextPath);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}&error=magic-link`);
  }

  redirect(`/login?next=${encodeURIComponent(nextPath)}&sent=1`);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawNext = resolvedSearchParams.next;
  const rawError = resolvedSearchParams.error;
  const rawSent = resolvedSearchParams.sent;

  const nextPath = normalizeVaultAwareNextPath(typeof rawNext === 'string' ? rawNext : undefined);
  const errorCode = typeof rawError === 'string' ? rawError : '';
  const sent = rawSent === '1';

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-12">
      <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-6">
        <h1 className="text-xl font-black uppercase tracking-[0.16em] text-white">Login Jawatch</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Login with Google, Discord, or request an email magic link to continue into your Vault.
        </p>
      </div>

      {errorCode ? (
        <div className="rounded-[var(--radius-sm)] border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          Authentication failed. Please try again.
        </div>
      ) : null}

      {sent ? (
        <div className="rounded-[var(--radius-sm)] border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Magic link sent. Check your email inbox.
        </div>
      ) : null}

      <form action={signInWithOAuth.bind(null, 'google', nextPath)} className="contents">
        <button
          type="submit"
          className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-surface-elevated"
        >
          Continue with Google
        </button>
      </form>

      <form action={signInWithOAuth.bind(null, 'discord', nextPath)} className="contents">
        <button
          type="submit"
          className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-surface-elevated"
        >
          Continue with Discord
        </button>
      </form>

      <form action={signInWithMagicLink} className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-6">
        <input type="hidden" name="next" value={nextPath} />
        <label htmlFor="email" className="block text-xs font-black uppercase tracking-[0.16em] text-zinc-300">
          Email Magic Link
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 transition-colors placeholder:text-zinc-500 focus:border-zinc-300"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-elevated px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-zinc-700"
        >
          Send Magic Link
        </button>
      </form>
    </main>
  );
}
