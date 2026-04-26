import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const movieAdapterPath = path.join(__dirname, '..', 'src', 'lib', 'adapters', 'movie.ts');
const enrichmentPath = path.join(__dirname, '..', 'src', 'lib', 'enrichment.ts');
const moviesPagePath = path.join(__dirname, '..', 'src', 'app', '(public)', 'watch', 'movies', 'page.tsx');
const moviesPageDataPath = path.join(__dirname, '..', 'src', 'features', 'movies', 'server', 'loadMoviePageData.ts');
const moviesClientPath = path.join(__dirname, '..', 'src', 'features', 'movies', 'MoviesPageClient.tsx');
const cardPath = path.join(__dirname, '..', 'src', 'components', 'atoms', 'Card.tsx');
const apiPath = path.join(__dirname, '..', 'src', 'lib', 'api.ts');

assert.equal(fs.existsSync(apiPath), false, 'legacy src/lib/api.ts should be removed');

const adapterSource = fs.readFileSync(movieAdapterPath, 'utf8');
const enrichmentSource = fs.readFileSync(enrichmentPath, 'utf8');
const moviesPageSource = fs.readFileSync(moviesPagePath, 'utf8');
const moviesPageDataSource = fs.readFileSync(moviesPageDataPath, 'utf8');
const moviesClientSource = fs.readFileSync(moviesClientPath, 'utf8');
const cardSource = fs.readFileSync(cardPath, 'utf8');

for (const token of [
  'getMovieHomeSection',
  'getMovieHubData',
  'getMovieDetailBySlug',
  'getMovieWatchBySlug',
  'searchMovieCatalog',
  'getMovieGenreItems',
]) {
  assert.ok(adapterSource.includes(token), `movie adapter is missing: ${token}`);
}

for (const token of [
  'getMovieMetadata',
  'resolveMovieVisuals',
]) {
  assert.ok(enrichmentSource.includes(token), `movie enrichment is missing: ${token}`);
}

assert.ok(
  moviesPageSource.includes(`@/features/movies/WatchMoviesPage`) && moviesPageDataSource.includes(`@/lib/adapters/movie`),
  'movies page should use movie adapter through the watch movies feature loader',
);
assert.ok(!cardSource.includes(`from '@/lib/enrichment'`), 'Card should not depend on external enrichment at runtime');
assert.ok(moviesClientSource.includes(`type="movie"`), 'movies client should still render movie hub');

console.log('Movie adapter smoke checks passed.');
