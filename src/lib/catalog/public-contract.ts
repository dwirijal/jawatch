export type PublicAvailability = 'ready' | 'partial' | 'updating' | 'unavailable';

export type PublicMediaFamily = 'movie' | 'series' | 'short' | 'comic';

export type PublicTitle = {
  id: string;
  slug: string;
  title: string;
  family: PublicMediaFamily;
  availability: PublicAvailability;
  releaseDate: string | null;
  isNsfw: boolean;
  poster?: string | null;
  cover?: string | null;
  thumbnail?: string | null;
};

export type PublicUnit = {
  id: string;
  slug?: string;
  title?: string;
  family?: PublicMediaFamily;
  availability: PublicAvailability;
  releaseDate?: string | null;
  isNsfw?: boolean;
  hasStreams?: boolean;
  hasDownloads?: boolean;
  hasPages?: boolean;
};

export function isPublicAvailability(value: string): value is PublicAvailability {
  return value === 'ready' || value === 'partial' || value === 'updating' || value === 'unavailable';
}

export function isConsumableAvailability(availability: PublicAvailability): boolean {
  return availability === 'ready' || availability === 'partial';
}
