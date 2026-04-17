import 'server-only';

import postgres, { type Sql } from 'postgres';

export type ComicDbClient = Sql<Record<string, unknown>>;

function readPoolMax(): number {
  const raw = process.env.COMIC_DB_POOL_MAX?.trim();
  if (!raw) {
    return 1;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function readStatementTimeoutMs(): number {
  const raw = process.env.COMIC_DB_STATEMENT_TIMEOUT_MS?.trim();
  if (!raw) {
    return 5_000;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 500) {
    return 5_000;
  }

  return parsed;
}

const COMIC_DB_OPTIONS = {
  get max() {
    return readPoolMax();
  },
  get connection() {
    return {
      statement_timeout: readStatementTimeoutMs(),
      idle_in_transaction_session_timeout: readStatementTimeoutMs(),
    };
  },
  prepare: false,
  idle_timeout: 5,
  connect_timeout: 10,
} as const;

let comicDbClient: ComicDbClient | null = null;

function readDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim() || '';
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

function readDatabaseCaPem(): string {
  const raw =
    process.env.AIVEN_POSTGRES_CA_PEM?.trim() ||
    process.env.DATABASE_CA_PEM?.trim() ||
    '';

  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}

function createComicDbClient(databaseUrl: string): ComicDbClient {
  const ca = readDatabaseCaPem();

  return postgres(databaseUrl, {
    ...COMIC_DB_OPTIONS,
    ...(ca ? { ssl: { ca, rejectUnauthorized: true } } : {}),
  });
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
