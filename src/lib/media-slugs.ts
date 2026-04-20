function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readNumericText(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value).replace(/\.0+$/, '');
  }

  const text = readText(value);
  if (!text) {
    return '';
  }

  if (/^\d+(?:\.\d+)?$/.test(text)) {
    return text.replace(/\.0+$/, '');
  }

  return text.replace(/[^\d.]+/g, '').replace(/\.0+$/, '');
}

export function slugifyRouteSegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildFallbackSlug(prefix: string, fallbackKey?: string | null): string {
  const fallback = slugifyRouteSegment(readText(fallbackKey ?? ''));
  return fallback ? `${prefix}-${fallback}` : prefix;
}

export function buildMovieItemSlug({
  title,
  releaseYear,
  fallbackKey,
}: {
  title?: string | null;
  releaseYear?: string | number | null;
  fallbackKey?: string | null;
}): string {
  const baseSlug = slugifyRouteSegment(readText(title ?? ''));
  const year = readNumericText(releaseYear);
  if (baseSlug && year) {
    return baseSlug.endsWith(`-${year}`) ? baseSlug : `${baseSlug}-${year}`;
  }
  if (baseSlug) {
    return baseSlug;
  }
  if (year) {
    return `movie-${year}`;
  }
  return buildFallbackSlug('movie', fallbackKey);
}

export function buildSeriesItemSlug({
  title,
  fallbackKey,
}: {
  title?: string | null;
  fallbackKey?: string | null;
}): string {
  const baseSlug = slugifyRouteSegment(readText(title ?? ''));
  return baseSlug || buildFallbackSlug('series', fallbackKey);
}

export function buildDramaItemSlug({
  title,
  fallbackKey,
}: {
  title?: string | null;
  fallbackKey?: string | null;
}): string {
  const baseSlug = slugifyRouteSegment(readText(title ?? ''));
  return baseSlug || buildFallbackSlug('drama', fallbackKey);
}

export function buildComicItemSlug({
  title,
  fallbackKey,
}: {
  title?: string | null;
  fallbackKey?: string | null;
}): string {
  const baseSlug = slugifyRouteSegment(readText(title ?? ''));
  return baseSlug || buildFallbackSlug('comic', fallbackKey);
}

export function buildComicChapterSlug({
  comicSlug,
  label,
  title,
  number,
  fallbackKey,
}: {
  comicSlug: string;
  label?: string | null;
  title?: string | null;
  number?: string | number | null;
  fallbackKey?: string | null;
}): string {
  const normalizedComicSlug = readText(comicSlug);
  const normalizedNumber = readNumericText(number);
  if (normalizedComicSlug && normalizedNumber) {
    return `${normalizedComicSlug}-chapter-${normalizedNumber}`;
  }

  const labelSlug = slugifyRouteSegment(readText(label ?? '') || readText(title ?? ''));
  if (normalizedComicSlug && labelSlug) {
    return `${normalizedComicSlug}-${labelSlug}`;
  }
  if (labelSlug) {
    return labelSlug;
  }

  return normalizedComicSlug || buildFallbackSlug('chapter', fallbackKey);
}

export function buildDramaEpisodeSlug({
  dramaSlug,
  label,
  title,
  number,
  fallbackKey,
}: {
  dramaSlug: string;
  label?: string | null;
  title?: string | null;
  number?: string | number | null;
  fallbackKey?: string | null;
}): string {
  const normalizedDramaSlug = readText(dramaSlug);
  const normalizedNumber = readNumericText(number);
  if (normalizedDramaSlug && normalizedNumber) {
    return `${normalizedDramaSlug}-episode-${normalizedNumber}`;
  }

  const labelSlug = slugifyRouteSegment(readText(label ?? '') || readText(title ?? ''));
  if (normalizedDramaSlug && labelSlug) {
    return `${normalizedDramaSlug}-${labelSlug}`;
  }
  if (labelSlug) {
    return labelSlug;
  }

  return normalizedDramaSlug || buildFallbackSlug('episode', fallbackKey);
}

export function buildSqlSlugifyExpression(expression: string): string {
  return `trim(both '-' from regexp_replace(lower(btrim(coalesce(${expression}, ''))), '[^a-z0-9]+', '-', 'g'))`;
}

function buildSqlNumericTextExpression(expression: string): string {
  return `nullif(regexp_replace(coalesce(${expression}, ''), '[^0-9.]+', '', 'g'), '')`;
}

export function buildSqlMovieItemSlugExpression(
  titleExpression: string,
  releaseYearExpression: string,
  fallbackExpression: string,
): string {
  const titleSlug = buildSqlSlugifyExpression(titleExpression);
  const yearText = buildSqlNumericTextExpression(releaseYearExpression);
  const fallbackSlug = buildSqlSlugifyExpression(fallbackExpression);

  return `(
    case
      when ${titleSlug} <> '' and ${yearText} <> '' and ${titleSlug} not like '%-' || ${yearText}
        then ${titleSlug} || '-' || ${yearText}
      when ${titleSlug} <> '' then ${titleSlug}
      when ${yearText} <> '' then 'movie-' || ${yearText}
      when ${fallbackSlug} <> '' then 'movie-' || ${fallbackSlug}
      else 'movie'
    end
  )`;
}

