import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function walk(relativeDir) {
  const root = join(process.cwd(), relativeDir);
  const output = [];

  function visit(currentDir, currentRelativeDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const nextPath = join(currentDir, entry.name);
      const nextRelativePath = `${currentRelativeDir}/${entry.name}`;

      if (entry.isDirectory()) {
        visit(nextPath, nextRelativePath);
        continue;
      }

      output.push(nextRelativePath);
    }
  }

  visit(root, relativeDir);
  return output;
}

function listSourceFiles() {
  return walk('src').filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'));
}

test('source tree avoids importing shared modules back out of src/app', () => {
  const violations = [];

  for (const file of listSourceFiles()) {
    const source = read(file);

    if (source.includes("@/app/loadHomePageData")) {
      violations.push(`${file}: imports shared home loader from src/app`);
    }

    if (source.includes("@/app/home-page-types")) {
      violations.push(`${file}: imports shared home types from src/app`);
    }

    if (source.includes("@/app/_")) {
      violations.push(`${file}: imports implementation from private app subtree`);
    }
  }

  assert.deepEqual(violations, []);
});

test('components import auth hooks from src/hooks instead of components/hooks', () => {
  const violations = [];

  for (const file of listSourceFiles()) {
    const source = read(file);

    if (source.includes("@/components/hooks/")) {
      violations.push(`${file}: imports hook from components/hooks`);
    }
  }

  assert.deepEqual(violations, []);
});

test('viewer NSFW access is imported from a neutral server helper instead of the home loader', () => {
  const violations = [];
  const legacyImportPattern = /import\s*{\s*[^}]*resolveViewerNsfwAccess[^}]*}\s*from\s*['"][^'"]*loadHomePageData(?:\.ts)?['"]/m;

  for (const file of listSourceFiles()) {
    const source = read(file);
    if (legacyImportPattern.test(source)) {
      violations.push(`${file}: imports resolveViewerNsfwAccess from home loader`);
    }
  }

  assert.deepEqual(violations, []);
});

test('auth gateway stays focused on auth status and URL helpers', () => {
  const source = read('src/lib/auth-gateway.ts');

  assert.equal(source.includes("from '@/lib/personalization-sync'"), false);
  assert.equal(source.includes("from '@/lib/store'"), false);
});

test('domain cache accepts Aiven Valkey env aliases', () => {
  const source = read('src/platform/cache/redis/domain-cache.ts');

  assert.equal(source.includes('process.env.AIVEN_REDIS_URL'), true);
  assert.equal(source.includes('process.env.AIVEN_VALKEY_URL'), true);
  assert.equal(source.includes('process.env.REDIS_URL'), true);
  assert.equal(source.includes('process.env.VALKEY_URL'), true);
});

test('store root file is a thin facade instead of a persistence implementation', () => {
  const source = read('src/lib/store.ts');

  assert.equal(source.includes('localStorage'), false);
  assert.equal(source.includes('JSON.parse'), false);
  assert.equal(source.includes('JSON.stringify'), false);
});

test('auth route pages stay thin and delegate to feature auth modules', () => {
  const routes = ['src/app/(auth)/login/page.tsx', 'src/app/(auth)/signup/page.tsx'];
  const violations = [];

  for (const file of routes) {
    const source = read(file);

    if (!source.includes("@/features/auth/")) {
      violations.push(`${file}: missing feature auth delegation`);
    }

    if (source.includes('createSupabaseServerClient')) {
      violations.push(`${file}: route still owns Supabase auth mutations`);
    }

    if (source.includes('function StatusNotice(')) {
      violations.push(`${file}: route still owns shared auth shell UI`);
    }

    if (/async function sign(In|Up)With/.test(source)) {
      violations.push(`${file}: route still defines inline auth server actions`);
    }
  }

  assert.deepEqual(violations, []);
});

test('public/auth/vault/admin route groups exist', () => {
  const appDir = join(process.cwd(), 'src/app');
  const names = readdirSync(appDir);

  assert.equal(names.includes('(public)'), true);
  assert.equal(names.includes('(auth)'), true);
  assert.equal(names.includes('(vault)'), true);
  assert.equal(names.includes('(admin)'), true);
});

test('proxy entrypoint delegates routing rules to proxy helper modules', () => {
  const source = read('src/proxy.ts');

  assert.equal(source.includes("@/platform/gateway/legacy/"), true);
  assert.equal(source.includes('const BLOCKED_EXACT_PATHS'), false);
  assert.equal(source.includes('const REMOVED_PUBLIC_EXACT_PATHS'), false);
  assert.equal(source.includes('function isScannerPath'), false);
  assert.equal(source.includes('function shouldRefreshSupabaseSession'), false);
});

