import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.join(__dirname, '..');
const seriesAdapterPath = path.join(repoRoot, 'src', 'lib', 'adapters', 'series.ts');
const seriesPagePath = path.join(repoRoot, 'src', 'app', '(public)', 'watch', 'series', 'page.tsx');
const seriesClientPath = path.join(repoRoot, 'src', 'features', 'series', 'SeriesPageClient.tsx');
const seriesDetailPath = path.join(repoRoot, 'src', 'app', '(public)', 'series', '[slug]', 'page.tsx');
const seriesDetailDataPath = path.join(repoRoot, 'src', 'domains', 'series', 'server', 'series-detail-data.ts');
const seriesWatchPath = path.join(
  repoRoot,
  'src',
  'app',
  '(public)',
  'series',
  '[slug]',
  'ep',
  '[episodeNumber]',
  'page.tsx',
);
const searchRoutePath = path.join(repoRoot, 'src', 'app', 'api', 'search', 'series', 'route.ts');
const filterRoutePath = path.join(repoRoot, 'src', 'app', 'api', 'series', 'filter', 'route.ts');
const legacyRoutingPath = path.join(repoRoot, 'src', 'platform', 'gateway', 'legacy', 'routing.ts');

const adapterSource = fs.readFileSync(seriesAdapterPath, 'utf8');
const pageSource = fs.readFileSync(seriesPagePath, 'utf8');
const clientSource = fs.readFileSync(seriesClientPath, 'utf8');
const detailSource = fs.readFileSync(seriesDetailPath, 'utf8');
const detailDataSource = fs.readFileSync(seriesDetailDataPath, 'utf8');
const watchSource = fs.readFileSync(seriesWatchPath, 'utf8');
const searchRouteSource = fs.readFileSync(searchRoutePath, 'utf8');
const filterRouteSource = fs.readFileSync(filterRoutePath, 'utf8');
const legacyRoutingSource = fs.readFileSync(legacyRoutingPath, 'utf8');

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
  'getSeriesHubData',
  'getSeriesDetailBySlug',
  'getSeriesEpisodeBySlug',
  'searchSeriesCatalog',
  'getSeriesFilteredItems',
  'getSeriesBrowseItems',
]) {
  assert.ok(adapterSource.includes(token), `series adapter is missing: ${token}`);
}

assert.ok(pageSource.includes(`@/features/series/WatchSeriesPage`), 'series page should delegate to WatchSeriesPage');
assert.ok(clientSource.includes('release-radar') && clientSource.includes('Jadwal rilis'), 'series client should render release radar');
assert.ok(detailSource.includes(`@/domains/series/ui/SeriesDetailPage`), 'series detail page should delegate to SeriesDetailPage');
assert.ok(detailDataSource.includes(`@/lib/adapters/series`), 'series detail loader should use series adapter');
assert.ok(watchSource.includes(`@/features/series/SeriesEpisodePage`), 'series episode route should delegate to SeriesEpisodePage');
assert.ok(searchRouteSource.includes(`from '@/lib/adapters/series'`), 'series search route should use series adapter');
assert.ok(filterRouteSource.includes(`from '@/lib/adapters/series'`), 'series filter route should use series adapter');

assert.equal(countFiles(path.join(repoRoot, 'src', 'app', 'anime')), 0, 'legacy /anime routes should not contain files');
assert.equal(countFiles(path.join(repoRoot, 'src', 'app', 'donghua')), 0, 'legacy /donghua routes should not contain files');
assert.equal(fs.existsSync(path.join(repoRoot, 'src', 'lib', 'adapters', 'anime.ts')), false, 'legacy anime adapter should be removed');
assert.equal(fs.existsSync(path.join(repoRoot, 'src', 'lib', 'adapters', 'donghua.ts')), false, 'legacy donghua adapter should be removed');
assert.ok(legacyRoutingSource.includes("'/series/anime'"), 'legacy /series/anime should be handled by legacy routing');
assert.ok(legacyRoutingSource.includes("'/series/donghua'"), 'legacy /series/donghua should be handled by legacy routing');

console.log('Series dataflow checks passed.');
