export function OptInsStep({
  defaultNewsletterOptIn,
  defaultCommunityOptIn,
  action,
  errorCode,
}: {
  defaultNewsletterOptIn: boolean;
  defaultCommunityOptIn: boolean;
  action: (formData: FormData) => Promise<void>;
  errorCode?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-zinc-200">Opt-Ins</h2>
        <p className="mt-2 text-sm text-zinc-400">Choose if you want updates from Jawatch.</p>
      </div>

      {errorCode === 'required' || errorCode === 'finish' ? (
        <p className="rounded-[var(--radius-sm)] border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200">
          Could not finish onboarding. Complete required steps and try again.
        </p>
      ) : null}

      <label className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 p-3">
        <input
          type="checkbox"
          id="newsletterOptIn"
          name="newsletterOptIn"
          defaultChecked={defaultNewsletterOptIn}
          className="mt-0.5 h-4 w-4 rounded border-border-subtle bg-surface-1"
        />
        <span className="text-sm text-zinc-300">Send me occasional product and release updates by email.</span>
      </label>

      <label className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 p-3">
        <input
          type="checkbox"
          id="communityOptIn"
          name="communityOptIn"
          defaultChecked={defaultCommunityOptIn}
          className="mt-0.5 h-4 w-4 rounded border-border-subtle bg-surface-1"
        />
        <span className="text-sm text-zinc-300">Allow community recommendations and trend highlights.</span>
      </label>

      <button
        type="submit"
        className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-elevated px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-zinc-700"
      >
        Finish Onboarding
      </button>
    </form>
  );
}
