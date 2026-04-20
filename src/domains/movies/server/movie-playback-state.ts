type MoviePlaybackStateInput = {
  slug: string;
  externalUrl?: string | null;
};

type MovieWatchPlaybackStateInput = {
  canInlinePlayback?: boolean;
  defaultUrl?: string | null;
  externalUrl?: string | null;
} | null | undefined;

export type MoviePlaybackState =
  | {
      kind: 'inline';
      href: '#player';
      ctaLabel: 'Nonton sekarang';
      message: null;
    }
  | {
      kind: 'external';
      href: string;
      ctaLabel: 'Buka sumber';
      message: null;
    }
  | {
      kind: 'unavailable';
      href: null;
      ctaLabel: 'Belum bisa diputar';
      message: 'Judul ini sudah ada di katalog, tetapi sumber stream belum tersedia.';
    };

const MOVIE_PLAYBACK_UNAVAILABLE_MESSAGE = 'Judul ini sudah ada di katalog, tetapi sumber stream belum tersedia.' as const;

function normalizeComparablePath(href: string | null | undefined): string | null {
  if (!href) {
    return null;
  }

  const value = href.trim();
  if (!value) {
    return null;
  }

  try {
    return new URL(value, 'https://jawatch.local').pathname;
  } catch {
    return value;
  }
}

function isSelfMovieDetailLink(href: string | null | undefined, detailPath: string): boolean {
  return normalizeComparablePath(href) === detailPath;
}

function toExternalHref(href: string | null | undefined, detailPath: string): string | null {
  if (!href) {
    return null;
  }

  const value = href.trim();
  if (!value || isSelfMovieDetailLink(value, detailPath)) {
    return null;
  }

  return value;
}

export function resolveMoviePlaybackState(
  movie: MoviePlaybackStateInput,
  watch: MovieWatchPlaybackStateInput,
): MoviePlaybackState {
  const detailPath = `/movies/${movie.slug}`;

  if (watch?.canInlinePlayback && watch.defaultUrl?.trim()) {
    return {
      kind: 'inline',
      href: '#player',
      ctaLabel: 'Nonton sekarang',
      message: null,
    };
  }

  const watchExternalHref = toExternalHref(watch?.externalUrl, detailPath);
  if (watchExternalHref) {
    return {
      kind: 'external',
      href: watchExternalHref,
      ctaLabel: 'Buka sumber',
      message: null,
    };
  }

  const movieExternalHref = toExternalHref(movie.externalUrl, detailPath);
  if (movieExternalHref) {
    return {
      kind: 'external',
      href: movieExternalHref,
      ctaLabel: 'Buka sumber',
      message: null,
    };
  }

  return {
    kind: 'unavailable',
    href: null,
    ctaLabel: 'Belum bisa diputar',
    message: MOVIE_PLAYBACK_UNAVAILABLE_MESSAGE,
  };
}
