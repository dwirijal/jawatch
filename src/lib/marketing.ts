export type ShareMediaType =
  | 'anime'
  | 'donghua'
  | 'drama'
  | 'manga'
  | 'manhua'
  | 'manhwa'
  | 'movie'
  | 'series'
  | 'comic'
  | 'media';

type BuildShareTextInput = {
  title: string;
  mediaType?: ShareMediaType;
};

export const JAWATCH_MARKETING = {
  brandName: 'jawatch',
  share: {
    defaultImage: '/logo.png',
    defaultImageAlt: 'jawatch share preview',
    catalogLine: 'Katalog cepat buat film, series, anime, donghua, dan komik.',
  },
  support: {
    trakteerUrl: process.env.NEXT_PUBLIC_TRAKTEER_URL?.trim() || 'https://trakteer.id/jawatch/tip',
    label: 'Dukung via Trakteer',
    title: 'Bantu jawatch tetap cepat dan rapi',
    reason:
      'Kalau jawatch membantu sesi nonton atau baca kamu, dukungan kecil via Trakteer membantu biaya server, indexing, dan maintenance katalog.',
  },
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'contact@jawatch.web.id',
  },
} as const;

export function getShareVerb(mediaType: ShareMediaType = 'media'): 'Baca' | 'Nonton' | 'Cek' {
  if (mediaType === 'manga' || mediaType === 'manhua' || mediaType === 'manhwa' || mediaType === 'comic') {
    return 'Baca';
  }

  if (
    mediaType === 'anime' ||
    mediaType === 'donghua' ||
    mediaType === 'drama' ||
    mediaType === 'movie' ||
    mediaType === 'series'
  ) {
    return 'Nonton';
  }

  return 'Cek';
}

export function buildShareText({ title, mediaType = 'media' }: BuildShareTextInput): string {
  const cleanTitle = title.replace(/\s+/g, ' ').trim() || 'konten ini';
  const verb = getShareVerb(mediaType);
  const descriptor = verb === 'Baca' ? 'bahasa Indonesia' : verb === 'Nonton' ? 'subtitle Indonesia' : 'di jawatch';
  const target = verb === 'Cek' ? cleanTitle : `${cleanTitle} ${descriptor}`;

  return `${verb} ${target} di jawatch. ${JAWATCH_MARKETING.share.catalogLine}`;
}

export function buildSupportCta() {
  return {
    label: JAWATCH_MARKETING.support.label,
    href: JAWATCH_MARKETING.support.trakteerUrl,
    title: JAWATCH_MARKETING.support.title,
    description: JAWATCH_MARKETING.support.reason,
  };
}
