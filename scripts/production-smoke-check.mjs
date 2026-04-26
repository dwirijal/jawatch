const DEFAULT_BASE_URL = 'https://jawatch.web.id';
const REQUEST_TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 15000);

const checks = [
  { path: '/', kind: 'html', label: 'home' },
  { path: '/watch', kind: 'html', label: 'watch hub' },
  { path: '/watch/movies', kind: 'html', label: 'movies browse' },
  { path: '/watch/series', kind: 'html', label: 'series browse' },
  { path: '/read', kind: 'html', label: 'read hub' },
  { path: '/read/comics', kind: 'html', label: 'comics browse' },
  { path: '/sitemap.xml', kind: 'xml', label: 'sitemap' },
  { path: '/robots.txt', kind: 'text', label: 'robots' },
  { path: '/movies/latest', kind: 'html', label: 'legacy movies latest redirect' },
  { path: '/series/short', kind: 'html', label: 'legacy series short redirect' },
  { path: '/comic/magic-emperor', kind: 'html', label: 'legacy comic detail redirect' },
  { path: '/manga/magic-emperor', kind: 'html', label: 'legacy manga detail redirect' },
];

function normalizeBaseUrl(value) {
  const candidate = (value || DEFAULT_BASE_URL).trim();
  return candidate.endsWith('/') ? candidate.slice(0, -1) : candidate;
}

function expectContentType(headers, expectedKind) {
  const contentType = headers.get('content-type') || '';

  if (expectedKind === 'html') {
    return contentType.includes('text/html');
  }

  if (expectedKind === 'xml') {
    return contentType.includes('xml');
  }

  if (expectedKind === 'text') {
    return contentType.includes('text/plain');
  }

  return true;
}

function expectBody(body, expectedKind) {
  if (expectedKind === 'html') {
    return body.includes('<title>') && body.toLowerCase().includes('rel="canonical"');
  }

  if (expectedKind === 'xml') {
    return body.includes('<urlset') || body.includes('<sitemapindex');
  }

  if (expectedKind === 'text') {
    return body.length > 0;
  }

  return true;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const startedAt = Date.now();
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'jawatch Production Smoke/1.0',
        accept: 'text/html,application/xml,text/plain;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });
    const durationMs = Date.now() - startedAt;
    const body = await response.text();
    return { response, body, durationMs };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function main() {
  const baseUrl = normalizeBaseUrl(process.env.BASE_URL);
  const failures = [];

  for (const check of checks) {
    const url = `${baseUrl}${check.path}`;

    try {
      const { response, body, durationMs } = await fetchWithTimeout(url);
      const expectedStatus = check.expectedStatus ?? 200;
      const statusOk = response.status === expectedStatus;
      const shouldInspectBody = expectedStatus >= 200 && expectedStatus < 300;
      const contentTypeOk = shouldInspectBody ? expectContentType(response.headers, check.kind) : true;
      const bodyOk = shouldInspectBody ? expectBody(body, check.kind) : true;

      if (!statusOk || !contentTypeOk || !bodyOk) {
        failures.push({
          label: check.label,
          path: check.path,
          status: response.status,
          contentType: response.headers.get('content-type') || '',
          durationMs,
          reason: [
            !statusOk ? `unexpected status ${response.status}, expected ${expectedStatus}` : null,
            !contentTypeOk ? `unexpected content-type` : null,
            !bodyOk ? `missing expected body markers` : null,
          ].filter(Boolean).join(', '),
        });
        continue;
      }

      console.log(`OK ${check.path} ${response.status} ${durationMs}ms`);
    } catch (error) {
      failures.push({
        label: check.label,
        path: check.path,
        status: 'FETCH_ERROR',
        contentType: '',
        durationMs: REQUEST_TIMEOUT_MS,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (failures.length > 0) {
    console.error('Production smoke check failed:');
    for (const failure of failures) {
      console.error(
        `- ${failure.path} [${failure.label}] ${failure.status} ${failure.durationMs}ms: ${failure.reason}`
      );
    }
    process.exit(1);
  }

  console.log(`Production smoke check passed for ${baseUrl}`);
}

await main();
