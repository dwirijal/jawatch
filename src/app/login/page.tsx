import { BookOpenText, Film, Sparkles, Tv2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { ThemeToggle } from '@/components/molecules/ThemeToggle';
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

function StatusNotice({
  tone,
  message,
}: {
  tone: 'error' | 'success';
  message: string;
}) {
  const toneStyle =
    tone === 'error'
      ? {
          borderColor: 'var(--theme-donghua-border)',
          background: 'var(--theme-donghua-surface)',
          color: 'var(--theme-donghua-text)',
        }
      : {
          borderColor: 'var(--theme-movie-border)',
          background: 'var(--theme-movie-surface)',
          color: 'var(--theme-movie-text)',
        };

  return (
    <div className="rounded-[var(--radius-md)] border px-4 py-3 text-sm font-medium" style={toneStyle}>
      {message}
    </div>
  );
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
    <main className="app-shell">
      <div className="app-container-wide py-4 sm:py-6 lg:py-8">
        <div className="mb-4 flex justify-end sm:mb-5">
          <ThemeToggle compact />
        </div>

        <section className="surface-panel-elevated grid gap-4 p-3 sm:gap-5 sm:p-4 lg:grid-cols-[minmax(0,1.18fr)_minmax(21rem,25rem)] lg:gap-6 lg:p-6">
          <div className="order-2 relative overflow-hidden rounded-[var(--radius-xl)] border border-white/8 bg-[linear-gradient(160deg,rgba(16,18,24,0.98)_0%,rgba(24,18,14,0.95)_56%,rgba(42,29,18,0.92)_100%)] p-5 text-white shadow-[0_28px_80px_-40px_rgba(0,0,0,0.72)] sm:p-6 lg:order-1 lg:p-7">
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_62%)]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(circle_at_bottom_right,rgba(209,168,111,0.24),transparent_55%)]" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-6 lg:gap-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="solid" className="text-[10px]">Jawatch access</Badge>
                  <Badge variant="outline" className="border-white/18 bg-white/8 text-white">Watch first</Badge>
                  <Badge variant="outline" className="border-white/18 bg-white/8 text-white">Read comfortably</Badge>
                </div>

                <div className="space-y-3">
                  <h1 className="max-w-[11ch] font-[var(--font-heading)] text-[clamp(2.4rem,10vw,4.8rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
                    One premium hub for watch and read sessions.
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-zinc-100 sm:text-base">
                    Masuk ke Jawatch untuk lanjutkan anime, series, movies, dan comics dalam satu shell yang lebih rapi,
                    lebih cepat, dan tetap tenang dipakai pada desktop, tablet, dan mobile.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[var(--radius-md)] border border-white/12 bg-white/6 p-3 backdrop-blur">
                  <Film className="h-5 w-5 text-white" />
                  <p className="mt-3 text-sm font-bold text-white">Movies</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-200">Premium catalog blocks, quick resume, and cleaner play entry.</p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-white/12 bg-white/6 p-3 backdrop-blur">
                  <Tv2 className="h-5 w-5 text-white" />
                  <p className="mt-3 text-sm font-bold text-white">Series</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-200">Episode navigation tetap dekat ke player untuk binge yang panjang.</p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-white/12 bg-white/6 p-3 backdrop-blur">
                  <BookOpenText className="h-5 w-5 text-white" />
                  <p className="mt-3 text-sm font-bold text-white">Comics</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-200">Reader-first flow untuk manga, manhwa, dan manhua.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 flex flex-col gap-4 lg:order-2">
            <div className="space-y-2">
              <p className="type-kicker">Continue to your vault</p>
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Login Jawatch
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Gunakan Google, Discord, atau magic link email untuk melanjutkan sesi Anda.
              </p>
            </div>

            {errorCode ? (
              <StatusNotice tone="error" message="Authentication failed. Please try again." />
            ) : null}

            {sent ? (
              <StatusNotice tone="success" message="Magic link sent. Check your email inbox." />
            ) : null}

            <div className="grid gap-3">
              <form action={signInWithOAuth.bind(null, 'google', nextPath)} className="contents">
                <Button type="submit" variant="primary" className="w-full justify-center gap-3 text-[11px] uppercase tracking-[0.16em]">
                  <Sparkles className="h-4 w-4" />
                  Continue with Google
                </Button>
              </form>

              <form action={signInWithOAuth.bind(null, 'discord', nextPath)} className="contents">
                <Button type="submit" variant="secondary" className="w-full justify-center gap-3 text-[11px] uppercase tracking-[0.16em]">
                  <Sparkles className="h-4 w-4" />
                  Continue with Discord
                </Button>
              </form>
            </div>

            <form action={signInWithMagicLink} className="surface-panel space-y-4 p-4 sm:p-5">
              <input type="hidden" name="next" value={nextPath} />
              <div className="space-y-1">
                <label htmlFor="email" className="type-kicker block">
                  Email Magic Link
                </label>
                <p className="text-sm text-muted-foreground">Masukkan email untuk menerima tautan login cepat.</p>
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                variant="auth"
                className="h-12"
              />
              <Button type="submit" variant="primary" className="w-full text-[11px] uppercase tracking-[0.16em]">
                Send magic link
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
