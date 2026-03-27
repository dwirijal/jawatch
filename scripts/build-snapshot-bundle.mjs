import { promises as fs } from 'node:fs';
import path from 'node:path';

const rawRoot = path.resolve(process.argv[2] || '../dwizzySCRAPE/.snapshots/raw');
const outputRoot = path.resolve(process.argv[3] || 'public/snapshots/current');
const tmdbBaseUrl = (process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3').replace(/\/+$/, '');
const tmdbReadToken = (process.env.TMDB_READ_TOKEN || '').trim();
const tmdbApiKey = (process.env.TMDB_API_KEY || '').trim();
const maxSnapshotBytes = Number(process.env.MAX_SNAPSHOT_BYTES || 1_000_000_000);

function toSlugFromUrl(value) {
  if (!value || typeof value !== 'string') return '';
  return value.split('/').filter(Boolean).at(-1) || '';
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function text(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function numberText(value, fallback = 'N/A') {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }
  const normalized = text(value);
  return normalized || fallback;
}

function buildTMDBImageUrl(imagePath, size = 'w500') {
  const value = text(imagePath);
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://image.tmdb.org/t/p/${size}${value.startsWith('/') ? value : `/${value}`}`;
}

function uniqBy(items, keyFn) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function readJsonIfExists(filePath) {
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function ensureEmptyDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function seedExistingOutput(outputDir, backupDir) {
  if (!(await pathExists(outputDir))) {
    await fs.mkdir(outputDir, { recursive: true });
    return false;
  }

  await fs.rm(backupDir, { recursive: true, force: true });
  await fs.rename(outputDir, backupDir);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.cp(backupDir, outputDir, { recursive: true });
  return true;
}

async function getDirSizeBytes(dir) {
  let total = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile()) {
        const stat = await fs.stat(fullPath);
        total += stat.size;
      }
    }
  }
  return total;
}

function movieCardFromHome(item) {
  return {
    slug: text(item.slug),
    title: text(item.title),
    poster: text(item.poster),
    backdrop: text(item.backdrop),
    year: text(item.year, 'N/A'),
    type: text(item.type, 'movie'),
    rating: typeof item.rating === 'number' && item.rating > 0 ? item.rating.toFixed(1) : undefined,
    status: text(item.quality),
    genres: text(item.genres),
  };
}

function animeCardFromCatalog(item) {
  return {
    slug: text(item.slug),
    title: text(item.title),
    thumb: text(item.poster_url),
    episode: '',
    type: text(item.anime_type, 'Anime'),
    status: text(item.status, 'Unknown'),
    synopsis_excerpt: text(item.synopsis_excerpt),
    genres: ensureArray(item.genres),
    score: typeof item.score === 'number' ? item.score : 0,
  };
}

function readingCardFromSeries(series) {
  const latest = series.latest_chapter || {};
  return {
    title: text(series.title),
    altTitle: text(series.alt_title) || null,
    slug: text(series.slug),
    href: text(series.canonical_url),
    thumbnail: text(series.cover_url),
    type: text(series.type || series.media_type || 'manga'),
    genre: ensureArray(series.genres).join(', '),
    description: text(series.synopsis),
    chapter: text(latest.label),
    time_ago: text(latest.published_at),
    link: text(series.canonical_url),
    image: text(series.cover_url),
  };
}

function donghuaCardFromCatalog(item) {
  const latest = item.latest_episode || {};
  const status = text(item.status);
  const episode = text(item.episode || latest.label || latest.number);
  return {
    title: text(item.title),
    slug: text(item.series_slug || item.title_slug || item.anime_slug || item.slug),
    thumb: text(item.thumb || item.image || item.cover_url),
    image: text(item.thumb || item.image || item.cover_url),
    episode,
    status: status || (episode ? 'Ongoing' : ''),
    type: text(item.type || item.media_type, 'donghua'),
  };
}

