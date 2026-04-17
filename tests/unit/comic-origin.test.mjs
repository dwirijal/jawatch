import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildComicGatewayUrl,
  readComicDataSource,
  shouldUseComicGateway,
} from '../../src/lib/server/comic-origin.ts';

test('comic data source defaults to database when DATABASE_URL is present', () => {
  const previousMode = process.env.COMIC_DATA_SOURCE;
  const previousDatabaseUrl = process.env.DATABASE_URL;

  process.env.COMIC_DATA_SOURCE = '';
  process.env.DATABASE_URL = 'postgres://postgres:postgres@127.0.0.1:5432/jawatch_catalog?sslmode=disable';

  try {
    assert.equal(readComicDataSource(), 'database');
    assert.equal(shouldUseComicGateway(), false);
  } finally {
    if (previousMode === undefined) {
      delete process.env.COMIC_DATA_SOURCE;
    } else {
      process.env.COMIC_DATA_SOURCE = previousMode;
    }

    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
  }
});

test('comic gateway URL builder appends normalized path and params', () => {
  const previousBaseUrl = process.env.COMIC_API_BASE_URL;
  process.env.COMIC_API_BASE_URL = 'https://jawatch-origin.example.com/';

  try {
    assert.equal(
      buildComicGatewayUrl('/api/comic/latest', { page: 2, limit: 24, includeNsfw: true }),
      'https://jawatch-origin.example.com/api/comic/latest?page=2&limit=24&includeNsfw=true',
    );
  } finally {
    if (previousBaseUrl === undefined) {
      delete process.env.COMIC_API_BASE_URL;
    } else {
      process.env.COMIC_API_BASE_URL = previousBaseUrl;
    }
  }
});

test('comic gateway URL builder preserves configured base path prefix', () => {
  const previousBaseUrl = process.env.COMIC_API_BASE_URL;
  process.env.COMIC_API_BASE_URL = 'https://dns.dwizzy.my.id/jawatch-origin';

  try {
    assert.equal(
      buildComicGatewayUrl('/api/comic/latest', { page: 1, limit: 2 }),
      'https://dns.dwizzy.my.id/jawatch-origin/api/comic/latest?page=1&limit=2',
    );
  } finally {
    if (previousBaseUrl === undefined) {
      delete process.env.COMIC_API_BASE_URL;
    } else {
      process.env.COMIC_API_BASE_URL = previousBaseUrl;
    }
  }
});
