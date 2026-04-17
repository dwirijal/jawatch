import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

function loadEnvFile(fileName) {
  const filePath = path.join(repoRoot, fileName);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const source = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of source.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (process.env[key]) {
      continue;
    }

    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

function normalizeEnv(key, fallback = '') {
  return (process.env[key] || fallback).trim();
}

function normalizeDatabaseUrl(raw) {
  if (!raw) {
    return '';
  }

  try {
    const url = new URL(raw);
    url.searchParams.delete('sslrootcert');
    return url.toString();
  } catch {
    return raw;
  }
}

function readDatabaseCaPem() {
  const raw =
    normalizeEnv('AIVEN_POSTGRES_CA_PEM') ||
    normalizeEnv('DATABASE_CA_PEM');

  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}

async function fetchWithTimeout(url, options = {}) {
  const { timeoutMs = 8000, retries = 0, retryDelayMs = 300, ...init } = options;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error('request failed');
}

const results = [];

async function checkHttp(name, url, options = {}) {
  const {
    timeoutMs = 8000,
    retries = 0,
    headers,
    ok = (status) => status >= 200 && status < 300,
  } = options;

  try {
    const response = await fetchWithTimeout(url, {
      timeoutMs,
      retries,
      headers,
    });
    results.push({
      name,
      status: ok(response.status) ? 'PASS' : 'FAIL',
      detail: `HTTP ${response.status}`,
    });
  } catch (error) {
    results.push({
      name,
      status: 'FAIL',
      detail: error instanceof Error ? error.message : 'request failed',
    });
  }
}

async function checkDatabase() {
  const databaseUrl = normalizeDatabaseUrl(normalizeEnv('DATABASE_URL'));
  if (!databaseUrl) {
    results.push({ name: 'database', status: 'SKIP', detail: 'DATABASE_URL not configured' });
    return;
  }

  try {
    const postgres = (await import('postgres')).default;
    const ca = readDatabaseCaPem();
    const sql = postgres(databaseUrl, {
      max: 1,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
      ...(ca ? { ssl: { ca, rejectUnauthorized: true } } : {}),
    });
    await sql`select 1`;
    await sql.end();
    results.push({ name: 'database', status: 'PASS', detail: 'select 1' });
  } catch (error) {
    results.push({ name: 'database', status: 'FAIL', detail: error instanceof Error ? error.message : 'connect failed' });
  }
}

async function checkRedis() {
  const redisUrl =
    normalizeEnv('AIVEN_VALKEY_URL') ||
    normalizeEnv('VALKEY_URL') ||
    normalizeEnv('REDIS_URL');

  if (!redisUrl) {
    results.push({ name: 'valkey', status: 'SKIP', detail: 'VALKEY_URL/REDIS_URL not configured' });
    return;
  }

  try {
    const { createClient } = await import('redis');
    const client = createClient({
      url: redisUrl,
      socket: { connectTimeout: 5000, reconnectStrategy: false },
    });
    await client.connect();
    const pong = await client.ping();
    await client.disconnect();
    results.push({ name: 'valkey', status: pong === 'PONG' ? 'PASS' : 'FAIL', detail: pong });
  } catch (error) {
    results.push({ name: 'valkey', status: 'FAIL', detail: error instanceof Error ? error.message : 'connect failed' });
  }
}

async function checkOpenSearch() {
  const rawUrl =
    normalizeEnv('AIVEN_OPENSEARCH_URL') ||
    normalizeEnv('OPENSEARCH_URL') ||
    normalizeEnv('SEARCH_OPENSEARCH_URL');

  if (!rawUrl) {
    results.push({ name: 'opensearch', status: 'SKIP', detail: 'OPENSEARCH_URL not configured' });
    return;
  }

  try {
    const url = new URL(rawUrl);
    const headers = { Accept: 'application/json' };

    if (url.username || url.password) {
      headers.Authorization = `Basic ${Buffer.from(`${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`).toString('base64')}`;
      url.username = '';
      url.password = '';
    }

    url.pathname = '/_cluster/health';
    url.search = '';

    const response = await fetchWithTimeout(url.toString(), {
      timeoutMs: 6_000,
      headers,
    });
    const payload = await response.json().catch(() => null);
    results.push({
      name: 'opensearch',
      status: response.ok ? 'PASS' : 'FAIL',
      detail: response.ok ? String(payload?.status ?? `HTTP ${response.status}`) : `HTTP ${response.status}`,
    });
  } catch (error) {
    results.push({ name: 'opensearch', status: 'FAIL', detail: error instanceof Error ? error.message : 'request failed' });
  }
}

async function checkUpstash() {
  const url = normalizeEnv('UPSTASH_REDIS_REST_URL');
  const token = normalizeEnv('UPSTASH_REDIS_REST_TOKEN');

  if (!url || !token) {
    results.push({ name: 'upstash', status: 'SKIP', detail: 'Upstash REST creds not configured' });
    return;
  }

  try {
    const response = await fetchWithTimeout(url, {
      timeoutMs: 5000,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['PING']),
    });
    const payload = await response.json();
    results.push({
      name: 'upstash',
      status: response.ok && payload.result === 'PONG' ? 'PASS' : 'FAIL',
      detail: response.ok ? String(payload.result ?? 'unknown') : `HTTP ${response.status}`,
    });
  } catch (error) {
    results.push({ name: 'upstash', status: 'FAIL', detail: error instanceof Error ? error.message : 'request failed' });
  }
}

async function checkTmdb() {
  const token =
    normalizeEnv('TMDB_ACCESS_TOKEN') ||
    normalizeEnv('TMDB_API_READ_ACCESS_TOKEN') ||
    normalizeEnv('TMDB_BEARER_TOKEN');
  const apiKey = normalizeEnv('TMDB_API_KEY');

  if (!token && !apiKey) {
    results.push({ name: 'tmdb', status: 'SKIP', detail: 'TMDB credentials not configured' });
    return;
  }

  const url = new URL('https://api.themoviedb.org/3/configuration');
  const headers = { Accept: 'application/json' };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    url.searchParams.set('api_key', apiKey);
  }

  await checkHttp('tmdb', url.toString(), { headers });
}