function donghuaDetailFromRaw(series) {
  const detail = series.detail || series.primary || series;
  const meta = detail.meta || series.meta || {};
  const episodes = ensureArray(detail.episodes || series.episodes).map((episode) => ({
    slug: text(episode.slug || episode.episode_slug),
    title: text(episode.title || episode.label || episode.number),
    episode: text(episode.episode || episode.label || episode.number),
    date: text(episode.date || episode.published_at),
  }));
  return {
    slug: text(detail.slug || series.slug),
    title: text(detail.title || series.title),
    meta: {
      studio: text(meta.studio || detail.studio, 'Unknown'),
      status: text(meta.status || detail.status, 'Unknown'),
      episodes: text(meta.episodes) || (episodes.length > 0 ? String(episodes.length) : 'Unknown'),
      season: text(meta.season || detail.release_year, 'Unknown'),
      country: text(meta.country, 'China'),
      network: text(meta.network || meta.studio || detail.studio, 'Unknown'),
      duration: text(meta.duration || episodes[0]?.episode, 'Unknown'),
      released: text(meta.released || detail.release_year, 'Unknown'),
      updated_on: text(meta.updated_on || detail.latest_episode?.published_at || episodes[0]?.date, 'Unknown'),
    },
    episodes,
    synopsis: text(detail.synopsis || series.synopsis),
    thumb: text(detail.thumb || series.thumb || series.cover_url),
    genres: ensureArray(detail.genres || series.genres).map((genre) => text(genre)).filter(Boolean),
  };
}

function donghuaPlaybackFromRaw(episode) {
  const payload = episode.episode || episode.primary || episode;
  const navigation = payload.navigation || episode.navigation || {};
  const assets = ensureArray(payload.assets || payload.mirrors || episode.assets || episode.mirrors).map((asset, index) => ({
    label: text(asset.label || asset.name, `Source ${index + 1}`),
    embed_url: text(asset.embed_url || asset.url),
  })).filter((asset) => asset.embed_url);
  const prevSlug = toSlugFromUrl(text(navigation.prev || payload.prev_url || episode.prev_url));
  const nextSlug = toSlugFromUrl(text(navigation.next || payload.next_url || episode.next_url));
  return {
    title: text(payload.title || payload.label || episode.title || episode.label),
    default_embed: text(payload.default_embed || payload.default_url || assets[0]?.embed_url || payload.canonical_url || episode.canonical_url),
    mirrors: assets,
    slug: text(payload.slug || episode.slug),
    navigation: {
      next: nextSlug || null,
      prev: prevSlug || null,
      anime_info: text(navigation.anime_info || payload.series_slug || payload.anime_slug || episode.series_slug || episode.anime_slug),
    },
  };
}

function normalizeSubtype(series) {
  const value = text(series.media_type || series.type).toLowerCase();
  if (value.includes('manhwa')) return 'manhwa';
  if (value.includes('manhua')) return 'manhua';
  return 'manga';
}

