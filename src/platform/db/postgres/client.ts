import 'server-only';

import postgres, { type Sql } from 'postgres';

export type PostgresClient = Sql<Record<string, unknown>>;
export type ComicDbClient = PostgresClient;

function readIntegerEnv(name: string, fallback: number, minimum: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < minimum) {
    return fallback;
  }

  return parsed;
}

function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL ||
    process.env.CF_PAGES ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NEXT_RUNTIME === 'edge',
  );
}

function readPoolMax(): number {
  return readIntegerEnv('COMIC_DB_POOL_MAX', isServerlessRuntime() ? 1 : 4, 1);
}

function readStatementTimeoutMs(): number {
  return readIntegerEnv('COMIC_DB_STATEMENT_TIMEOUT_MS', 5_000, 500);
}

function readConnectTimeoutSeconds(): number {
  const rawMs = process.env.COMIC_DB_CONNECT_TIMEOUT_MS?.trim();
  if (rawMs) {
    const parsedMs = Number.parseInt(rawMs, 10);
    if (Number.isFinite(parsedMs) && parsedMs >= 500) {
      return Math.ceil(parsedMs / 1000);
    }
  }

  return readIntegerEnv('COMIC_DB_CONNECT_TIMEOUT_SECONDS', 3, 1);
}

function readIdleTimeoutSeconds(): number {
  return readIntegerEnv('COMIC_DB_IDLE_TIMEOUT_SECONDS', 30, 5);
}

function readMaxLifetimeSeconds(): number {
  return readIntegerEnv('COMIC_DB_MAX_LIFETIME_SECONDS', 60 * 30, 60);
}

function readApplicationName(): string {
  return process.env.COMIC_DB_APPLICATION_NAME?.trim() || 'jawatch-web';
}

function normalizeEnvValue(value: string | undefined): string {
  const trimmed = value?.trim() || '';
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function shouldUseSupabaseDatabase(): boolean {
  const provider = normalizeEnvValue(process.env.DATABASE_PROVIDER).toLowerCase();
  return provider === 'supabase' || provider === 'supabase-postgres';
}

function isSupabaseDatabaseUrl(databaseUrl: string): boolean {
  try {
    const hostname = new URL(databaseUrl).hostname.toLowerCase();
    return hostname.endsWith('.supabase.co') || hostname.endsWith('.pooler.supabase.com');
  } catch {
    const normalized = databaseUrl.toLowerCase();
    return normalized.includes('.supabase.co') || normalized.includes('.pooler.supabase.com');
  }
}

function readSupabaseDatabaseUrl(): string {
  const explicitUrl =
    normalizeEnvValue(process.env.SUPABASE_DATABASE_POOL_URL) ||
    normalizeEnvValue(process.env.SUPABASE_DATABASE_URL);
  if (explicitUrl) {
    return explicitUrl;
  }

  const projectRef = normalizeEnvValue(process.env.SUPABASE_PROJECT_REF);
  const password = normalizeEnvValue(process.env.SUPABASE_DB_PASSWORD);
  if (!projectRef || !password) {
    return '';
  }

  const databaseName = normalizeEnvValue(process.env.SUPABASE_DB_NAME) || 'postgres';
  const region = normalizeEnvValue(process.env.SUPABASE_REGION);
  const poolMode = normalizeEnvValue(process.env.SUPABASE_DB_POOL_MODE).toLowerCase();
  const encodedPassword = encodeURIComponent(password);
  const directHost = normalizeEnvValue(process.env.SUPABASE_DB_HOST) || `db.${projectRef}.supabase.co`;
  const directUser = normalizeEnvValue(process.env.SUPABASE_DB_USER) || 'postgres';

  if (
    poolMode === 'transaction' ||
    poolMode === 'pooler' ||
    poolMode === 'pgbouncer' ||
    poolMode === 'dedicated-pooler'
  ) {
    const poolerHost = normalizeEnvValue(process.env.SUPABASE_DB_POOLER_HOST) || directHost;
    const poolerUser = normalizeEnvValue(process.env.SUPABASE_DB_POOLER_USER) || directUser;
    const poolerPort = normalizeEnvValue(process.env.SUPABASE_DB_POOLER_PORT) || '6543';
    return `postgresql://${encodeURIComponent(poolerUser)}:${encodedPassword}@${poolerHost}:${poolerPort}/${databaseName}?sslmode=require`;
  }

  if (
    poolMode === 'supavisor' ||
    poolMode === 'shared-pooler' ||
    poolMode === 'shared-transaction'
  ) {
    const poolerHost =
      normalizeEnvValue(process.env.SUPABASE_DB_POOLER_HOST) ||
      (region ? `aws-0-${region}.pooler.supabase.com` : '');
    if (!poolerHost) {
      return '';
    }

    const poolerUser = normalizeEnvValue(process.env.SUPABASE_DB_POOLER_USER) || `postgres.${projectRef}`;
    const poolerPort = normalizeEnvValue(process.env.SUPABASE_DB_POOLER_PORT) || '6543';
    return `postgresql://${encodeURIComponent(poolerUser)}:${encodedPassword}@${poolerHost}:${poolerPort}/${databaseName}?sslmode=require`;
  }

  const directPort = normalizeEnvValue(process.env.SUPABASE_DB_PORT) || '5432';
  return `postgresql://${encodeURIComponent(directUser)}:${encodedPassword}@${directHost}:${directPort}/${databaseName}?sslmode=require`;
}

function buildStartupConnectionParameters(databaseUrl: string): Record<string, string | number> {
  if (shouldUseSupabaseDatabase() || isSupabaseDatabaseUrl(databaseUrl)) {
    return {};
  }

  return {
    statement_timeout: readStatementTimeoutMs(),
    idle_in_transaction_session_timeout: readStatementTimeoutMs(),
    application_name: readApplicationName(),
  };
}

function buildComicDbOptions(databaseUrl: string) {
  const connection = buildStartupConnectionParameters(databaseUrl);

  return {
    max: readPoolMax(),
    ...(Object.keys(connection).length > 0 ? { connection } : {}),
    prepare: false,
    idle_timeout: readIdleTimeoutSeconds(),
    connect_timeout: readConnectTimeoutSeconds(),
    max_lifetime: readMaxLifetimeSeconds(),
  } as const;
}

let postgresClient: PostgresClient | null = null;

function readDatabaseUrl(): string {
  const raw = shouldUseSupabaseDatabase()
    ? readSupabaseDatabaseUrl()
    : (
        normalizeEnvValue(process.env.AIVEN_POSTGRES_POOL_URL) ||
        normalizeEnvValue(process.env.POSTGRES_POOL_URL) ||
        normalizeEnvValue(process.env.DATABASE_POOL_URL) ||
        normalizeEnvValue(process.env.DATABASE_URL)
      );
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
  const raw = shouldUseSupabaseDatabase()
    ? (
        normalizeEnvValue(process.env.SUPABASE_POSTGRES_CA_PEM) ||
        normalizeEnvValue(process.env.SUPABASE_DB_CA_PEM)
      )
    : (
        normalizeEnvValue(process.env.AIVEN_POSTGRES_CA_PEM) ||
        normalizeEnvValue(process.env.DATABASE_CA_PEM)
      );

  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}

function createPostgresClient(databaseUrl: string): PostgresClient {
  const ca = readDatabaseCaPem();

  return postgres(databaseUrl, {
    ...buildComicDbOptions(databaseUrl),
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
