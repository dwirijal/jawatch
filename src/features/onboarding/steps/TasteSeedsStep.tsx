export function TasteSeedsStep({
  defaultGenreKeys,
  defaultFavoriteTitles,
  action,
  skipHref,
  errorCode,
}: {
  defaultGenreKeys: string;
  defaultFavoriteTitles: string;
  action: (formData: FormData) => Promise<void>;
  skipHref: string;
  errorCode?: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <div>
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-foreground">Selera awal</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tambahkan beberapa genre dan judul favorit supaya rekomendasi lebih pas.
        </p>
      </div>

      {errorCode === 'taste' ? (
        <p className="rounded-[var(--radius-sm)] border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200">
          Preferensi selera belum bisa disimpan. Coba lagi.
        </p>
      ) : null}

      <div>
        <label htmlFor="genreKeys" className="block text-xs font-black uppercase tracking-[0.16em] text-foreground">
          Genre (pisahkan dengan koma)
        </label>
        <input
          id="genreKeys"
          name="genreKeys"
          type="text"
          defaultValue={defaultGenreKeys}
          placeholder="action, thriller, romance"
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[color:var(--accent-strong)]"
        />
      </div>

      <div>
        <label
          htmlFor="favoriteTitles"
          className="block text-xs font-black uppercase tracking-[0.16em] text-foreground"
        >
          Judul favorit (satu per baris)
        </label>
        <textarea
          id="favoriteTitles"
          name="favoriteTitles"
          rows={5}
          defaultValue={defaultFavoriteTitles}
          placeholder={'The Godfather\nBreaking Bad\nSolo Leveling'}
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-[color:var(--accent-strong)]"
        />
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
