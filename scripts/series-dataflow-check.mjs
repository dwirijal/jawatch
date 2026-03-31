import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.join(__dirname, '..');
const seriesAdapterPath = path.join(repoRoot, 'src', 'lib', 'adapters', 'series.ts');
const seriesPagePath = path.join(repoRoot, 'src', 'app', 'series', 'page.tsx');
const seriesClientPath = path.join(repoRoot, 'src', 'app', 'series', 'SeriesPageClient.tsx');
const seriesDetailPath = path.join(repoRoot, 'src', 'app', 'series', '[slug]', 'page.tsx');
const seriesWatchPath = path.join(repoRoot, 'src', 'app', 'series', 'watch', '[slug]', 'page.tsx');
const searchRoutePath = path.join(repoRoot, 'src', 'app', 'api', 'search', 'series', 'route.ts');
const filterRoutePath = path.join(repoRoot, 'src', 'app', 'api', 'series', 'filter', 'route.ts');

const adapterSource = fs.readFileSync(seriesAdapterPath, 'utf8');
const pageSource = fs.readFileSync(seriesPagePath, 'utf8');
const clientSource = fs.readFileSync(seriesClientPath, 'utf8');
const detailSource = fs.readFileSync(seriesDetailPath, 'utf8');
const watchSource = fs.readFileSync(seriesWatchPath, 'utf8');
const searchRouteSource = fs.readFileSync(searchRoutePath, 'utf8');
const filterRouteSource = fs.readFileSync(filterRoutePath, 'utf8');
const nextConfigSource = fs.readFileSync(path.join(repoRoot, 'next.config.ts'), 'utf8');

function countFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  let count = 0;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(absolutePath);
    } else if (entry.isFile()) {
      count += 1;
    }
  }
  return count;
}

for (const token of [
  'export async function getSeriesHubData',
  'export async function getSeriesDetailBySlug',
  'export async function getSeriesEpisodeBySlug',
  'export async function searchSeriesCatalog',
  'export async function getSeriesFilteredItems',
  'export async function getSeriesBrowseItems',
]) {
  assert.ok(adapterSource.includes(token), `series adapter is missing: ${token}`);
}

assert.ok(pageSource.includes(`from '@/lib/adapters/series'`), 'series page should use series adapter');
assert.ok(clientSource.includes('Release Radar'), 'series client should render Release Radar');
assert.ok(detailSource.includes(`from '@/lib/adapters/series'`), 'series detail page should use series adapter');
assert.ok(watchSource.includes(`from '@/components/organisms/MediaWatchPage'`), 'series watch page should use shared MediaWatchPage');
assert.ok(searchRouteSource.includes(`from '@/lib/adapters/series'`), 'series search route should use series adapter');
assert.ok(filterRouteSource.includes(`from '@/lib/adapters/series'`), 'series filter route should use series adapter');

assert.equal(countFiles(path.join(repoRoot, 'src', 'app', 'anime')), 0, 'legacy /anime routes should not contain files');
assert.equal(countFiles(path.join(repoRoot, 'src', 'app', 'donghua')), 0, 'legacy /donghua routes should not contain files');
assert.equal(fs.existsSync(path.join(repoRoot, 'src', 'lib', 'adapters', 'anime.ts')), false, 'legacy anime adapter should be removed');
assert.equal(fs.existsSync(path.join(repoRoot, 'src', 'lib', 'adapters', 'donghua.ts')), false, 'legacy donghua adapter should be removed');
assert.ok(nextConfigSource.includes("['/anime', '/series/anime']"), 'legacy /anime should redirect to /series/anime');
assert.ok(nextConfigSource.includes("['/donghua', '/series/donghua']"), 'legacy /donghua should redirect to /series/donghua');

console.log('Series dataflow checks passed.');
