import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const animeAdapterPath = path.join(__dirname, '..', 'src', 'lib', 'adapters', 'anime.ts');
const animePageClientPath = path.join(__dirname, '..', 'src', 'app', 'anime', 'AnimePageClient.tsx');
const animeGenrePagePath = path.join(__dirname, '..', 'src', 'app', 'anime', 'genres', '[slug]', 'page.tsx');
const apiPath = path.join(__dirname, '..', 'src', 'lib', 'api.ts');

assert.equal(fs.existsSync(apiPath), false, 'legacy src/lib/api.ts should be removed');

const adapterSource = fs.readFileSync(animeAdapterPath, 'utf8');
const clientSource = fs.readFileSync(animePageClientPath, 'utf8');
const genrePageSource = fs.readFileSync(animeGenrePagePath, 'utf8');

for (const token of [
  'export async function getAnimeHomeItems',
  'export async function getAnimeHubData',
  'export async function getAnimeIndexData',
  'export async function searchAnimeCatalog',
  'export async function getAnimeDetailBySlug',
  'export async function getAnimeEpisodeBySlug',
  'export async function getAnimeSchedule',
  'export async function getCompletedAnimePage',
  'export async function getOngoingAnime',
  'export async function getKanataGenres',
  'export async function getKanataAnimeByGenre',
  'export async function getAnimeBatch',
  'export const searchAnime = searchAnimeCatalog',
]) {
  assert.ok(adapterSource.includes(token), `anime adapter is missing: ${token}`);
}

assert.ok(clientSource.includes(`from '@/lib/adapters/anime'`), 'AnimePageClient should use anime adapter');
assert.ok(genrePageSource.includes(`from '@/lib/adapters/anime'`), 'anime genre page should use anime adapter');

console.log('Anime adapter smoke checks passed.');
