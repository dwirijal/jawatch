import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.join(__dirname, '..');
const comicClientPath = path.join(repoRoot, 'src', 'lib', 'adapters', 'comic.ts');
const comicServerPath = path.join(repoRoot, 'src', 'lib', 'adapters', 'comic-server.ts');
const comicPagePath = path.join(repoRoot, 'src', 'app', 'comic', 'page.tsx');
const comicSubtypePagePaths = [
  path.join(repoRoot, 'src', 'app', 'comic', 'manga', 'page.tsx'),
  path.join(repoRoot, 'src', 'app', 'comic', 'manhwa', 'page.tsx'),
  path.join(repoRoot, 'src', 'app', 'comic', 'manhua', 'page.tsx'),
];
const comicSearchRoutePath = path.join(repoRoot, 'src', 'app', 'api', 'search', 'comic', 'route.ts');
const comicApiPaths = [
  path.join(repoRoot, 'src', 'app', 'api', 'comic', 'popular', 'route.ts'),
  path.join(repoRoot, 'src', 'app', 'api', 'comic', 'latest', 'route.ts'),
  path.join(repoRoot, 'src', 'app', 'api', 'comic', 'genre', 'route.ts'),
  path.join(repoRoot, 'src', 'app', 'api', 'comic', 'title', '[slug]', 'route.ts'),
  path.join(repoRoot, 'src', 'app', 'api', 'comic', 'chapter', '[slug]', 'route.ts'),
];

const comicClientSource = fs.readFileSync(comicClientPath, 'utf8');
const comicServerSource = fs.readFileSync(comicServerPath, 'utf8');
const comicPageSource = fs.readFileSync(comicPagePath, 'utf8');
const comicSearchRouteSource = fs.readFileSync(comicSearchRoutePath, 'utf8');

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
  'searchManga',
  'getMangaDetail',
  'getMangaChapter',
  'getPopularManga',
  'getNewManga',
  'getMangaByGenre',
]) {
  assert.ok(comicClientSource.includes(token), `comic adapter is missing: ${token}`);
  assert.ok(comicServerSource.includes(token), `comic server adapter is missing: ${token}`);
}

assert.ok(comicPageSource.includes(`ComicPageClient`), 'comic hub should use ComicPageClient');
assert.ok(comicSearchRouteSource.includes(`from '@/lib/adapters/comic-server'`), 'comic search route should use comic server adapter');

for (const pagePath of comicSubtypePagePaths) {
  const source = fs.readFileSync(pagePath, 'utf8');
  assert.ok(source.includes(`ComicPageClient`), `comic subtype page should use ComicPageClient: ${pagePath}`);
}

for (const routePath of comicApiPaths) {
  const source = fs.readFileSync(routePath, 'utf8');
  assert.ok(source.includes('Response.json'), `comic API route should return JSON: ${routePath}`);
}

assert.equal(countFiles(path.join(repoRoot, 'src', 'app', 'api', 'manga')), 0, 'legacy /api/manga routes should not contain files');
assert.equal(countFiles(path.join(repoRoot, 'src', 'app', 'manga')), 0, 'legacy /manga app routes should not contain files');

console.log('Comic dataflow checks passed.');