function animeDetailFromRaw(payload) {
  const primary = payload.primary || {};
  const mirror = payload.mirror || {};
  const catalog = payload.catalog || {};
  const episodes = uniqBy(
    [...ensureArray(primary.episodes), ...ensureArray(mirror.episodes)].map((episode) => ({
      episode_slug: text(episode.EpisodeSlug || episode.episode_slug),
      title: text(episode.Title || episode.title),
      episode_number: typeof episode.EpisodeNumber === 'number' ? episode.EpisodeNumber : Number(episode.episode_number || 0),
      release_label: text(episode.ReleaseDate || episode.release_date),
    })),
    (item) => item.episode_slug
  );

  return {
    slug: text(payload.slug),
    title: text(primary.Title || mirror.Title || catalog.title),
    alternativeTitle: '',
    status: text(primary.Metadata?.Status || mirror.Metadata?.Status || catalog.status, 'Unknown'),
    type: text(primary.Metadata?.Type || mirror.Metadata?.Type || catalog.anime_type, 'Anime'),
    synopsis: text(primary.Synopsis || mirror.Synopsis || catalog.synopsis_excerpt, 'No synopsis available for this anime.'),
    poster: text(primary.PosterURL || mirror.PosterURL || catalog.poster_url, '/favicon.ico'),
    genres: uniqBy([...ensureArray(primary.Genres), ...ensureArray(mirror.Genres), ...ensureArray(catalog.genres)], (item) => item),
    studio: uniqBy([...ensureArray(primary.Studios), ...ensureArray(mirror.Studios)], (item) => item).join(', '),
    rating: typeof catalog.score === 'number' && catalog.score > 0 ? String(catalog.score) : 'N/A',
    totalEpisodes: episodes.length > 0 ? String(episodes.length) : 'Unknown',
    cast: ensureArray(mirror.Cast).map((entry, index) => ({
      id: index + 1,
      name: text(entry.CharacterName || entry.character_name),
      role: text(entry.CharacterRole || entry.character_role),
      image: text(entry.CharacterImage || entry.character_image),
      secondary: text(entry.ActorName || entry.actor_name),
      secondaryLabel: text(entry.ActorRole || entry.actor_role),
    })),
    episodes,
    externalUrl: text(primary.CanonicalURL || mirror.CanonicalURL || catalog.canonical_url),
    trailerUrl: text(mirror.TrailerURL || mirror.trailer_url) || null,
    enrichment: null,
    latestEpisodeSlug: text(payload.latest_episode_slug),
  };
}

function animePlaybackFromRaw(payload, detail) {
  const primary = payload.primary || {};
  const mirror = payload.mirror || {};
  const streamMirrors = mirror.StreamMirrors || {};
  const mirrors = Object.entries(streamMirrors).map(([label, embedUrl]) => ({
    label,
    embed_url: text(embedUrl),
  }));
  const downloadGroups = Object.entries(primary.DirectDownloads || {}).flatMap(([format, qualities]) =>
    Object.entries(qualities || {}).map(([quality, links]) => ({
      format,
      quality,
      links: Object.entries(links || {}).map(([label, href]) => ({ label, href: text(href) })),
    }))
  );

  return {
    episodeSlug: text(payload.episode_slug || primary.EpisodeSlug || mirror.EpisodeSlug),
    animeSlug: text(payload.anime_slug),
    animeTitle: text(primary.AnimeTitle || mirror.AnimeTitle || detail?.title, 'Anime'),
    title: text(primary.Title || mirror.Title),
    episodeNumber: numberText(primary.EpisodeNumber || mirror.EpisodeNumber, '?'),
    releaseLabel: text(primary.PublishedAt || mirror.PublishedAt),
    synopsis: text(primary.SeriesSynopsis || mirror.SeriesSynopsis, 'Episode synopsis is not available yet.'),
    genres: uniqBy([...ensureArray(primary.SeriesGenres), ...ensureArray(mirror.SeriesGenres)], (item) => item),
    poster: text(primary.PosterURL || mirror.PosterURL || detail?.poster, '/favicon.ico'),
    animeDetailHref: `/anime/${text(payload.anime_slug)}`,
    mirrors,
    defaultUrl: text(mirror.PrimaryStream || mirrors[0]?.embed_url),
    serverOptions: ensureArray(primary.StreamOptions).map((option) => ({
      label: text(option.Label || option.label),
      postId: text(option.PostID || option.post_id),
      number: text(option.Number || option.number),
      type: text(option.Type || option.type),
    })),
    downloadGroups,
    playlist: ensureArray(detail?.episodes || []),
    prevEpisodeSlug: toSlugFromUrl(text(primary.PreviousEpisode || mirror.PreviousEpisode)),
    nextEpisodeSlug: toSlugFromUrl(text(primary.NextEpisode || mirror.NextEpisode)),
    externalUrl: text(primary.CanonicalURL || mirror.CanonicalURL),
    animeExternalUrl: text(primary.AnimeURL || mirror.AnimeURL || detail?.externalUrl),
    fetchStatus: 'ready',
  };
}

