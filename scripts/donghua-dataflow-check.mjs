 
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourcePath = path.join(__dirname, '..', 'src', 'lib', 'api.ts');
const source = fs
  .readFileSync(sourcePath, 'utf8')
  .replace(
    "import { withCloudflareEdgeCache } from './cloudflare-cache';",
    "const withCloudflareEdgeCache = async (_key, _ttl, loader) => loader();",
  )
  .replace(
    /import\s*\{\s*readSnapshotDomainFile,\s*readSnapshotPlayback,\s*readSnapshotTitle,\s*searchSnapshotDomain,\s*\}\s*from '\.\/runtime-snapshot';/,
    "const readSnapshotDomainFile = async () => null;\nconst readSnapshotPlayback = async () => null;\nconst readSnapshotTitle = async () => null;\nconst searchSnapshotDomain = async () => [];",
  );

const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;

const require = createRequire(import.meta.url);
const fetchCalls = [];

const respond = (data) => ({
  ok: true,
  status: 200,
  json: async () => data,
});

global.fetch = async (input) => {
  const url = input.toString();
  fetchCalls.push(url);
  const parsed = new URL(url);

  if (parsed.pathname.endsWith('/home')) {
    return respond({
      latest_updates: [
        { slug: 'peerless-divine-emperor', title: 'Peerless Divine Emperor', thumb: '/latest.jpg', episode: '12', status: 'ongoing' },
      ],
      ongoing_series: [
        { slug: 'ongoing-alpha', title: 'Ongoing Alpha', thumb: '/ongoing.jpg', episode: '24', status: 'ongoing' },
      ],
    });
  }

  if (parsed.pathname.endsWith('/search')) {
    if (parsed.searchParams.get('q') === 'raw-array') {
      return respond([
        { slug: 'raw-array-hit', title: 'Raw Array Hit', thumb: '/raw.jpg', episode: '2', status: 'ongoing' },
      ]);
    }

    return respond({
      data: [
        { slug: 'peerless-divine-emperor', title: 'Peerless Divine Emperor', thumb: '/search.jpg', episode: '12', status: 'ongoing' },
      ],
    });
  }

  if (parsed.pathname.includes('/detail/')) {
    return respond({
      title: 'Peerless Divine Emperor',
      meta: {
        status: 'ongoing',
        type: 'series',
        duration: '12 min',
        country: 'CN',
        episodes: '24',
        studio: 'Studio X',
        network: 'Network Y',
        released: '2025',
        season: 'Spring 2025',
        updated_on: '2025-01-01',
      },
      episodes: [
        { date: '2025-01-01', title: 'Episode 1', slug: 'episode-1', episode: '1' },
      ],
      synopsis: 'Cultivation story',
      thumb: '/detail.jpg',
      genres: ['Action', 'Fantasy'],
    });
  }

  if (parsed.pathname.includes('/episode/')) {
    return respond({
      title: 'Episode 1',
      default_embed: 'https://player.example/embed/episode-1',
      mirrors: [{ label: 'Primary', embed_url: 'https://player.example/embed/episode-1' }],
      slug: 'episode-1',
      navigation: { prev: null, next: 'episode-2', anime_info: 'peerless-divine-emperor' },
    });
  }

  throw new Error(`Unexpected fetch: ${url}`);
};

const cjsModule = { exports: {} };
const runner = new Function('exports', 'require', 'module', '__filename', '__dirname', compiled);
runner(cjsModule.exports, require, cjsModule, sourcePath, path.dirname(sourcePath));

const {
  getDonghuaHome,
  searchDonghua,
  getDonghuaDetail,
  getDonghuaEpisode,
  getDonghuaWatch,
  getRandomMedia,
  donghua,
} = cjsModule.exports;

fetchCalls.length = 0;
const home = await getDonghuaHome();
assert.equal(home.latest_updates[0].slug, 'peerless-divine-emperor');
assert.equal(home.ongoing_series[0].thumb, '/ongoing.jpg');
assert.equal(new URL(fetchCalls[0]).pathname.endsWith('/home'), true);

fetchCalls.length = 0;
const search = await searchDonghua('peerless');
assert.equal(search[0].slug, 'peerless-divine-emperor');
assert.equal(new URL(fetchCalls[0]).searchParams.get('q'), 'peerless');

fetchCalls.length = 0;
const rawArraySearch = await searchDonghua('raw-array');
assert.equal(rawArraySearch[0].slug, 'raw-array-hit');

fetchCalls.length = 0;
const detail = await getDonghuaDetail('peerless-divine-emperor');
assert.equal(detail.title, 'Peerless Divine Emperor');
assert.equal(detail.meta.status, 'ongoing');
assert.equal(detail.episodes[0].slug, 'episode-1');
assert.equal(new URL(fetchCalls[0]).pathname.endsWith('/detail/peerless-divine-emperor'), true);

fetchCalls.length = 0;
const episode = await getDonghuaEpisode('episode-1');
assert.equal(episode.default_embed, 'https://player.example/embed/episode-1');
assert.equal(new URL(fetchCalls[0]).pathname.endsWith('/episode/episode-1'), true);

fetchCalls.length = 0;
const watch = await getDonghuaWatch('episode-1');
assert.equal(watch.slug, 'episode-1');

fetchCalls.length = 0;
const random = await getRandomMedia('donghua');
assert.equal(random.slug, 'ongoing-alpha');

assert.equal(donghua.getHome() instanceof Promise, true);

console.log('Donghua dataflow checks passed.');
