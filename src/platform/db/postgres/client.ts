import 'server-only';

import postgres, { type Sql } from 'postgres';

export type PostgresClient = Sql<Record<string, unknown>>;
export type ComicDbClient = PostgresClient;

function readPoolMax(): number {
  const raw = process.env.COMIC_DB_POOL_MAX?.trim();
  if (!raw) {
    return 10;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 10;
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

let postgresClient: PostgresClient | null = null;

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

function createPostgresClient(databaseUrl: string): PostgresClient {
  const ca = readDatabaseCaPem();

  return postgres(databaseUrl, {
    ...COMIC_DB_OPTIONS,
    ...(ca ? { ssl: { ca, rejectUnauthorized: true } } : {}),
  });
}

export function hasPostgresDatabase(): boolean {
  return Boolean(readDatabaseUrl());
}

export function getPostgresClient(): PostgresClient | null {
  if (postgresClient) {
    return postgresClient;
  }

  const databaseUrl = readDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  postgresClient = createPostgresClient(databaseUrl);
  return postgresClient;
}

export async function closePostgresClient(): Promise<void> {
  const client = postgresClient;
  postgresClient = null;

  if (client) {
    await client.end();
  }
}

export const hasComicDatabase = hasPostgresDatabase;
export const getComicDb = getPostgresClient;
export const closeComicDb = closePostgresClient;
