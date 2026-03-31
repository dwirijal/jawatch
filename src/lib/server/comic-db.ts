import 'server-only';

import postgres, { type Sql } from 'postgres';

export type ComicDbClient = Sql<Record<string, unknown>>;

const COMIC_DB_OPTIONS = {
  max: 1,
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

