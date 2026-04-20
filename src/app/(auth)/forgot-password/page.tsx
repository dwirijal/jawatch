import type { Metadata } from 'next';
import { Mail, ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Link } from '@/components/atoms/Link';
import { ThemeToggle } from '@/components/molecules/ThemeToggle';
import { buildPasswordRecoveryCallbackUrl } from '@/lib/auth/auth-flow';
import { normalizeVaultAwareNextPath } from '@/lib/auth/next-path';
import { createSupabaseServerClient } from '@/platform/supabase/server';

export const metadata: Metadata = {
  title: 'Forgot Password',
  robots: {
    index: false,
    follow: false,
  },
};

async function sendPasswordResetEmail(formData: FormData) {
  'use server';

  const emailValue = formData.get('email');
  const nextValue = formData.get('next');
  const email = typeof emailValue === 'string' ? emailValue.trim() : '';
  const nextPath = normalizeVaultAwareNextPath(typeof nextValue === 'string' ? nextValue : undefined);

  if (!email) {
    redirect(`/forgot-password?next=${encodeURIComponent(nextPath)}&error=email`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: buildPasswordRecoveryCallbackUrl(nextPath),
  });

  if (error) {
    redirect(`/forgot-password?next=${encodeURIComponent(nextPath)}&error=request`);
  }

  redirect(`/forgot-password?next=${encodeURIComponent(nextPath)}&sent=1`);
}

async function updateRecoveredPassword(formData: FormData) {
  'use server';

  const passwordValue = formData.get('password');
  const confirmValue = formData.get('confirmPassword');
  const nextValue = formData.get('next');
  const password = typeof passwordValue === 'string' ? passwordValue : '';
  const confirmPassword = typeof confirmValue === 'string' ? confirmValue : '';
  const nextPath = normalizeVaultAwareNextPath(typeof nextValue === 'string' ? nextValue : undefined);

  if (password.length < 8 || password !== confirmPassword) {
    redirect(`/forgot-password?mode=reset&next=${encodeURIComponent(nextPath)}&error=update`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/forgot-password?mode=reset&next=${encodeURIComponent(nextPath)}&error=update`);
  }

  redirect(`/login?next=${encodeURIComponent(nextPath)}&password_reset=1`);
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

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const rawNext = resolvedSearchParams.next;
  const rawError = resolvedSearchParams.error;
  const rawSent = resolvedSearchParams.sent;
  const rawMode = resolvedSearchParams.mode;

  const nextPath = normalizeVaultAwareNextPath(typeof rawNext === 'string' ? rawNext : undefined);
  const errorCode = typeof rawError === 'string' ? rawError : '';
  const sent = rawSent === '1';
  const mode = typeof rawMode === 'string' ? rawMode : '';
  const resetMode = mode === 'reset';
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const canUpdatePassword = Boolean(data.user);

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
                  <Badge variant="solid" className="text-[10px]">Recovery</Badge>
                  <Badge variant="outline" className="border-white/18 bg-white/8 text-white">Password route</Badge>
                  <Badge variant="outline" className="border-white/18 bg-white/8 text-white">Email verified</Badge>
                </div>

                <div className="space-y-3">
                  <h1 className="max-w-[11ch] font-[var(--font-heading)] text-[clamp(2.4rem,10vw,4.8rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
                    Reset access without leaving Jawatch.
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-zinc-100 sm:text-base">
                    Kirim tautan reset ke email Anda, lalu atur password baru untuk kembali ke vault, watch, dan read surfaces.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] border border-white/12 bg-white/6 p-3 backdrop-blur">
                  <Mail className="h-5 w-5 text-white" />
                  <p className="mt-3 text-sm font-bold text-white">Email recovery</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-200">One clean reset entrypoint for account access.</p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-white/12 bg-white/6 p-3 backdrop-blur">
                  <ShieldCheck className="h-5 w-5 text-white" />
                  <p className="mt-3 text-sm font-bold text-white">Secure return</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-200">After reset, login continues with your intended next path.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 flex flex-col gap-4 lg:order-2">
            <div className="space-y-2">
              <p className="type-kicker">{resetMode ? 'Set a new password' : 'Recover your account'}</p>
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                {resetMode ? 'Update Password' : 'Forgot Password'}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {resetMode
                  ? 'Choose a new password for this account.'
                  : 'Masukkan email akun Anda untuk menerima tautan reset password.'}
              </p>
            </div>

            {errorCode ? (
              <StatusNotice tone="error" message={resetMode ? 'Password update failed. Try again.' : 'Reset request failed. Try again.'} />
            ) : null}

            {sent ? (
              <StatusNotice tone="success" message="Recovery email sent. Open the link from your inbox to continue." />
            ) : null}

            {resetMode ? (
              canUpdatePassword ? (
                <form action={updateRecoveredPassword} className="surface-panel space-y-4 p-4 sm:p-5">
                  <input type="hidden" name="next" value={nextPath} />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="New password"
                    variant="auth"
                    className="h-12"
                  />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    variant="auth"
                    className="h-12"
                  />
                  <Button type="submit" variant="primary" className="w-full text-[11px] uppercase tracking-[0.16em]">
                    Save new password
                  </Button>
                </form>
              ) : (
                <div className="surface-panel space-y-3 p-4 sm:p-5">
                  <p className="text-sm leading-6 text-muted-foreground">
                    Recovery session not found. Open the latest recovery email link again, or request a new one.
                  </p>
                  <Button variant="primary" asChild className="w-full text-[11px] uppercase tracking-[0.16em]">
                    <Link href={`/forgot-password?next=${encodeURIComponent(nextPath)}`}>
                      Request a new reset link
                    </Link>
                  </Button>
                </div>
              )
            ) : (
              <form action={sendPasswordResetEmail} className="surface-panel space-y-4 p-4 sm:p-5">
                <input type="hidden" name="next" value={nextPath} />
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
                  Send reset email
                </Button>
              </form>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-foreground transition-colors hover:text-zinc-600">
                Back to login
              </Link>
              <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-foreground transition-colors hover:text-zinc-600">
                Need a new account?
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
