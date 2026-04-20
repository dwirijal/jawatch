import { KeyRound } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { normalizeVaultAwareNextPath } from '@/lib/auth/next-path';
import { AuthPageShell, type AuthStatusNotice } from '@/features/auth/AuthPageShell';
import { signInWithOAuth, signInWithPassword } from '@/features/auth/actions';

type AuthRoutePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function LoginPage({ searchParams }: AuthRoutePageProps) {
  const resolvedSearchParams = await searchParams;
  const rawNext = resolvedSearchParams.next;
  const rawError = resolvedSearchParams.error;
  const rawCreated = resolvedSearchParams.created;
  const rawReset = resolvedSearchParams.password_reset;

  const nextPath = normalizeVaultAwareNextPath(typeof rawNext === 'string' ? rawNext : undefined);
  const errorCode = typeof rawError === 'string' ? rawError : '';
  const created = rawCreated === '1';
  const passwordReset = rawReset === '1';
  const notices: AuthStatusNotice[] = [];

  if (errorCode) {
    notices.push({
      tone: 'error',
      message: 'Login belum berhasil. Coba lagi sebentar.',
    });
  }

  if (created) {
    notices.push({
      tone: 'success',
      message: 'Akun berhasil dibuat. Lanjut pakai password atau konfirmasi email dulu.',
    });
  }

  if (passwordReset) {
    notices.push({
      tone: 'success',
      message: 'Password berhasil diperbarui. Kamu bisa masuk dengan password baru.',
    });
  }

  return (
    <AuthPageShell
      mode="login"
      kicker="Lanjut ke koleksi"
      title="Login Jawatch"
      description="Gunakan Google, Discord, atau email dan password untuk melanjutkan sesi kamu."
      notices={notices}
      googleAction={signInWithOAuth.bind(null, 'google', nextPath)}
      discordAction={signInWithOAuth.bind(null, 'discord', nextPath)}
      primaryFooterHref={`/signup?next=${encodeURIComponent(nextPath)}`}
      primaryFooterLabel="Buat akun"
      secondaryFooterHref={`/forgot-password?next=${encodeURIComponent(nextPath)}`}
      secondaryFooterLabel="Lupa password?"
    >
      <form action={signInWithPassword} className="surface-panel space-y-4 p-4 sm:p-5">
        <input type="hidden" name="next" value={nextPath} />
        <div className="space-y-1">
          <label htmlFor="email" className="type-kicker block">
            Email + Password
          </label>
          <p className="text-sm text-muted-foreground">Masuk langsung tanpa magic link.</p>
        </div>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="nama@email.com"
          variant="auth"
          className="h-12"
        />
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password kamu"
          variant="auth"
          className="h-12"
        />
        <Button type="submit" variant="primary" className="w-full gap-2 text-[10px] uppercase tracking-[0.08em] sm:gap-3 sm:text-[11px] sm:tracking-[0.16em]">
          <KeyRound className="h-4 w-4" />
          <span className="sm:hidden">Pakai password</span>
          <span className="hidden sm:inline">Lanjut dengan password</span>
        </Button>
      </form>
    </AuthPageShell>
  );
}
