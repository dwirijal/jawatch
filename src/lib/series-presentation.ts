export type SeriesMediaType = 'anime' | 'drama' | 'donghua';

export type SeriesCardItem = {
  slug: string;
  title: string;
  poster: string;
  background?: string;
  backdrop?: string;
  logo?: string;
  year: string;
  type: SeriesMediaType;
  rating?: string;
  status?: string;
  genres?: string;
  latestEpisode?: string;
  country?: string;
  releaseWindow?: string;
  nextReleaseAt?: string;
};

export type SeriesReleaseDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type SeriesScheduleLane = {
  day: SeriesReleaseDay;
  label: string;
  timezone: string;
  items: SeriesCardItem[];
};

const SERIES_FILTER_ORDER = ['Anime', 'Donghua', 'Drama', 'Japan', 'China', 'South Korea'] as const;
const SERIES_RELEASE_DAY_ORDER: SeriesReleaseDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function getSeriesCanonicalFilters(available: Iterable<string>): string[] {
  const lookup = new Set<string>();

  for (const value of available) {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'anime') lookup.add('Anime');
    if (normalized === 'donghua') lookup.add('Donghua');
    if (normalized === 'drama') lookup.add('Drama');
    if (normalized === 'japan') lookup.add('Japan');
    if (normalized === 'china') lookup.add('China');
    if (normalized === 'south korea' || normalized === 'korea') lookup.add('South Korea');
  }

  return SERIES_FILTER_ORDER.filter((value) => lookup.has(value));
}

export function formatSeriesCardSubtitle(item: {
  country?: string;
  latestEpisode?: string;
  year?: string;
  releaseWindow?: string;
}): string {
  const country = item.country?.trim();
  const latestEpisode = item.latestEpisode?.trim();
  const year = item.year?.trim();
  const releaseWindow = item.releaseWindow?.trim();

  if (releaseWindow && country) {
    return `${releaseWindow} • ${country}`;
  }

  if (country && latestEpisode) {
    return `${country} • ${latestEpisode}`;
  }

  return latestEpisode || country || releaseWindow || year || '';
}

export function getSeriesTheme(type: SeriesMediaType): 'anime' | 'donghua' | 'drama' {
  if (type === 'drama') {
    return 'drama';
  }
  if (type === 'donghua') {
    return 'donghua';
  }
  return 'anime';
}

export function getSeriesBadgeText(type: SeriesMediaType): 'ANIME' | 'DONGHUA' | 'DRAMA' {
  if (type === 'drama') {
    return 'DRAMA';
  }
  if (type === 'donghua') {
    return 'DONGHUA';
  }
  return 'ANIME';
}

export function getSeriesReleaseDayOrder(): SeriesReleaseDay[] {
  return [...SERIES_RELEASE_DAY_ORDER];
}

export function getCurrentReleaseDay(): SeriesReleaseDay {
  const dayIndex = new Date().getDay(); // 0 (Sunday) to 6 (Saturday)
  const mapping: SeriesReleaseDay[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return mapping[dayIndex];
}

export function getSeriesReleaseDayLabel(day: SeriesReleaseDay, short = false): string {
  if (short) {
    switch (day) {
      case 'monday': return 'MON';
      case 'tuesday': return 'TUE';
      case 'wednesday': return 'WED';
      case 'thursday': return 'THU';
      case 'friday': return 'FRI';
      case 'saturday': return 'SAT';
      case 'sunday': return 'SUN';
    }
  }

  switch (day) {
    case 'monday':
      return 'Monday';
    case 'tuesday':
      return 'Tuesday';
    case 'wednesday':
      return 'Wednesday';
    case 'thursday':
      return 'Thursday';
    case 'friday':
      return 'Friday';
    case 'saturday':
      return 'Saturday';
    case 'sunday':
      return 'Sunday';
  }
}

export function formatSeriesTimezoneLabel(timezone: string): string {
  switch (timezone) {
    case 'Asia/Tokyo':
      return 'Japan';
    case 'Asia/Shanghai':
      return 'China';
    case 'Asia/Seoul':
      return 'South Korea';
    default:
      return timezone;
  }
}

export function formatSeriesTimezoneShort(timezone: string): string {
  switch (timezone) {
    case 'Asia/Tokyo':
      return 'JST';
    case 'Asia/Shanghai':
      return 'CST';
    case 'Asia/Seoul':
      return 'KST';
    default:
      return timezone;
  }
}

export function formatSeriesNextRelease(
  item: Pick<SeriesCardItem, 'nextReleaseAt' | 'releaseWindow'>,
  timezone: string,
  now = new Date(),
): string {
  const nextReleaseAt = item.nextReleaseAt?.trim();
  if (!nextReleaseAt) {
    return item.releaseWindow?.trim() || '';
  }

  const releaseDate = new Date(nextReleaseAt);
  if (Number.isNaN(releaseDate.getTime())) {
    return item.releaseWindow?.trim() || '';
  }

  const diffMs = releaseDate.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  let relativeLabel = 'Soon';

  if (diffMinutes > 0) {
    if (diffMinutes < 60) {
      relativeLabel = `Next in ${diffMinutes}m`;
    } else if (diffMinutes < 60 * 24) {
      relativeLabel = `Next in ${Math.round(diffMinutes / 60)}h`;
    } else {
      relativeLabel = `Next in ${Math.round(diffMinutes / (60 * 24))}d`;
    }
  }

  const userTimezone = typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone || timezone
    : timezone;

  const timeLabel = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: userTimezone,
  }).format(releaseDate);
  const timezoneShort = formatSeriesTimezoneShort(userTimezone);

  return `${relativeLabel} • ${timeLabel} ${timezoneShort}`;
}
