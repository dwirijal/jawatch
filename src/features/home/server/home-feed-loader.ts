import 'server-only';

import { unstable_cache } from 'next/cache';
import { getNewManga, getPopularManga } from '@/lib/adapters/comic-server';
import { getMovieHubData } from '@/lib/adapters/movie';
import { getSeriesHubData } from '@/lib/adapters/series';
import { buildSearchWarmDocuments, warmSearchIndexDocuments } from '@/domains/search/server/search-service';
import { shouldWarmSearchIndex } from '@/lib/server/build-phase';
import { resolveViewerNsfwAccess } from '@/lib/server/viewer-nsfw-access';
import {
  buildHomeHeroItems,
  buildHomeSection,
  bucketComicItems,
  bucketSeriesItems,
  SECTION_LIMIT,
  toMovieItems,
  toSeriesItems,
  toSeriesScheduleItems,
  type HomePageData,
  uniqueItemsById,
} from './home-feed-shared.ts';

const HOME_FEED_REVALIDATE_SECONDS = 60 * 5;
const HOME_FEED_CACHE_VERSION = 'ia-v2';
const HOME_FEED_PRELOAD_LIMIT = 24;

async function buildHomePageData(includeNsfw: boolean): Promise<HomePageData> {
  const [seriesHub, movieHub, mangaPopularResponse, mangaLatestResponse] = await Promise.all([
    getSeriesHubData(HOME_FEED_PRELOAD_LIMIT, { includeNsfw, includeFilters: false }).catch(() => ({
      popular: [],
      latest: [],
      dramaSpotlight: [],
      weeklySchedule: [],
      filters: [],
    })),
    getMovieHubData(HOME_FEED_PRELOAD_LIMIT, { includeNsfw }).catch(() => ({ popular: [], latest: [] })),
    getPopularManga(HOME_FEED_PRELOAD_LIMIT, { includeNsfw }).catch(() => ({ comics: [] })),
    getNewManga(1, HOME_FEED_PRELOAD_LIMIT, { includeNsfw }).catch(() => ({ comics: [] })),
  ]);
  const mangaPopularItems = mangaPopularResponse.comics || [];
  const mangaLatestItems = mangaLatestResponse.comics || [];

  if (shouldWarmSearchIndex()) {
    void warmSearchIndexDocuments(buildSearchWarmDocuments({
      series: [
        ...seriesHub.popular.slice(0, 16),
        ...seriesHub.latest.slice(0, 16),
        ...seriesHub.dramaSpotlight.slice(0, 8),
      ],
      movies: [
        ...movieHub.popular.slice(0, 16),
        ...movieHub.latest.slice(0, 16),
      ],
      comics: [
        ...mangaPopularItems.slice(0, 16),
        ...mangaLatestItems.slice(0, 16),
      ],
    }));
  }

  const seriesBuckets = bucketSeriesItems(seriesHub.latest);
  const seriesPopularItems = toSeriesItems(seriesHub.popular);
  const seriesDramaItems = toSeriesItems(seriesHub.dramaSpotlight);
  const releaseRadarItems = toSeriesScheduleItems(seriesHub.weeklySchedule);

  const movieLatestItems = toMovieItems(movieHub.latest);
  const moviePopularItems = toMovieItems(movieHub.popular);

  const comicBuckets = bucketComicItems(
    mangaLatestItems,
    mangaPopularItems,
  );

  const popularMedia = uniqueItemsById([
    ...seriesPopularItems.slice(0, 4),
    ...moviePopularItems.slice(0, 4),
    ...comicBuckets.popular.slice(0, 4),
    ...seriesBuckets.donghua.slice(0, 4),
  ]).slice(0, SECTION_LIMIT);

  const loversByCommunity = uniqueItemsById([
    ...comicBuckets.popular.slice(0, 5),
    ...seriesBuckets.donghua.slice(0, 4),
    ...seriesPopularItems.slice(0, 4),
  ]).slice(0, SECTION_LIMIT);

  const freshThisWeek = uniqueItemsById([
    ...seriesBuckets.latest.slice(0, 4),
    ...movieLatestItems.slice(0, 4),
    ...comicBuckets.latest.slice(0, 4),
    ...seriesBuckets.donghua.slice(0, 4),
  ]).slice(0, SECTION_LIMIT);

  const sections = [
    buildHomeSection('series-latest', 'Series Baru Update', 'Episode dan judul yang baru diperbarui buat lanjut nonton.', 'series', seriesBuckets.latest, '/watch/series#latest'),
    buildHomeSection('series-popular', 'Series Lagi Ramai', 'Judul episodik yang paling sering dibuka penonton.', 'popular', seriesPopularItems, '/watch/series#popular'),
    buildHomeSection('movie-latest', 'Film Baru Update', 'Film yang baru masuk atau baru dirapikan di rak film.', 'movie', movieLatestItems, '/watch/movies#latest'),
    buildHomeSection('series-anime', 'Anime Pilihan', 'Anime Jepang yang gampang kamu temukan dari rak series.', 'series', seriesBuckets.anime, '/watch/series?type=anime'),
    buildHomeSection('series-radar', 'Jadwal Rilis', 'Cek jadwal update mingguan sebelum pilih episode berikutnya.', 'series', releaseRadarItems, '/watch/series#release-radar'),
    buildHomeSection('series-donghua', 'Sorotan Donghua', 'Donghua dari China yang lagi aktif update.', 'series', seriesBuckets.donghua, '/watch/series?type=donghua'),
    buildHomeSection('series-drama', 'Sorotan Drama', 'Drama episodik yang lagi ramai dibuka.', 'series', seriesDramaItems, '/watch/series?type=drama'),
    buildHomeSection('series-japan', 'Rilis Jepang', 'Series dari Jepang buat kamu yang lagi cari tontonan baru.', 'series', seriesBuckets.japan, '/watch/series?type=anime'),
    buildHomeSection('series-china', 'Rilis China', 'Donghua dan live-action China dalam satu rak yang mudah dipilih.', 'series', seriesBuckets.china, '/watch/series?type=donghua'),
    buildHomeSection('series-korea', 'Rilis Korea', 'Drama dan series Korea buat sesi nonton berikutnya.', 'series', seriesBuckets.korea, '/watch/series?type=drama'),
    buildHomeSection('manga-latest', 'Manga Baru Update', 'Manga yang baru masuk atau baru diperbarui.', 'manga', comicBuckets.manga, '/read/comics?type=manga'),
    buildHomeSection('manhwa-latest', 'Manhwa Baru Update', 'Manhwa yang baru masuk atau baru diperbarui.', 'manhwa', comicBuckets.manhwa, '/read/comics?type=manhwa'),
    buildHomeSection('manhua-latest', 'Manhua Baru Update', 'Manhua yang baru masuk atau baru diperbarui.', 'manhua', comicBuckets.manhua, '/read/comics?type=manhua'),
    buildHomeSection('popular-media', 'Lagi Populer', 'Pilihan yang ramai dibuka lintas kategori.', 'popular', popularMedia),
    buildHomeSection('top-reading', 'Paling Banyak Dibaca', 'Judul komik yang lagi sering dibaca.', 'reading', comicBuckets.popular, '/read/comics'),
    buildHomeSection('community-lovers', 'Favorit Komunitas', 'Pilihan yang lagi sering dibahas dan dibuka.', 'community', loversByCommunity),
    buildHomeSection('fresh-week', 'Baru Minggu Ini', 'Rangkuman rilisan baru yang lagi naik.', 'fresh', freshThisWeek),
  ];

  const heroItems = buildHomeHeroItems([
    ...moviePopularItems.slice(0, 2),
    ...seriesPopularItems.slice(0, 2),
    ...comicBuckets.popular.slice(0, 1),
    ...seriesBuckets.donghua.slice(0, 1),
  ], 5);

  return { sections, heroItems };
}

const getPublicHomePageData = unstable_cache(
  async () => buildHomePageData(false),
  ['home-page-data', HOME_FEED_CACHE_VERSION, 'public'],
  { revalidate: HOME_FEED_REVALIDATE_SECONDS },
);

const getAuthenticatedHomePageData = unstable_cache(
  async () => buildHomePageData(true),
  ['home-page-data', HOME_FEED_CACHE_VERSION, 'auth'],
  { revalidate: HOME_FEED_REVALIDATE_SECONDS },
);

export async function getHomePageData(options: { includeNsfw?: boolean } = {}): Promise<HomePageData> {
  const includeNsfw = options.includeNsfw ?? await resolveViewerNsfwAccess();
  return includeNsfw ? getAuthenticatedHomePageData() : getPublicHomePageData();
}