function movieDetailFromRaw(detail, catalogMap, fallbackSlug = '') {
  const resolvedSlug = text(detail.slug || detail.url || fallbackSlug);
  const card = catalogMap.get(resolvedSlug) || {};
  const related = ensureArray(detail.related).map(movieCardFromHome);
  return {
    slug: text(card.slug || detail.slug || detail.url || fallbackSlug),
    title: text(detail.title || card.title),
    poster: text(card.poster || detail.poster, '/favicon.ico'),
    backdrop: text(card.backdrop || card.poster || detail.poster, '/favicon.ico'),
    year: text(card.year, 'N/A'),
    rating: text(card.rating, 'N/A'),
    genres: uniqBy([...(text(card.genres) ? text(card.genres).split(',').map((item) => item.trim()) : []), ...ensureArray(detail.tags)], (item) => item),
    quality: text(card.status || card.quality || 'STREAM'),
    duration: text(card.duration, 'N/A'),
    synopsis: text(detail.synopsis, 'No synopsis available for this movie.'),
    cast: [],
    director: '',
    trailerUrl: null,
    externalUrl: text(detail.url),
    recommendations: related,
  };
}

function movieAssetCacheKey(item) {
  return `${text(item.title).toLowerCase()}#${text(item.year)}`;
}

async function resolveTMDBMovieAsset(item, cache) {
  const key = movieAssetCacheKey(item);
  if (!key || !text(item.title) || (!tmdbReadToken && !tmdbApiKey)) {
    return null;
  }
  if (cache.has(key)) {
    return cache.get(key);
  }
  const endpoint = new URL(`${tmdbBaseUrl}/search/movie`);
  endpoint.searchParams.set('query', text(item.title));
  endpoint.searchParams.set('include_adult', 'false');
  const year = text(item.year);
  if (year) {
    endpoint.searchParams.set('year', year);
  }
  if (!tmdbReadToken && tmdbApiKey) {
    endpoint.searchParams.set('api_key', tmdbApiKey);
  }
  const headers = { Accept: 'application/json' };
  if (tmdbReadToken) {
    headers.Authorization = `Bearer ${tmdbReadToken}`;
  }
  try {
    const response = await fetch(endpoint, { headers });
    if (!response.ok) {
      cache.set(key, null);
      return null;
    }
    const payload = await response.json();
    const result = Array.isArray(payload.results) ? payload.results[0] : null;
    const asset = result ? {
      poster: buildTMDBImageUrl(result.poster_path),
      backdrop: buildTMDBImageUrl(result.backdrop_path, 'w780'),
    } : null;
    cache.set(key, asset);
    return asset;
  } catch {
    cache.set(key, null);
    return null;
  }
}

async function enrichMovieCardsWithTMDB(items) {
  const cache = new Map();
  return Promise.all(items.map(async (item) => {
    const asset = await resolveTMDBMovieAsset(item, cache);
    if (!asset) return item;
    return {
      ...item,
      poster: asset.poster || item.poster,
      backdrop: asset.backdrop || item.backdrop || asset.poster || item.poster,
    };
  }));
}

function moviePlaybackFromRaw(stream, detailData) {
  const sourceUrl = text(stream.stream_url || stream.StreamURL);
  return {
    slug: detailData.slug,
    title: detailData.title,
    poster: detailData.poster,
    backdrop: detailData.backdrop,
    year: detailData.year,
    rating: detailData.rating,
    quality: detailData.quality,
    duration: detailData.duration,
    synopsis: detailData.synopsis,
    mirrors: sourceUrl ? [{ label: 'Primary', embed_url: sourceUrl }] : [],
    defaultUrl: sourceUrl,
    canInlinePlayback: false,
    externalUrl: sourceUrl || detailData.externalUrl,
    detailHref: `/movies/${detailData.slug}`,
    downloadGroups: [],
  };
}

