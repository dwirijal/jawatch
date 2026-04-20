import type { OnboardingStatus } from '@/lib/onboarding/types';
import {
  saveAgeAccessStep,
  saveIdentityStep,
  saveMediaPreferences,
  saveOptInsAndFinishOnboarding,
  saveTasteSeeds,
} from './actions';
import { AgeAccessStep } from './steps/AgeAccessStep';
import { IdentityStep } from './steps/IdentityStep';
import { MediaPreferencesStep } from './steps/MediaPreferencesStep';
import { OptInsStep } from './steps/OptInsStep';
import { TasteSeedsStep } from './steps/TasteSeedsStep';

const STEP_ORDER = ['identity', 'age-access', 'media', 'taste', 'opt-ins'] as const;

type OnboardingStepId = (typeof STEP_ORDER)[number];

const OPTIONAL_STEPS = new Set<OnboardingStepId>(['media', 'taste']);

function normalizeStepId(value: string | undefined): OnboardingStepId | null {
  if (!value) {
    return null;
  }

  return STEP_ORDER.includes(value as OnboardingStepId) ? (value as OnboardingStepId) : null;
}

function resolveStepFromStatus(status: OnboardingStatus): OnboardingStepId {
  if (!status.displayName) {
    return 'identity';
  }

  if (!status.birthDate || !status.adultChoiceSaved) {
    return 'age-access';
  }

  return 'opt-ins';
}

function resolveAllowedSteps(status: OnboardingStatus): OnboardingStepId[] {
  if (!status.displayName) {
    return ['identity'];
  }

  if (!status.birthDate || !status.adultChoiceSaved) {
    return ['identity', 'age-access'];
  }

  return [...STEP_ORDER];
}

function toTitleSeedText(status: OnboardingStatus): string {
  return status.titleSeeds.map((seed) => seed.title).join('\n');
}

export function OnboardingWizard({
  status,
  stepParam,
  errorCode,
}: {
  status: OnboardingStatus;
  stepParam?: string;
  errorCode?: string;
}) {
  const stepFromQuery = normalizeStepId(stepParam);
  const allowedSteps = resolveAllowedSteps(status);
  const defaultStep = resolveStepFromStatus(status);
  const currentStep =
    stepFromQuery && allowedSteps.includes(stepFromQuery)
      ? stepFromQuery
      : allowedSteps.includes(defaultStep)
        ? defaultStep
        : allowedSteps[0];
  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const progressPercent = Math.round(((stepIndex + 1) / STEP_ORDER.length) * 100);

  return (
    <section className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
          Langkah {stepIndex + 1} dari {STEP_ORDER.length}
        </p>
        {OPTIONAL_STEPS.has(currentStep) ? (
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Opsional</p>
        ) : (
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Wajib</p>
        )}
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-[var(--accent-strong)] transition-all" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="mt-6">
        {currentStep === 'identity' ? (
          <IdentityStep
            defaultDisplayName={status.displayName ?? ''}
            action={saveIdentityStep}
            errorCode={errorCode}
          />
        ) : null}

        {currentStep === 'age-access' ? (
          <AgeAccessStep
            defaultBirthDate={status.birthDate ?? ''}
            defaultAdultContentEnabled={status.adultContentEnabled}
            action={saveAgeAccessStep}
            errorCode={errorCode}
          />
        ) : null}

        {currentStep === 'media' ? (
          <MediaPreferencesStep
            defaultMediaTypes={status.mediaTypes}
            action={saveMediaPreferences}
            skipHref="/onboarding?step=taste"
            errorCode={errorCode}
          />
        ) : null}

        {currentStep === 'taste' ? (
          <TasteSeedsStep
            defaultGenreKeys={status.genreKeys.join(', ')}
            defaultFavoriteTitles={toTitleSeedText(status)}
            action={saveTasteSeeds}
            skipHref="/onboarding?step=opt-ins"
            errorCode={errorCode}
          />
        ) : null}

        {currentStep === 'opt-ins' ? (
          <OptInsStep
            defaultNewsletterOptIn={status.newsletterOptIn}
            defaultCommunityOptIn={status.communityOptIn}
            action={saveOptInsAndFinishOnboarding}
            errorCode={errorCode}
          />
        ) : null}
      </div>
    </section>
  );
}
