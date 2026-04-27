import type { Metadata } from 'next';
import { JAWATCH_MARKETING } from './marketing.ts';
import { SITE_URL } from './site.ts';

type SeoItem = {
  name: string;
  url: string;
  image?: string | null;
};

type BuildMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  noIndex?: boolean;
  keywords?: string[];
};

const MIN_DESCRIPTION_LENGTH = 100;
const DESCRIPTION_FALLBACK =
  ' Jelajahi katalog jawatch untuk nonton film, anime, donghua, drama subtitle Indonesia, serta baca manga, manhwa, dan manhua bahasa Indonesia.';

function normalizePath(path: string): string {
  if (!path || path === '/') {
    return '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
}

function normalizeDescription(description: string): string {
  const normalized = description.replace(/\s+/g, ' ').trim();
  const expanded = normalized.length < MIN_DESCRIPTION_LENGTH
    ? `${normalized}${DESCRIPTION_FALLBACK}`
    : normalized;

  if (expanded.length <= 170) {
    return expanded;
  }

  return `${expanded.slice(0, 167).trimEnd()}...`;
}

export function absoluteUrl(path: string): string {
  return new URL(normalizePath(path), SITE_URL).toString();
}

export function absoluteImageUrl(image: string | null | undefined): string | undefined {
  if (!image) {
    return undefined;
  }

  try {
    return new URL(image).toString();
  } catch {
    return absoluteUrl(image);
  }
}

export function buildMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
  keywords = [],
}: BuildMetadataOptions): Metadata {
  const canonicalPath = normalizePath(path);
  const usesDefaultImage = !image;
  const imageUrl = absoluteImageUrl(image || JAWATCH_MARKETING.share.defaultImage);
  const normalizedDescription = normalizeDescription(description);
  const imageAlt = usesDefaultImage ? JAWATCH_MARKETING.share.defaultImageAlt : `${title} di jawatch`;

  return {
    title,
    description: normalizedDescription,
    keywords,
    alternates: {
      canonical: canonicalPath,
      languages: {
        'id-ID': canonicalPath,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url: absoluteUrl(canonicalPath),
      title,
      description: normalizedDescription,
      siteName: 'jawatch',
      images: imageUrl ? [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: imageAlt,
      }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: normalizedDescription,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
          },
        },
  };
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'jawatch',
    url: absoluteUrl('/'),
    logo: absoluteImageUrl(JAWATCH_MARKETING.share.defaultImage),
    sameAs: [JAWATCH_MARKETING.support.trakteerUrl],
    potentialAction: {
      '@type': 'DonateAction',
      name: JAWATCH_MARKETING.support.label,
      target: JAWATCH_MARKETING.support.trakteerUrl,
      description: JAWATCH_MARKETING.support.reason,
    },
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'jawatch',
    url: absoluteUrl('/'),
    inLanguage: 'id-ID',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/search')}?q={search_term_string}&type=all`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildCollectionPageJsonLd(options: {
  title: string;
  description: string;
  path: string;
  items: SeoItem[];
}) {
  const items = options.items.slice(0, 12);

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.title,
    description: options.description,
    url: absoluteUrl(options.path),
    inLanguage: 'id-ID',
    isPartOf: {
      '@type': 'WebSite',
      name: 'jawatch',
      url: absoluteUrl('/'),
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(item.url),
        item: {
          '@type': 'Thing',
          name: item.name,
          url: absoluteUrl(item.url),
          image: absoluteImageUrl(item.image) || undefined,
        },
      })),
    },
  };
}

export function buildArticleJsonLd(options: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  publishedAt: string;
  updatedAt: string;
  tags?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: options.title,
    description: options.description,
    url: absoluteUrl(options.path),
    image: absoluteImageUrl(options.image) || undefined,
    datePublished: options.publishedAt,
    dateModified: options.updatedAt,
    inLanguage: 'id-ID',
    keywords: options.tags?.join(', ') || undefined,
    author: {
      '@type': 'Organization',
      name: 'jawatch',
      url: absoluteUrl('/'),
    },
    publisher: {
      '@type': 'Organization',
      name: 'jawatch',
      logo: {
        '@type': 'ImageObject',
        url: absoluteImageUrl(JAWATCH_MARKETING.share.defaultImage),
      },
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'jawatch',
      url: absoluteUrl('/'),
    },
  };
}

