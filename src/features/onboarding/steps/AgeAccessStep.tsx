export function AgeAccessStep({
  defaultBirthDate,
  defaultAdultContentEnabled,
  action,
  errorCode,
}: {
  defaultBirthDate: string;
  defaultAdultContentEnabled: boolean;
  action: (formData: FormData) => Promise<void>;
  errorCode?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-foreground">Umur dan akses</h2>
        <p className="mt-2 text-sm text-muted-foreground">Atur tanggal lahir dan preferensi konten dewasa.</p>
      </div>

      {errorCode === 'birth-date' || errorCode === 'required' ? (
        <p className="rounded-[var(--radius-sm)] border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200">
          Masukkan tanggal lahir yang valid dan sudah lewat.
        </p>
      ) : null}

      <div>
        <label htmlFor="birthDate" className="block text-xs font-black uppercase tracking-[0.16em] text-foreground">
          Tanggal lahir
        </label>
        <input
          id="birthDate"
          name="birthDate"
          type="date"
          required
          defaultValue={defaultBirthDate}
          max={new Date().toISOString().slice(0, 10)}
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[color:var(--accent-strong)]"
        />
      </div>

      <label className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 p-3">
        <input
          id="adultContentEnabled"
          name="adultContentEnabled"
          type="checkbox"
          defaultChecked={defaultAdultContentEnabled}
          className="mt-0.5 h-4 w-4 rounded border-border-subtle bg-surface-1"
        />
        <span className="text-sm text-foreground">
          Saya sudah 21+ dan ingin mengaktifkan konten dewasa di katalog biasa.
        </span>
      </label>

      <button
        type="submit"
        className="w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-elevated px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-surface-1"
      >
        Lanjut
      </button>
    </form>
  );
}