async function main() {
  const authOrigin =
    normalizeEnv('AUTH_ORIGIN') ||
    normalizeEnv('NEXT_PUBLIC_AUTH_ORIGIN') ||
    normalizeEnv('NEXT_PUBLIC_SITE_URL') ||
    'https://jawatch.web.id';
  const gatewayOrigin = normalizeEnv('DWIZZY_API_BASE_URL') || normalizeEnv('NEXT_PUBLIC_DWIZZY_API_BASE_URL') || 'https://api.dwizzy.my.id';

  await Promise.all([
    checkHttp('auth-login', new URL('/login', authOrigin).toString(), {
      ok: (status) => status === 200,
    }),
    checkHttp('api-gateway', gatewayOrigin, {
      ok: (status) => status >= 200 && status < 500,
    }),
    checkHttp('jikan', 'https://api.jikan.moe/v4/anime?q=naruto&limit=1'),
    checkHttp('google-books', 'https://www.googleapis.com/books/v1/volumes?q=intitle:naruto&maxResults=1', {
      timeoutMs: 12_000,
      retries: 2,
      retryDelayMs: 500,
    }),
    checkHttp('open-library', 'https://openlibrary.org/search.json?title=naruto&limit=1', {
      timeoutMs: 12_000,
      retries: 1,
    }),
    checkHttp('sanka-drachin', 'https://www.sankavollerei.com/anime/drachin/home', {
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.sankavollerei.com/anime/',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      },
    }),
    checkHttp('kanata-movie', 'https://api.kanata.web.id/movietube/home?section=latest'),
    checkRedis(),
    checkOpenSearch(),
    checkUpstash(),
    checkTmdb(),
  ]);

  await checkDatabase();

  let hasFailure = false;
  for (const result of results) {
    console.log(`${result.status.padEnd(4)} ${result.name}: ${result.detail}`);
    if (result.status === 'FAIL') {
      hasFailure = true;
    }
  }

  if (hasFailure) {
    process.exitCode = 1;
  }
}

await main();
