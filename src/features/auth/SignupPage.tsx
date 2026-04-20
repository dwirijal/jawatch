import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { normalizeVaultAwareNextPath } from '@/lib/auth/next-path';
import { AuthPageShell, type AuthStatusNotice } from '@/features/auth/AuthPageShell';
import { signUpWithOAuth, signUpWithPassword } from '@/features/auth/actions';

type AuthRoutePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function SignupPage({ searchParams }: AuthRoutePageProps) {
  const resolvedSearchParams = await searchParams;
  const rawNext = resolvedSearchParams.next;
  const rawError = resolvedSearchParams.error;

  const nextPath = normalizeVaultAwareNextPath(typeof rawNext === 'string' ? rawNext : undefined);
  const errorCode = typeof rawError === 'string' ? rawError : '';
  const notices: AuthStatusNotice[] = [];

  if (errorCode) {
    notices.push({
      tone: 'error',
      message: 'Daftar belum berhasil. Cek data kamu lalu coba lagi.',
    });
  }

  return (
    <AuthPageShell
      mode="signup"
      kicker="Buat koleksi kamu"
      title="Daftar Jawatch"
      description="Gunakan Google, Discord, atau email dan password untuk mulai pakai jawatch."
      notices={notices}
      googleAction={signUpWithOAuth.bind(null, 'google', nextPath)}
      discordAction={signUpWithOAuth.bind(null, 'discord', nextPath)}
      primaryFooterHref={`/login?next=${encodeURIComponent(nextPath)}`}
      primaryFooterLabel="Sudah punya akun?"
      secondaryFooterHref={`/forgot-password?next=${encodeURIComponent(nextPath)}`}
      secondaryFooterLabel="Butuh link reset?"
    >
      <form action={signUpWithPassword} className="surface-panel space-y-4 p-4 sm:p-5">
        <input type="hidden" name="next" value={nextPath} />
        <div className="space-y-1">
          <label htmlFor="displayName" className="type-kicker block">
            Detail akun
          </label>
          <p className="text-sm text-muted-foreground">Gunakan password minimal 8 karakter.</p>
        </div>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="nickname"
          placeholder="Nama tampilan"
          variant="auth"
          className="h-12"
        />
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
          autoComplete="new-password"
          placeholder="Buat password"
          variant="auth"
          className="h-12"
        />
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Ulangi password"
          variant="auth"
          className="h-12"
        />
        <Button type="submit" variant="primary" className="w-full text-[11px] uppercase tracking-[0.16em]">
          Buat akun
        </Button>
      </form>
    </AuthPageShell>
  );
}
