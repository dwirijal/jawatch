import { ONBOARDING_MEDIA_TYPES, type OnboardingMediaType } from '@/lib/onboarding/types';

function formatMediaTypeLabel(mediaType: OnboardingMediaType): string {
  if (mediaType === 'movies') {
    return 'Film';
  }
  if (mediaType === 'comic') {
    return 'Komik';
  }

  return mediaType.replace('-', ' ').replace(/\b\w/g, (token) => token.toUpperCase());
}

export function MediaPreferencesStep({
  defaultMediaTypes,
  action,
  skipHref,
  errorCode,
}: {
  defaultMediaTypes: OnboardingMediaType[];
  action: (formData: FormData) => Promise<void>;
  skipHref: string;
  errorCode?: string;
}) {
  const selectedTypes = new Set<OnboardingMediaType>(defaultMediaTypes);

  return (
    <form action={action} className="space-y-4">
      <div>
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-foreground">Preferensi konten</h2>
        <p className="mt-2 text-sm text-muted-foreground">Pilih jenis konten yang mau kamu prioritaskan.</p>
      </div>

      {errorCode === 'media' ? (
        <p className="rounded-[var(--radius-sm)] border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200">
          Preferensi konten belum bisa disimpan. Coba lagi.
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {ONBOARDING_MEDIA_TYPES.map((mediaType) => (
          <label
            key={mediaType}
            className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-3 py-2"
          >
            <input
              type="checkbox"
              name="mediaTypes"
              value={mediaType}
              defaultChecked={selectedTypes.has(mediaType)}
              className="h-4 w-4 rounded border-border-subtle bg-surface-1"
            />
            <span className="text-sm text-foreground">{formatMediaTypeLabel(mediaType)}</span>
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-elevated px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-surface-1"
        >
          Lanjut
        </button>
        <a
          href={skipHref}
          className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-4 py-3 text-center text-sm font-black uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-surface-elevated"
        >
          Lewati dulu
        </a>
      </div>
    </form>
  );
}
