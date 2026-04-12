type OnboardingMediaType = (typeof import("./types"))["ONBOARDING_MEDIA_TYPES"][number];
type OnboardingTitleSeedInput = {
  title: string;
  mediaType?: OnboardingMediaType | null;
};

export const MAX_MEDIA_SELECTIONS = 7;
export const MAX_GENRE_SELECTIONS = 10;
export const MAX_TITLE_SEED_COUNT = 10;
export const MAX_TITLE_SEED_LENGTH = 120;
export const MAX_DISPLAY_NAME_LENGTH = 48;

const ONBOARDING_TYPES_MODULE_URL = new URL("./types.ts", import.meta.url).href;
const onboardingTypesModule = (await import(ONBOARDING_TYPES_MODULE_URL)) as {
  ONBOARDING_MEDIA_TYPES: readonly OnboardingMediaType[];
};
const ONBOARDING_MEDIA_TYPE_SET = new Set<string>(onboardingTypesModule.ONBOARDING_MEDIA_TYPES);

function isValidDateParts(year: number, month: number, day: number): boolean {
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function parseIsoDateOnly(value: string, options?: { allowToday?: boolean }): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [rawYear, rawMonth, rawDay] = value.split("-");
  const year = Number(rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  if (!isValidDateParts(year, month, day)) {
    return null;
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const allowToday = options?.allowToday === true;
  return allowToday ? (value <= todayIso ? value : null) : value < todayIso ? value : null;
}

function parseTimestamp(value: string): Date | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function assertValidDisplayName(value: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error("Display name is required");
  }

  if (normalized.length > MAX_DISPLAY_NAME_LENGTH) {
    throw new Error(`Display name must be at most ${MAX_DISPLAY_NAME_LENGTH} characters`);
  }

  return normalized;
}

export function normalizeBirthDate(value: string | Date): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return parseIsoDateOnly(value.toISOString().slice(0, 10), { allowToday: false });
  }

  return parseIsoDateOnly(value.trim(), { allowToday: false });
}

export function assertValidBirthDate(value: string | Date): string {
  const normalized = normalizeBirthDate(value);
  if (!normalized) {
    throw new Error("Invalid birth date");
  }

  return normalized;
}

export function normalizeBirthDateAllowToday(value: string | Date): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return parseIsoDateOnly(value.toISOString().slice(0, 10), { allowToday: true });
  }

  return parseIsoDateOnly(value.trim(), { allowToday: true });
}

export function assertValidBirthDateAllowToday(value: string | Date): string {
  const normalized = normalizeBirthDateAllowToday(value);
  if (!normalized) {
    throw new Error("Invalid birth date");
  }

  return normalized;
}

export function isAdultChoiceTimestampSet(value: string | Date | null | undefined): boolean {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value !== "string") {
    return false;
  }

  return parseTimestamp(value) !== null;
}

export function normalizeAdultChoiceTimestamp(value?: string | Date): string {
  if (value === undefined) {
    return new Date().toISOString();
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("Invalid adult choice timestamp");
    }

    return value.toISOString();
  }

  const parsed = parseTimestamp(value);
  if (!parsed) {
    throw new Error("Invalid adult choice timestamp");
  }

  return parsed.toISOString();
}

export function normalizeMediaTypes(values: OnboardingMediaType[]): OnboardingMediaType[] {
  const deduped = Array.from(new Set(values));
  if (deduped.length > MAX_MEDIA_SELECTIONS) {
    throw new Error(`Media selection limit is ${MAX_MEDIA_SELECTIONS}`);
  }

  for (const mediaType of deduped) {
    if (!ONBOARDING_MEDIA_TYPE_SET.has(mediaType)) {
      throw new Error(`Unsupported media type: ${String(mediaType)}`);
    }
  }

  return deduped;
}

export function normalizeGenreKeys(values: string[]): string[] {
  const deduped = Array.from(
    new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)),
  );
  if (deduped.length > MAX_GENRE_SELECTIONS) {
    throw new Error(`Genre selection limit is ${MAX_GENRE_SELECTIONS}`);
  }

  return deduped;
}

export function normalizeTitleSeeds(values: OnboardingTitleSeedInput[]): OnboardingTitleSeedInput[] {
  if (values.length > MAX_TITLE_SEED_COUNT) {
    throw new Error(`Title seed limit is ${MAX_TITLE_SEED_COUNT}`);
  }

  const dedupeMap = new Map<string, OnboardingTitleSeedInput>();
  for (const seed of values) {
    const normalizedTitle = seed.title.trim();
    if (normalizedTitle.length === 0) {
      throw new Error("Title seed cannot be blank");
    }
    if (normalizedTitle.length > MAX_TITLE_SEED_LENGTH) {
      throw new Error(`Title seed must be at most ${MAX_TITLE_SEED_LENGTH} characters`);
    }

    let mediaType: OnboardingMediaType | null | undefined = seed.mediaType ?? null;
    if (mediaType !== null && !ONBOARDING_MEDIA_TYPE_SET.has(mediaType)) {
      throw new Error(`Unsupported media type: ${String(mediaType)}`);
    }

    if (mediaType === undefined) {
      mediaType = null;
    }

    const dedupeKey = `${normalizedTitle.toLowerCase()}::${mediaType ?? ""}`;
    dedupeMap.set(dedupeKey, {
      title: normalizedTitle,
      mediaType,
    });
  }

  return Array.from(dedupeMap.values());
}
