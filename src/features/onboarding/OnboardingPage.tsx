import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { getOnboardingStatus } from '@/lib/onboarding/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { OnboardingWizard } from './OnboardingWizard';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser('/onboarding');
  const supabase = await createSupabaseServerClient();
  const status = await getOnboardingStatus(supabase, user.id);

  if (status.complete) {
    redirect('/vault');
  }

  const resolvedSearchParams = await searchParams;
  const stepParam = typeof resolvedSearchParams.step === 'string' ? resolvedSearchParams.step : undefined;
  const errorCode = typeof resolvedSearchParams.error === 'string' ? resolvedSearchParams.error : undefined;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <section className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-6">
        <h1 className="text-xl font-black uppercase tracking-[0.16em] text-foreground">Welcome To Jawatch</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Finish a quick setup so we can personalize your catalog and access preferences.
        </p>
      </section>
      <OnboardingWizard status={status} stepParam={stepParam} errorCode={errorCode} />
    </main>
  );
}