test('src/lib runtime modules use relative internal imports instead of @/lib aliases', () => {
  const violations = [];
  const runtimeAliasImport = /^import\s+(?!type\b)[\s\S]*?\sfrom\s+['"]@\//gm;

  for (const file of walk('src/lib')) {
    if (!file.endsWith('.ts')) {
      continue;
    }

    const source = read(file);
    if (runtimeAliasImport.test(source)) {
      violations.push(`${file}: runtime import should be relative for Node-safe execution`);
    }
  }

  assert.deepEqual(violations, []);
});

test('src/lib does not keep JavaScript shim files for TypeScript modules', () => {
  const shimFiles = walk('src/lib').filter((file) => file.endsWith('.js'));

  assert.deepEqual(shimFiles, []);
});

test('features do not import platform modules directly unless explicitly allowlisted', () => {
  const violations = [];

  for (const file of walk('src/features')) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) {
      continue;
    }

    const source = read(file);
    if (!source.includes("@/platform/")) {
      continue;
    }

    if (!source.includes('ALLOWLIST: features-platform-import')) {
      violations.push(`${file}: feature imports platform without allowlist marker`);
    }
  }

  assert.deepEqual(violations, []);
});

test('shared modules do not import domain or platform modules', () => {
  const violations = [];

  for (const root of ['src/components', 'src/hooks', 'src/store']) {
    for (const file of walk(root)) {
      if (!file.endsWith('.ts') && !file.endsWith('.tsx')) {
        continue;
      }

      const source = read(file);
      if (source.includes("@/domains/")) {
        violations.push(`${file}: shared module imports domains`);
      }
      if (source.includes("@/platform/")) {
        violations.push(`${file}: shared module imports platform`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test('platform modules do not import domain or feature modules', () => {
  const violations = [];
  const platformRoot = join(process.cwd(), 'src/platform');

  try {
    readdirSync(platformRoot);
  } catch {
    assert.fail('src/platform should exist before boundary tests run');
  }

  for (const file of walk('src/platform')) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) {
      continue;
    }

    const source = read(file);
    if (source.includes("@/domains/")) {
      violations.push(`${file}: platform imports domains`);
    }
    if (source.includes("@/features/")) {
      violations.push(`${file}: platform imports features`);
    }
  }

  assert.deepEqual(violations, []);
});

test('app modules do not import legacy gateway modules on the main path', () => {
  const violations = [];

  for (const file of walk('src/app')) {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) {
      continue;
    }

    const source = read(file);
    if (source.includes('@/platform/gateway/legacy/')) {
      violations.push(`${file}: app imports legacy gateway path`);
    }
  }

  assert.deepEqual(violations, []);
});

test('browser persistence outside store uses shared helpers instead of direct localStorage access', () => {
  const verticalDramaStore = read('src/lib/vertical-drama-store.ts');
  const playerState = read('src/components/organisms/video-player/useVideoPlayerState.ts');

  assert.equal(verticalDramaStore.includes('localStorage'), false);
  assert.equal(verticalDramaStore.includes('JSON.parse'), false);
  assert.equal(verticalDramaStore.includes('JSON.stringify'), false);
  assert.equal(playerState.includes('localStorage'), false);
});

test('vertical drama db routes generate public slugs instead of reading slug columns directly', () => {
  const source = read('src/lib/server/drama-db.ts');

  assert.equal(source.includes("from '../media-slugs.ts'"), true);
  assert.equal(source.includes('i.slug'), false);
  assert.equal(source.includes('u.slug'), false);
  assert.equal(source.includes('prev_slug'), false);
  assert.equal(source.includes('next_slug'), false);
});

test('home page and sitemap defer heavy work to request time instead of build time', () => {
  const homePageSource = read('src/app/(public)/page.tsx');
  const sitemapSource = read('src/app/sitemap.ts');

  assert.equal(homePageSource.includes("from 'next/server'"), true);
  assert.equal(homePageSource.includes('await connection()'), true);
  assert.equal(sitemapSource.includes("from 'next/server'"), true);
  assert.equal(sitemapSource.includes('await connection()'), true);
});

test('home page view delegates hero and section rendering to feature home modules', () => {
  const source = read('src/components/organisms/HomePageView.tsx');

  assert.equal(source.includes("from '@/features/home/HomeHeroStage'"), true);
  assert.equal(source.includes("from '@/features/home/HomeSectionGrid'"), true);
  assert.equal(source.includes('function HeroStage('), false);
  assert.equal(source.includes('function RecommendationSection('), false);
  assert.equal(source.includes('function SectionGrid('), false);
});

test('home page data entrypoint stays thin and delegates to focused home feed modules', () => {
  const source = read('src/features/home/server/loadHomePageData.ts');

  assert.equal(source.includes("from './home-feed-loader.ts'"), true);
  assert.equal(source.includes('unstable_cache'), false);
  assert.equal(source.includes('createSupabaseServerClient'), false);
  assert.equal(source.includes('getSeriesHubData'), false);
  assert.equal(source.includes('function buildHomeSection('), false);
});

test('community panel entrypoint stays thin and delegates to feature community modules', () => {
  const source = read('src/components/organisms/CommunityPanel.tsx');

  assert.equal(source.includes("from '@/features/community/TitleCommunityPanel'"), true);
  assert.equal(source.includes("from '@/features/community/UnitCommunityPanel'"), true);
  assert.equal(source.includes("from '@/features/community/VaultCommunitySummary'"), true);
  assert.equal(source.includes('function CommentThread('), false);
  assert.equal(source.includes('loadRemoteUnitCommunity'), false);
  assert.equal(source.includes('getVaultCommunitySummary'), false);
});

test('series adapter entrypoint stays a thin facade over split modules', () => {
  const source = read('src/lib/adapters/series.ts');

  assert.equal(source.includes("from './series-browse.ts'"), true);
  assert.equal(source.includes("from './series-detail.ts'"), true);
  assert.equal(source.includes("from './series-shared.ts'"), true);
  assert.equal(source.includes('sql.unsafe'), false);
  assert.equal(source.includes('unstable_cache'), false);
  assert.equal(source.includes('function getSeries'), false);
});

test('movie adapter entrypoint stays a thin facade over split modules', () => {
  const source = read('src/lib/adapters/movie.ts');

  assert.equal(source.includes("from './movie-browse.ts'"), true);
  assert.equal(source.includes("from './movie-detail.ts'"), true);
  assert.equal(source.includes("from './movie-shared.ts'"), true);
  assert.equal(source.includes('sql.unsafe'), false);
  assert.equal(source.includes('unstable_cache'), false);
  assert.equal(source.includes('function getMovie'), false);
});

test('comic server adapter entrypoint stays a thin facade over split modules', () => {
  const source = read('src/lib/adapters/comic-server.ts');

  assert.equal(source.includes("from './comic-server-browse.ts'"), true);
  assert.equal(source.includes("from './comic-server-detail.ts'"), true);
  assert.equal(source.includes("from './comic-server-shared.ts'"), true);
  assert.equal(source.includes('sql.unsafe'), false);
  assert.equal(source.includes('shouldUseComicGateway'), false);
  assert.equal(source.includes('function getManga'), false);
});

test('enrichment entrypoint stays a thin facade over provider modules', () => {
  const source = read('src/lib/enrichment.ts');

  assert.equal(source.includes("from './enrichment-movie.ts'"), true);
  assert.equal(source.includes("from './enrichment-written.ts'"), true);
  assert.equal(source.includes("from './enrichment-jikan.ts'"), true);
  assert.equal(source.includes('fetchWithTimeout'), false);
  assert.equal(source.includes('const runtimeCache'), false);
  assert.equal(source.includes('function scoreTitleSimilarity('), false);
});

test('movie and series browse adapters define shared hub cache keys for Redis-backed domain caching', () => {
  const movieBrowseSource = read('src/lib/adapters/movie-browse.ts');
  const seriesBrowseSource = read('src/lib/adapters/series-browse.ts');

  assert.equal(movieBrowseSource.includes("buildComicCacheKey(MOVIE_CACHE_NAMESPACE, 'hub'"), true);
  assert.equal(seriesBrowseSource.includes("buildComicCacheKey(SERIES_CACHE_NAMESPACE, visibility, 'hub'"), true);
});

test('comic chapter query resolves adjacent navigation in SQL instead of sibling scans', () => {
  const source = read('src/lib/adapters/comic-server-shared.ts');

  assert.equal(source.includes('const siblingRows'), false);
  assert.equal(source.includes('.findIndex('), false);
  assert.equal(source.includes('lag(slug) over'), true);
  assert.equal(source.includes('lead(slug) over'), true);
});