function readingDetailFromRaw(series) {
  return {
    creator: text(series.author),
    slug: text(series.slug),
    title: text(series.title),
    title_indonesian: text(series.alt_title || series.title),
    image: text(series.cover_url),
    synopsis: text(series.synopsis),
    synopsis_full: text(series.synopsis),
    summary: text(series.synopsis),
    background_story: '',
    metadata: {
      type: text(series.type || series.media_type),
      author: text(series.author),
      status: text(series.status),
      concept: '',
      age_rating: '',
      reading_direction: 'vertical',
    },
    genres: ensureArray(series.genres).map((genre) => ({
      name: text(genre),
      slug: text(genre).toLowerCase().replace(/\s+/g, '-'),
      link: '#',
    })),
    chapters: ensureArray(series.chapters).map((chapter) => ({
      chapter: text(chapter.label || chapter.number),
      slug: text(chapter.slug),
      link: text(chapter.canonical_url),
      date: text(chapter.published_at),
    })),
    similar_manga: [],
  };
}

function readingPlaybackFromRaw(chapter) {
  const nextSlug = toSlugFromUrl(text(chapter.NextURL || chapter.next_url));
  const prevSlug = toSlugFromUrl(text(chapter.PrevURL || chapter.prev_url));
  return {
    title: text(chapter.title),
    manga_title: text(chapter.SeriesTitle || chapter.series_title),
    chapter_title: text(chapter.Label || chapter.label || chapter.title),
    images: ensureArray(chapter.Pages || chapter.pages).map((page) => text(page.URL || page.url)).filter(Boolean),
    navigation: {
      next: nextSlug || null,
      prev: prevSlug || null,
      nextChapter: nextSlug || null,
      previousChapter: prevSlug || null,
    },
  };
}