export function buildSqlSeriesItemSlugExpression(titleExpression: string, fallbackExpression: string): string {
  const titleSlug = buildSqlSlugifyExpression(titleExpression);
  const fallbackSlug = buildSqlSlugifyExpression(fallbackExpression);

  return `(
    case
      when ${titleSlug} <> '' then ${titleSlug}
      when ${fallbackSlug} <> '' then 'series-' || ${fallbackSlug}
      else 'series'
    end
  )`;
}

export function buildSqlDramaItemSlugExpression(titleExpression: string, fallbackExpression: string): string {
  const titleSlug = buildSqlSlugifyExpression(titleExpression);
  const fallbackSlug = buildSqlSlugifyExpression(fallbackExpression);

  return `(
    case
      when ${titleSlug} <> '' then ${titleSlug}
      when ${fallbackSlug} <> '' then 'drama-' || ${fallbackSlug}
      else 'drama'
    end
  )`;
}

export function buildSqlComicItemSlugExpression(titleExpression: string, fallbackExpression: string): string {
  const titleSlug = buildSqlSlugifyExpression(titleExpression);
  const fallbackSlug = buildSqlSlugifyExpression(fallbackExpression);

  return `(
    case
      when ${titleSlug} <> '' then ${titleSlug}
      when ${fallbackSlug} <> '' then 'comic-' || ${fallbackSlug}
      else 'comic'
    end
  )`;
}

export function buildSqlComicChapterSlugExpression(
  comicSlugExpression: string,
  labelExpression: string,
  titleExpression: string,
  numberExpression: string,
  fallbackExpression: string,
): string {
  const labelSlug = buildSqlSlugifyExpression(`coalesce(${labelExpression}, ${titleExpression}, '')`);
  const numberText = buildSqlNumericTextExpression(numberExpression);
  const fallbackSlug = buildSqlSlugifyExpression(fallbackExpression);

  return `(
    case
      when coalesce(${comicSlugExpression}, '') <> '' and ${numberText} <> ''
        then ${comicSlugExpression} || '-chapter-' || ${numberText}
      when coalesce(${comicSlugExpression}, '') <> '' and ${labelSlug} <> ''
        then ${comicSlugExpression} || '-' || ${labelSlug}
      when ${labelSlug} <> '' then ${labelSlug}
      when coalesce(${comicSlugExpression}, '') <> '' then ${comicSlugExpression}
      when ${fallbackSlug} <> '' then 'chapter-' || ${fallbackSlug}
      else 'chapter'
    end
  )`;
}

export function buildSqlSeriesEpisodeSlugExpression(
  seriesSlugExpression: string,
  labelExpression: string,
  titleExpression: string,
  numberExpression: string,
  fallbackExpression: string,
): string {
  const labelSlug = buildSqlSlugifyExpression(`coalesce(${labelExpression}, ${titleExpression}, '')`);
  const numberText = buildSqlNumericTextExpression(numberExpression);
  const fallbackSlug = buildSqlSlugifyExpression(fallbackExpression);

  return `(
    case
      when coalesce(${seriesSlugExpression}, '') <> '' and ${numberText} <> ''
        then ${seriesSlugExpression} || '-episode-' || ${numberText}
      when coalesce(${seriesSlugExpression}, '') <> '' and ${labelSlug} <> ''
        then ${seriesSlugExpression} || '-' || ${labelSlug}
      when ${labelSlug} <> '' then ${labelSlug}
      when coalesce(${seriesSlugExpression}, '') <> '' then ${seriesSlugExpression}
      when ${fallbackSlug} <> '' then 'episode-' || ${fallbackSlug}
      else 'episode'
    end
  )`;
}

export function buildSqlDramaEpisodeSlugExpression(
  dramaSlugExpression: string,
  labelExpression: string,
  titleExpression: string,
  numberExpression: string,
  fallbackExpression: string,
): string {
  const labelSlug = buildSqlSlugifyExpression(`coalesce(${labelExpression}, ${titleExpression}, '')`);
  const numberText = buildSqlNumericTextExpression(numberExpression);
  const fallbackSlug = buildSqlSlugifyExpression(fallbackExpression);

  return `(
    case
      when coalesce(${dramaSlugExpression}, '') <> '' and ${numberText} <> ''
        then ${dramaSlugExpression} || '-episode-' || ${numberText}
      when coalesce(${dramaSlugExpression}, '') <> '' and ${labelSlug} <> ''
        then ${dramaSlugExpression} || '-' || ${labelSlug}
      when ${labelSlug} <> '' then ${labelSlug}
      when coalesce(${dramaSlugExpression}, '') <> '' then ${dramaSlugExpression}
      when ${fallbackSlug} <> '' then 'episode-' || ${fallbackSlug}
      else 'episode'
    end
  )`;
}
