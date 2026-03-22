/* eslint-disable */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

  const respond = (data) => ({
    ok: true,
    status: 200,
    json: async () => data,
  });

  const parsed = new URL(url);
  if (parsed.pathname.endsWith('/home')) {
    return respond({
      data: [
        { slug: 'mission-impossible', title: 'Mission: Impossible', poster: '/poster.jpg', year: '2024', type: 'movie', rating: '8.4' },
      ],
    });
  }

  if (parsed.pathname.endsWith('/search')) {
    return respond({
      data: [
        { slug: 'mission-impossible', title: 'Mission: Impossible', poster: '/poster.jpg', year: '2024', type: 'movie' },
      ],
    });
  }

  if (parsed.pathname.includes('/detail/')) {
    return respond({
      data: {
        slug: parsed.pathname.split('/').pop(),
        title: 'Mission: Impossible',
        poster: '/poster.jpg?cache=bust',
        year: '2024',
        rating: '8.4',
        genres: 'Action, Thriller',
        type: 'movie',
        duration: '2h 30m',
        synopsis: 'Spy thriller',
        quality: '1080p',
        recommendations: [
          { slug: 'rec-one', title: 'Rec One', poster: '/rec.jpg', year: '2023', type: 'movie' },
        ],
      },
    });
  }

  if (parsed.pathname.endsWith('/stream')) {
    return respond({ data: 'https://stream.example/embed/mission-impossible' });
  }

  if (parsed.pathname.includes('/genre/')) {
    return respond({
      data: [
        { slug: 'genre-hit', title: 'Genre Hit', poster: '/genre.jpg', year: '2022', type: 'movie' },
      ],
    });
  }

  throw new Error(`Unexpected fetch: ${url}`);
};

global.fetch = mockFetch;

const module = { exports: {} };
const runner = new Function('exports', 'require', 'module', '__filename', '__dirname', compiled);
runner(module.exports, require, module, sourcePath, path.dirname(sourcePath));

const { movie, getMovieHome, searchMovies, getMoviesByGenre, getMovieDetail, getMovieStream, getRandomMedia } = module.exports;

fetchCalls.length = 0;
const home = await getMovieHome('popular');
assert.equal(home.length, 1);
assert.equal(home[0].slug, 'mission-impossible');
assert.equal(home[0].poster, '/poster.jpg');
assert.equal(new URL(fetchCalls[0]).searchParams.get('section'), 'popular');

fetchCalls.length = 0;
const search = await searchMovies('mission film', 1);
assert.equal(search[0].title, 'Mission: Impossible');
assert.equal(new URL(fetchCalls[0]).searchParams.get('q'), 'mission film');
assert.equal(new URL(fetchCalls[0]).searchParams.get('page'), '1');

fetchCalls.length = 0;
const detail = await getMovieDetail('mission-impossible');
assert.equal(detail.slug, 'mission-impossible');
assert.equal(detail.poster, '/poster.jpg?cache=bust');
assert.equal(detail.recommendations?.[0].poster, '/rec.jpg');
assert.equal(new URL(fetchCalls[0]).pathname.endsWith('/detail/mission-impossible'), true);

fetchCalls.length = 0;
const stream = await getMovieStream('mission-impossible', 'movie');
assert.equal(stream, 'https://stream.example/embed/mission-impossible');
assert.equal(new URL(fetchCalls[0]).searchParams.get('id'), 'mission-impossible');

fetchCalls.length = 0;
const byGenre = await getMoviesByGenre('action');
assert.equal(byGenre[0].slug, 'genre-hit');
assert.equal(new URL(fetchCalls[0]).pathname.endsWith('/genre/action'), true);

fetchCalls.length = 0;
const random = await getRandomMedia('movie');
assert.equal(random.slug, 'mission-impossible');

assert.equal(movie.getHome('trending') instanceof Promise, true);

console.log('MovieTube dataflow checks passed.');