async function main() {
  const manifestPath = path.join(rawRoot, 'manifest.json');
  const rawManifest = await readJson(manifestPath);
  const previousRoot = path.join(path.dirname(outputRoot), `.${path.basename(outputRoot)}-previous`);
  const previousManifest = await readJsonIfExists(path.join(outputRoot, 'manifest.json'));

  const readPayload = async (entry) => {
    const doc = await readJson(path.join(rawRoot, entry.path));
    return doc.payload;
  };

  const entriesBy = (domain, kind) =>
    rawManifest.entries.filter((entry) => entry.domain === domain && entry.kind === kind);

  const movieHomeEntries = entriesBy('movie', 'home');
  const movieCatalogEntries = entriesBy('movie', 'catalog');
  const movieSearchEntries = entriesBy('movie', 'search');
  const movieTitleEntries = entriesBy('movie', 'title');
  const moviePlaybackEntries = entriesBy('movie', 'playback');
  const animeCatalogEntries = entriesBy('anime', 'catalog');
  const animeTitleEntries = entriesBy('anime', 'title');
  const animePlaybackEntries = entriesBy('anime', 'playback');
  const donghuaHomeEntries = entriesBy('donghua', 'home');
  const donghuaCatalogEntries = entriesBy('donghua', 'catalog');
  const donghuaSearchEntries = entriesBy('donghua', 'search');
  const donghuaTitleEntries = entriesBy('donghua', 'title');
  const donghuaPlaybackEntries = entriesBy('donghua', 'playback');
  const readingDomains = ['manhwaindo', 'komiku'];
  const hasRawEntriesForDomain = (domain) => rawManifest.entries.some((entry) => entry.domain === domain);
  const hasPreservedDomain = (domain) => Boolean(previousManifest?.domains?.[domain]);

  const movieHomeDocs = await enrichMovieCardsWithTMDB((await Promise.all(movieHomeEntries.map(readPayload))).flat().map(movieCardFromHome));
  const movieCatalogDocs = await enrichMovieCardsWithTMDB((
    await Promise.all(movieCatalogEntries.map(readPayload))
  ).flat().map(movieCardFromHome));
  const movieSearchDocs = await enrichMovieCardsWithTMDB((
    await Promise.all(movieSearchEntries.map(readPayload))
  ).flat().map(movieCardFromHome));
  const allMovieCards = uniqBy([...movieHomeDocs, ...movieCatalogDocs, ...movieSearchDocs], (item) => item.slug);
  const movieCatalogMap = new Map(allMovieCards.map((item) => [item.slug, item]));

  const animeCatalogDocs = (
    await Promise.all(animeCatalogEntries.map(readPayload))
  ).flat().map(animeCardFromCatalog);
  const donghuaHomeDocs = (await Promise.all(donghuaHomeEntries.map(readPayload))).flat();
  const donghuaCatalogDocs = (
    await Promise.all(donghuaCatalogEntries.map(readPayload))
  ).flat().map((payload) => ensureArray(payload.items || payload).map(donghuaCardFromCatalog)).flat();
  const donghuaSearchDocs = (
    await Promise.all(donghuaSearchEntries.map(readPayload))
  ).flat().map((payload) => ensureArray(payload.data || payload.items || payload.results || payload).map(donghuaCardFromCatalog)).flat();
  const donghuaCards = uniqBy([
    ...donghuaHomeDocs.flatMap((payload) => ensureArray(payload.latest_updates).map(donghuaCardFromCatalog)),
    ...donghuaHomeDocs.flatMap((payload) => ensureArray(payload.ongoing_series).map(donghuaCardFromCatalog)),
    ...donghuaCatalogDocs,
    ...donghuaSearchDocs,
  ], (item) => item.slug);

  const readingCatalogDocs = [];
  const readingTitleDocs = [];
  const readingPlaybackDocs = [];
  for (const domain of readingDomains) {
    readingCatalogDocs.push(...(await Promise.all(entriesBy(domain, 'catalog').map(readPayload))).flat());
    readingTitleDocs.push(...(await Promise.all(entriesBy(domain, 'title').map(readPayload))).flat());
    readingPlaybackDocs.push(...(await Promise.all(entriesBy(domain, 'playback').map(readPayload))).flat());
  }

  await seedExistingOutput(outputRoot, previousRoot);

  const titleLookup = new Map();
  const playbackSlugsByDomain = {
    anime: [],
    movies: [],
    manga: [],
    manhwa: [],
    manhua: [],
    donghua: [],
  };

  const canRewriteMovieSummaries = allMovieCards.length > 0 || !hasPreservedDomain('movies');
  if (canRewriteMovieSummaries) {
    await writeJson(path.join(outputRoot, 'domains', 'movies', 'home.json'), {
      popular: allMovieCards.slice(0, 24),
      latest: allMovieCards.slice(0, 24),
      trending: allMovieCards.slice(0, 24),
      items: allMovieCards.slice(0, 24),
    });
    await writeJson(path.join(outputRoot, 'domains', 'movies', 'catalog.json'), { items: allMovieCards });
    await writeJson(path.join(outputRoot, 'domains', 'movies', 'search.json'), { items: allMovieCards });
  }

  for (const entry of movieTitleEntries) {
    const payload = await readPayload(entry);
    const normalized = movieDetailFromRaw(payload, movieCatalogMap, entry.name);
    if (!normalized.slug) continue;
    titleLookup.set(`movies:${normalized.slug}`, normalized);
    await writeJson(path.join(outputRoot, 'titles', 'movies', `${normalized.slug}.json`), normalized);
  }
  for (const entry of moviePlaybackEntries) {
    const payload = await readPayload(entry);
    const detail = titleLookup.get(`movies:${entry.name}`);
    if (!detail?.slug) continue;
    const normalized = moviePlaybackFromRaw(payload, detail);
    playbackSlugsByDomain.movies.push(normalized.slug);
    await writeJson(path.join(outputRoot, 'playback', 'movies', `${normalized.slug}.json`), normalized);
  }

  await writeJson(path.join(outputRoot, 'domains', 'anime', 'home.json'), {
    ongoing: animeCatalogDocs.slice(0, 24),
    popular: animeCatalogDocs.slice(0, 24),
    trending: animeCatalogDocs.slice(0, 24),
    latest: animeCatalogDocs.slice(0, 24),
    items: animeCatalogDocs.slice(0, 24),
  });
  await writeJson(path.join(outputRoot, 'domains', 'anime', 'catalog.json'), { items: animeCatalogDocs });
  await writeJson(path.join(outputRoot, 'domains', 'anime', 'search.json'), { items: animeCatalogDocs });

  for (const entry of animeTitleEntries) {
    const payload = await readPayload(entry);
    const normalized = animeDetailFromRaw(payload);
    titleLookup.set(`anime:${normalized.slug}`, normalized);
    await writeJson(path.join(outputRoot, 'titles', 'anime', `${normalized.slug}.json`), normalized);
  }
  for (const entry of animePlaybackEntries) {
    const payload = await readPayload(entry);
    const detail = titleLookup.get(`anime:${payload.anime_slug}`);
    if (!detail) continue;
    const normalized = animePlaybackFromRaw(payload, detail);
    if (!normalized.episodeSlug) continue;
    playbackSlugsByDomain.anime.push(normalized.episodeSlug);
    await writeJson(path.join(outputRoot, 'playback', 'anime', `${normalized.episodeSlug}.json`), normalized);
  }

  const donghuaLatestItems = uniqBy(
    donghuaHomeDocs.flatMap((payload) => ensureArray(payload.latest_updates).map(donghuaCardFromCatalog)),
    (item) => item.slug
  );
  const donghuaOngoingItems = uniqBy(
    donghuaHomeDocs.flatMap((payload) => ensureArray(payload.ongoing_series).map(donghuaCardFromCatalog)),
    (item) => item.slug
  );

  await writeJson(path.join(outputRoot, 'domains', 'donghua', 'home.json'), {
    latest_updates: donghuaLatestItems.slice(0, 24),
    ongoing_series: donghuaOngoingItems.slice(0, 24),
    popular: donghuaOngoingItems.slice(0, 24),
    trending: donghuaOngoingItems.slice(0, 24),
    items: donghuaCards.slice(0, 24),
  });
  await writeJson(path.join(outputRoot, 'domains', 'donghua', 'catalog.json'), { items: donghuaCards });
  await writeJson(path.join(outputRoot, 'domains', 'donghua', 'search.json'), {
    items: donghuaSearchDocs.length > 0 ? uniqBy(donghuaSearchDocs, (item) => item.slug) : donghuaCards,
  });

  for (const entry of donghuaTitleEntries) {
    const payload = await readPayload(entry);
    const normalized = donghuaDetailFromRaw(payload);
    const titleSlug = text(normalized.slug || entry.name);
    if (!titleSlug || !normalized.title) continue;
    titleLookup.set(`donghua:${titleSlug}`, { ...normalized, slug: titleSlug });
    await writeJson(path.join(outputRoot, 'titles', 'donghua', `${titleSlug}.json`), { ...normalized, slug: titleSlug });
  }
  for (const entry of donghuaPlaybackEntries) {
    const payload = await readPayload(entry);
    const normalized = donghuaPlaybackFromRaw(payload);
    if (!normalized.slug) continue;
    playbackSlugsByDomain.donghua.push(normalized.slug);
    await writeJson(path.join(outputRoot, 'playback', 'donghua', `${normalized.slug}.json`), normalized);
  }

  const readingCardsBySubtype = { manga: [], manhwa: [], manhua: [] };
  for (const series of readingCatalogDocs) {
    readingCardsBySubtype[normalizeSubtype(series)].push(readingCardFromSeries(series));
  }
  for (const subtype of ['manga', 'manhwa', 'manhua']) {
    const items = uniqBy(readingCardsBySubtype[subtype], (item) => item.slug);
    await writeJson(path.join(outputRoot, 'domains', subtype, 'home.json'), {
      popular: items.slice(0, 24),
      newest: items.slice(0, 24),
      items: items.slice(0, 24),
    });
    await writeJson(path.join(outputRoot, 'domains', subtype, 'catalog.json'), { items });
    await writeJson(path.join(outputRoot, 'domains', subtype, 'search.json'), { items });
  }

  const readingSubtypeBySlug = new Map();
  for (const series of readingTitleDocs) {
    const subtype = normalizeSubtype(series);
    const normalized = readingDetailFromRaw(series);
    readingSubtypeBySlug.set(normalized.slug, subtype);
    titleLookup.set(`${subtype}:${normalized.slug}`, normalized);
    await writeJson(path.join(outputRoot, 'titles', subtype, `${normalized.slug}.json`), normalized);
  }
  for (const chapter of readingPlaybackDocs) {
    const seriesSlug = text(chapter.SeriesSlug || chapter.series_slug);
    const subtype = readingSubtypeBySlug.get(seriesSlug);
    if (!subtype) continue;
    const normalized = readingPlaybackFromRaw(chapter);
    const chapterSlug = text(chapter.Slug || chapter.slug);
    if (!chapterSlug) continue;
    playbackSlugsByDomain[subtype].push(chapterSlug);
    await writeJson(path.join(outputRoot, 'playback', subtype, `${chapterSlug}.json`), normalized);
  }

  const manifest = {
    version: '1',
    generatedAt: new Date().toISOString(),
    domains: {
      anime: {
        hotSlugs: animeTitleEntries.map((entry) => entry.name),
        hotPlaybackSlugs: uniqBy(playbackSlugsByDomain.anime, (item) => item),
      },
      movies: {
        hotSlugs: movieTitleEntries.map((entry) => entry.name),
        hotPlaybackSlugs: uniqBy(playbackSlugsByDomain.movies, (item) => item),
      },
      manga: {
        hotSlugs: Array.from(readingSubtypeBySlug.entries()).filter(([, subtype]) => subtype === 'manga').map(([slug]) => slug),
        hotPlaybackSlugs: uniqBy(playbackSlugsByDomain.manga, (item) => item),
      },
      manhwa: {
        hotSlugs: Array.from(readingSubtypeBySlug.entries()).filter(([, subtype]) => subtype === 'manhwa').map(([slug]) => slug),
        hotPlaybackSlugs: uniqBy(playbackSlugsByDomain.manhwa, (item) => item),
      },
      manhua: {
        hotSlugs: Array.from(readingSubtypeBySlug.entries()).filter(([, subtype]) => subtype === 'manhua').map(([slug]) => slug),
        hotPlaybackSlugs: uniqBy(playbackSlugsByDomain.manhua, (item) => item),
      },
      donghua: {
        hotSlugs: Array.from(titleLookup.keys())
          .filter((key) => key.startsWith('donghua:'))
          .map((key) => key.replace(/^donghua:/, '')),
        hotPlaybackSlugs: uniqBy(playbackSlugsByDomain.donghua, (item) => item),
      },
    },
  };

  if (previousManifest?.domains && typeof previousManifest.domains === 'object') {
    for (const domain of ['anime', 'movies', 'manga', 'manhwa', 'manhua', 'donghua']) {
      const rawDomain = domain === 'movies' ? 'movie' : domain;
      if (!hasRawEntriesForDomain(rawDomain) && previousManifest.domains[domain]) {
        manifest.domains[domain] = previousManifest.domains[domain];
      }
    }
  }

  await writeJson(path.join(outputRoot, 'manifest.json'), manifest);
  const bundleSizeBytes = await getDirSizeBytes(outputRoot);
  if (Number.isFinite(maxSnapshotBytes) && maxSnapshotBytes > 0 && bundleSizeBytes > maxSnapshotBytes) {
    throw new Error(`snapshot bundle exceeds MAX_SNAPSHOT_BYTES: ${bundleSizeBytes} > ${maxSnapshotBytes}`);
  }
  await fs.rm(previousRoot, { recursive: true, force: true });
  console.log(`snapshot bundle written to ${outputRoot} (${bundleSizeBytes} bytes)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
