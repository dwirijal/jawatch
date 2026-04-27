export type BookCoverPalette = {
  background: string;
  glow: string;
  frameBorder: string;
  frameFill: string;
  spine: string;
  rule: string;
  text: string;
  eyebrow: string;
  subtitle: string;
  overlay: string;
};

const BOOK_COVER_PALETTES: BookCoverPalette[] = [
  {
    background: 'linear-gradient(160deg,var(--signal-warning) 0%,var(--signal-warning) 28%,var(--background) 100%)',
    glow: 'radial-gradient(circle_at_top,color-mix(in srgb,var(--signal-warning-surface) 18%,transparent),transparent 48%)',
    frameBorder: 'color-mix(in srgb,var(--signal-warning-surface) 18%,transparent)',
    frameFill: 'linear-gradient(180deg,color-mix(in srgb,var(--signal-warning-surface) 8%,transparent),color-mix(in srgb,var(--foreground) 2%,transparent))',
    spine: 'color-mix(in srgb,var(--signal-warning-surface) 16%,transparent)',
    rule: 'color-mix(in srgb,var(--signal-warning-surface) 18%,transparent)',
    text: 'var(--signal-warning-surface)',
    eyebrow: 'color-mix(in srgb,var(--signal-warning) 72%,transparent)',
    subtitle: 'color-mix(in srgb,var(--signal-warning-surface) 76%,transparent)',
    overlay: 'linear-gradient(to_top,color-mix(in srgb,var(--background) 54%,transparent) 0%,color-mix(in srgb,var(--background) 14%,transparent) 34%,transparent 100%)',
  },
  {
    background: 'linear-gradient(165deg,var(--signal-info) 0%,var(--signal-info) 34%,var(--background) 100%)',
    glow: 'radial-gradient(circle_at_top,color-mix(in srgb,var(--signal-info-surface) 20%,transparent),transparent 50%)',
    frameBorder: 'color-mix(in srgb,var(--signal-info-surface) 16%,transparent)',
    frameFill: 'linear-gradient(180deg,color-mix(in srgb,var(--signal-info-surface) 8%,transparent),color-mix(in srgb,var(--foreground) 2%,transparent))',
    spine: 'color-mix(in srgb,var(--signal-info-surface) 14%,transparent)',
    rule: 'color-mix(in srgb,var(--signal-info-surface) 16%,transparent)',
    text: 'var(--signal-info-surface)',
    eyebrow: 'color-mix(in srgb,var(--signal-info) 74%,transparent)',
    subtitle: 'color-mix(in srgb,var(--signal-info-surface) 74%,transparent)',
    overlay: 'linear-gradient(to_top,color-mix(in srgb,var(--background) 48%,transparent) 0%,color-mix(in srgb,var(--background) 12%,transparent) 36%,transparent 100%)',
  },
  {
    background: 'linear-gradient(160deg,var(--accent) 0%,var(--accent-strong) 30%,var(--background) 100%)',
    glow: 'radial-gradient(circle_at_top,color-mix(in srgb,var(--accent-soft) 18%,transparent),transparent 48%)',
    frameBorder: 'color-mix(in srgb,var(--accent-soft) 16%,transparent)',
    frameFill: 'linear-gradient(180deg,color-mix(in srgb,var(--accent-soft) 8%,transparent),color-mix(in srgb,var(--foreground) 2%,transparent))',
    spine: 'color-mix(in srgb,var(--accent-soft) 14%,transparent)',
    rule: 'color-mix(in srgb,var(--accent-soft) 16%,transparent)',
    text: 'var(--accent-soft)',
    eyebrow: 'color-mix(in srgb,var(--accent) 76%,transparent)',
    subtitle: 'color-mix(in srgb,var(--accent-soft) 74%,transparent)',
    overlay: 'linear-gradient(to_top,color-mix(in srgb,var(--background) 50%,transparent) 0%,color-mix(in srgb,var(--background) 12%,transparent) 36%,transparent 100%)',
  },
  {
    background: 'linear-gradient(160deg,var(--signal-success) 0%,var(--signal-success) 32%,var(--background) 100%)',
    glow: 'radial-gradient(circle_at_top,color-mix(in srgb,var(--signal-success-surface) 18%,transparent),transparent 50%)',
    frameBorder: 'color-mix(in srgb,var(--signal-success-surface) 16%,transparent)',
    frameFill: 'linear-gradient(180deg,color-mix(in srgb,var(--signal-success-surface) 8%,transparent),color-mix(in srgb,var(--foreground) 2%,transparent))',
    spine: 'color-mix(in srgb,var(--signal-success-surface) 14%,transparent)',
    rule: 'color-mix(in srgb,var(--signal-success-surface) 16%,transparent)',
    text: 'var(--signal-success-surface)',
    eyebrow: 'color-mix(in srgb,var(--signal-success) 74%,transparent)',
    subtitle: 'color-mix(in srgb,var(--signal-success-surface) 74%,transparent)',
    overlay: 'linear-gradient(to_top,color-mix(in srgb,var(--background) 52%,transparent) 0%,color-mix(in srgb,var(--background) 12%,transparent) 34%,transparent 100%)',
  },
  {
    background: 'linear-gradient(160deg,var(--surface-2) 0%,var(--surface-1) 32%,var(--background) 100%)',
    glow: 'radial-gradient(circle_at_top,color-mix(in srgb,var(--surface-2) 18%,transparent),transparent 48%)',
    frameBorder: 'color-mix(in srgb,var(--surface-2) 16%,transparent)',
    frameFill: 'linear-gradient(180deg,color-mix(in srgb,var(--surface-2) 8%,transparent),color-mix(in srgb,var(--foreground) 2%,transparent))',
    spine: 'color-mix(in srgb,var(--surface-2) 14%,transparent)',
    rule: 'color-mix(in srgb,var(--surface-2) 16%,transparent)',
    text: 'var(--foreground)',
    eyebrow: 'color-mix(in srgb,var(--muted-foreground) 74%,transparent)',
    subtitle: 'color-mix(in srgb,var(--foreground) 74%,transparent)',
    overlay: 'linear-gradient(to_top,color-mix(in srgb,var(--background) 52%,transparent) 0%,color-mix(in srgb,var(--background) 12%,transparent) 34%,transparent 100%)',
  },
];

export function splitBookTitle(title: string): { title: string; subtitle?: string } {
  const normalized = title.trim();
  const separatorIndex = normalized.indexOf(':');

  if (separatorIndex <= 0 || separatorIndex >= normalized.length - 1) {
    return { title: normalized };
  }

  const primary = normalized.slice(0, separatorIndex).trim();
  const secondary = normalized.slice(separatorIndex + 1).trim();

  if (!primary || !secondary || secondary.length > 64) {
    return { title: normalized };
  }

  return {
    title: primary,
    subtitle: secondary,
  };
}

export function getBookCoverPalette(title: string): BookCoverPalette {
  const seed = title
    .trim()
    .split('')
    .reduce((total, char) => total + char.charCodeAt(0), 0);

  return BOOK_COVER_PALETTES[seed % BOOK_COVER_PALETTES.length] ?? BOOK_COVER_PALETTES[0];
}
