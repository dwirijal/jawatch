import 'server-only';

import postgres, { type Sql } from 'postgres';

export type ComicDbClient = Sql<Record<string, unknown>>;

function readPoolMax(): number {
  const raw = process.env.COMIC_DB_POOL_MAX?.trim();
  if (!raw) {
    return 4;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 4;
  }

  return parsed;
}

const COMIC_DB_OPTIONS = {
  get max() {
    return readPoolMax();
  },
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
} as const;

let comicDbClient: ComicDbClient | null = null;

function readDatabaseUrl(): string {
  return process.env.DATABASE_URL?.trim() || '';
}

function createComicDbClient(databaseUrl: string): ComicDbClient {
  return postgres(databaseUrl, COMIC_DB_OPTIONS);
}

export function hasComicDatabase(): boolean {
  return Boolean(readDatabaseUrl());
}

export function getComicDb(): ComicDbClient | null {
  if (comicDbClient) {
    return comicDbClient;
  }

  const databaseUrl = readDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  comicDbClient = createComicDbClient(databaseUrl);
  return comicDbClient;
}

export async function closeComicDb(): Promise<void> {
  const client = comicDbClient;
  comicDbClient = null;

  if (client) {
    await client.end();
  }
}
