/* eslint-disable */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourcePath = path.join(__dirname, '..', 'src', 'lib', 'api.ts');
const source = fs.readFileSync(sourcePath, 'utf8');

const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

const require = createRequire(import.meta.url);
const fetchCalls = [];

const mockFetch = async (input) => {
  const url = input.toString();
  fetchCalls.push(url);
  const parsed = new URL(url);
  const isOtakudesu = parsed.pathname.startsWith('/otakudesu');
  const isAnimasu = parsed.pathname.startsWith('/animasu');

  const respond = (data, ok = true, status = 200) => ({
    ok,
    status,
    json: async () => data,
  });

  if (isAnimasu && parsed.pathname.endsWith('/anime/series-alpha')) {
    return respond({ title: '', thumb: '', status: 'ongoing', alternative_title: '', type: 'TV', synopsis: '', genres: [], episodes: [], studio: '', rating: '', total_episodes: '' }, false, 500);
  }

  if (isOtakudesu && parsed.pathname.endsWith('/anime/series-alpha')) {
    return respond({
      title: 'Series Alpha',
      thumb: '/series-alpha.jpg',
      status: 'ongoing',
      alternative_title: 'Series Alpha Alt',
      type: 'TV',
      synopsis: 'Fallback detail',
      genres: ['Action'],
      episodes: [{ slug: 'episode-1', title: 'Episode 1', date: '2025-01-01' }],
      studio: 'Studio X',
      rating: 'PG-13',
      total_episodes: '12',
      download: [],
    });
  }

  if (parsed.pathname.endsWith('/episode/episode-1') && parsed.hostname.includes('api.kanata.web.id')) {
    return respond({
      title: 'Episode 1',
      default_embed: 'https://player.example/embed/episode-1',
      mirrors: [{ label: 'Primary', embed_url: 'https://player.example/embed/episode-1' }],
      slug: 'episode-1',
      navigation: { next: 'episode-2', prev: null, anime_info: 'series-alpha' },
    });
  }

  if (parsed.pathname.endsWith('/schedule')) {
    return respond([
      { day: 'Monday', anime_list: [{ title: 'Alpha', slug: 'alpha' }] },
    ]);
  }

  if (parsed.pathname.endsWith('/anime-list')) {
    return respond([{ letter: 'A', list: [{ title: 'Alpha', slug: 'alpha' }] }]);
  }

  if (parsed.pathname.endsWith('/batch/series-alpha')) {
    return respond({ title: 'Series Alpha', thumb: '/series-alpha.jpg', download_list: [] });
  }

  if (parsed.pathname.endsWith('/complete')) {
    return respond([{ title: 'Series Alpha', slug: 'series-alpha', thumb: '/series-alpha.jpg', episode: 'Complete', type: 'TV' }]);
  }

  if (parsed.pathname.endsWith('/genres')) {
    return respond([{ name: 'Action', slug: 'action' }]);
  }

  if (parsed.pathname.includes('/genres/')) {
    return respond([{ title: 'Genre Alpha', slug: 'genre-alpha', thumb: '/genre-alpha.jpg', episode: 'Episode 1', type: 'TV' }]);
  }

  if (parsed.pathname.endsWith('/search')) {
    return respond({ result: [{ title: 'Series Alpha', slug: 'series-alpha', thumb: '/series-alpha.jpg', episode: 'Episode 1', type: 'TV' }] });
  }

  throw new Error(`Unexpected fetch: ${url}`);
};

global.fetch = mockFetch;

const module = { exports: {} };
const runner = new Function('exports', 'require', 'module', '__filename', '__dirname', compiled);
runner(module.exports, require, module, sourcePath, path.dirname(sourcePath));

const {
  searchAnime,
  getAnimeSchedule,
  getAnimeDetail,
  getAnimeEpisode,
  getAnimeList,
  getAnimeBatch,
  getCompletedAnime,
  getKanataGenres,
  getKanataAnimeByGenre,
} = module.exports;

fetchCalls.length = 0;
const search = await searchAnime('series alpha');
assert.equal(search[0].slug, 'series-alpha');
assert.equal(new URL(fetchCalls[0]).searchParams.get('query'), 'series alpha');

fetchCalls.length = 0;
const schedule = await getAnimeSchedule();
assert.equal(schedule[0].day, 'Monday');
assert.equal(schedule[0].anime_list[0].slug, 'alpha');

fetchCalls.length = 0;
const detail = await getAnimeDetail('series-alpha');
assert.equal(detail.provider, 'otakudesu');
assert.equal(detail.title, 'Series Alpha');
assert.equal(detail.thumb, '/series-alpha.jpg');

fetchCalls.length = 0;
const episode = await getAnimeEpisode('episode-1', 'otakudesu');
assert.equal(episode.default_embed, 'https://player.example/embed/episode-1');
assert.equal(new URL(fetchCalls[0]).pathname.endsWith('/episode/episode-1'), true);

fetchCalls.length = 0;
const list = await getAnimeList();
assert.equal(list[0].letter, 'A');

fetchCalls.length = 0;
const batch = await getAnimeBatch('series-alpha');
assert.equal(batch.title, 'Series Alpha');

fetchCalls.length = 0;
const completed = await getCompletedAnime(2);
assert.equal(completed[0].slug, 'series-alpha');
assert.equal(new URL(fetchCalls[0]).searchParams.get('page'), '2');

fetchCalls.length = 0;
const genres = await getKanataGenres();
assert.equal(genres[0].slug, 'action');

fetchCalls.length = 0;
const byGenre = await getKanataAnimeByGenre('action', 3);
assert.equal(byGenre[0].slug, 'genre-alpha');
assert.equal(new URL(fetchCalls[0]).searchParams.get('page'), '3');

console.log('Anime dataflow checks passed.');