export function buildSeriesEpisodeJsonLd(options: {
  seriesTitle: string;
  seriesSlug: string;
  episodeTitle: string;
  episodeHref: string;
  poster?: string | null;
  description?: string | null;
  episodeNumber?: string | null;
  country?: string | null;
}) {
  const episodeNumber = Number.parseInt(options.episodeNumber || '', 10);

  return {
    '@context': 'https://schema.org',
    '@type': 'TVEpisode',
    name: options.episodeTitle,
    url: absoluteUrl(options.episodeHref),
    image: absoluteImageUrl(options.poster) || undefined,
    description: options.description || undefined,
    episodeNumber: Number.isFinite(episodeNumber) ? episodeNumber : undefined,
    inLanguage: 'id-ID',
    partOfSeries: {
      '@type': 'TVSeries',
      name: options.seriesTitle,
      url: absoluteUrl(`/series/${options.seriesSlug}`),
      image: absoluteImageUrl(options.poster) || undefined,
      countryOfOrigin: options.country
        ? {
            '@type': 'Country',
            name: options.country,
          }
        : undefined,
    },
    potentialAction: {
      '@type': 'WatchAction',
      target: absoluteUrl(options.episodeHref),
    },
  };
}

export function buildMovieWatchJsonLd(options: {
  title: string;
  slug: string;
  poster?: string | null;
  description?: string | null;
  year?: string | null;
  duration?: string | null;
}) {
  const year = Number.parseInt(options.year || '', 10);

  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: options.title,
    url: absoluteUrl(`/movies/${options.slug}`),
    image: absoluteImageUrl(options.poster) || undefined,
    description: options.description || undefined,
    duration: options.duration || undefined,
    datePublished: Number.isFinite(year) ? `${year}-01-01` : undefined,
    inLanguage: 'id-ID',
    potentialAction: {
      '@type': 'WatchAction',
      target: absoluteUrl(`/movies/${options.slug}`),
    },
  };
}

export function buildSeriesDetailJsonLd(options: {
  title: string;
  slug: string;
  poster?: string | null;
  description?: string | null;
  genres?: string[];
  country?: string | null;
  year?: string | null;
}) {
  const year = Number.parseInt(options.year || '', 10);

  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: options.title,
    url: absoluteUrl(`/series/${options.slug}`),
    image: absoluteImageUrl(options.poster) || undefined,
    description: options.description || undefined,
    genre: options.genres?.length ? options.genres : undefined,
    datePublished: Number.isFinite(year) ? `${year}-01-01` : undefined,
    inLanguage: 'id-ID',
    countryOfOrigin: options.country
      ? {
          '@type': 'Country',
          name: options.country,
        }
      : undefined,
  };
}

export function buildMovieDetailJsonLd(options: {
  title: string;
  slug: string;
  poster?: string | null;
  description?: string | null;
  year?: string | null;
  duration?: string | null;
  genres?: string[];
}) {
  const year = Number.parseInt(options.year || '', 10);

  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: options.title,
    url: absoluteUrl(`/movies/${options.slug}`),
    image: absoluteImageUrl(options.poster) || undefined,
    description: options.description || undefined,
    genre: options.genres?.length ? options.genres : undefined,
    duration: options.duration || undefined,
    datePublished: Number.isFinite(year) ? `${year}-01-01` : undefined,
    inLanguage: 'id-ID',
    potentialAction: {
      '@type': 'WatchAction',
      target: absoluteUrl(`/movies/${options.slug}`),
    },
  };
}

export function buildComicDetailJsonLd(options: {
  title: string;
  slug: string;
  poster?: string | null;
  description?: string | null;
  genres?: string[];
  author?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ComicSeries',
    name: options.title,
    url: absoluteUrl(`/comics/${options.slug}`),
    image: absoluteImageUrl(options.poster) || undefined,
    description: options.description || undefined,
    genre: options.genres?.length ? options.genres : undefined,
    author: options.author
      ? {
          '@type': 'Person',
          name: options.author,
        }
      : undefined,
    inLanguage: 'id-ID',
  };
}
