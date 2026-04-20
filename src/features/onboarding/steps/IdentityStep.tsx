export function IdentityStep({
  defaultDisplayName,
  action,
  errorCode,
}: {
  defaultDisplayName: string;
  action: (formData: FormData) => Promise<void>;
  errorCode?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-foreground">Identitas</h2>
        <p className="mt-2 text-sm text-muted-foreground">Atur nama yang tampil di jawatch.</p>
      </div>

      {errorCode === 'display-name' || errorCode === 'required' ? (
        <p className="rounded-[var(--radius-sm)] border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200">
          Nama tampilan wajib diisi sebelum onboarding selesai.
        </p>
      ) : null}

      <div>
        <label htmlFor="displayName" className="block text-xs font-black uppercase tracking-[0.16em] text-foreground">
          Nama tampilan
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          autoComplete="nickname"
          defaultValue={defaultDisplayName}
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[color:var(--accent-strong)]"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-elevated px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-surface-1"
      >
        Lanjut
      </button>
    </form>
  );
}
