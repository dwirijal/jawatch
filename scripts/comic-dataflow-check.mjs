import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.join(__dirname, '..');
const comicClientPath = path.join(repoRoot, 'src', 'lib', 'adapters', 'comic.ts');
const comicServerPath = path.join(repoRoot, 'src', 'lib', 'adapters', 'comic-server.ts');
const comicPagePath = path.join(repoRoot, 'src', 'app', '(public)', 'read', 'comics', 'page.tsx');
const comicDetailPagePath = path.join(repoRoot, 'src', 'app', '(public)', 'comics', '[slug]', 'page.tsx');
const comicChapterPagePath = path.join(
  repoRoot,
  'src',
  'app',
  '(public)',
  'comics',
  '[slug]',
  'ch',
  '[chapterNumber]',
  'page.tsx',
);
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
const comicDetailPageSource = fs.readFileSync(comicDetailPagePath, 'utf8');
const comicChapterPageSource = fs.readFileSync(comicChapterPagePath, 'utf8');
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
  'getPopularManga',
  'getNewManga',
  'getMangaByGenre',
]) {
  assert.ok(comicClientSource.includes(token), `comic adapter is missing: ${token}`);
}

for (const token of [
  'getMangaDetail',
  'getMangaChapter',
  'getPopularManga',
  'getNewManga',
  'getMangaByGenre',
  'searchManga',
]) {
  assert.ok(comicServerSource.includes(token), `comic server adapter is missing: ${token}`);
}

assert.ok(
  comicClientSource.includes('Comic client adapter cannot be used on the server'),
  'comic client adapter should fail fast when called on the server',
);
assert.ok(!comicClientSource.includes('buildApiUrl'), 'comic client adapter should not build server-side absolute URLs');

assert.ok(comicPageSource.includes(`ComicPageClient`), 'comic hub should use ComicPageClient');
assert.ok(
  comicPageSource.includes('normalizeComicVariant'),
  'comic hub should route manga/manhwa/manhua variants via query params',
);
assert.ok(comicSearchRouteSource.includes(`from '@/lib/adapters/comic-server'`), 'comic search route should use comic server adapter');
assert.ok(comicDetailPageSource.includes(`@/features/comics/ComicTitlePage`), 'comic detail page should delegate to ComicTitlePage');
assert.ok(
  comicChapterPageSource.includes(`@/features/comics/ComicChapterPage`),
  'numeric comic chapter route should delegate to ComicChapterPage',
);

for (const routePath of comicApiPaths) {
  const source = fs.readFileSync(routePath, 'utf8');
  assert.ok(source.includes('Response.json'), `comic API route should return JSON: ${routePath}`);
}

assert.equal(countFiles(path.join(repoRoot, 'src', 'app', 'api', 'manga')), 0, 'legacy /api/manga routes should not contain files');
assert.equal(countFiles(path.join(repoRoot, 'src', 'app', 'manga')), 0, 'legacy /manga app routes should not contain files');

console.log('Comic dataflow checks passed.');
