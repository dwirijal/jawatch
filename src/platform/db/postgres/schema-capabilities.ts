import 'server-only';

import { getPostgresClient, type PostgresClient } from './client.ts';

export type PostgresSchemaCapabilities = {
  itemCanonicalFlag: boolean;
  unitCanonicalFlag: boolean;
  itemLinks: boolean;
  unitLinks: boolean;
};
export type ComicDbSchemaCapabilities = PostgresSchemaCapabilities;

type ColumnRow = {
  table_name?: string | null;
  column_name?: string | null;
};

type TableRow = {
  table_name?: string | null;
};

const DEFAULT_POSTGRES_SCHEMA_CAPABILITIES: PostgresSchemaCapabilities = {
  itemCanonicalFlag: false,
  unitCanonicalFlag: false,
  itemLinks: false,
  unitLinks: false,
};

let postgresSchemaCapabilitiesPromise: Promise<PostgresSchemaCapabilities> | null = null;

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function hasColumn(rows: ColumnRow[], tableName: string, columnName: string): boolean {
  return rows.some((row) => readText(row.table_name) === tableName && readText(row.column_name) === columnName);
}

function hasTable(rows: TableRow[], tableName: string): boolean {
  return rows.some((row) => readText(row.table_name) === tableName);
}

export function resolveComicDbSchemaCapabilities(
  columnRows: ColumnRow[] = [],
  tableRows: TableRow[] = [],
): PostgresSchemaCapabilities {
  return {
    itemCanonicalFlag: hasColumn(columnRows, 'media_items', 'is_canonical'),
    unitCanonicalFlag: hasColumn(columnRows, 'media_units', 'is_canonical'),
    itemLinks: hasTable(tableRows, 'media_item_links'),
    unitLinks: hasTable(tableRows, 'media_unit_links'),
  };
}

async function loadPostgresSchemaCapabilities(sql: PostgresClient): Promise<PostgresSchemaCapabilities> {
  const [columnRows, tableRows] = await Promise.all([
    sql.unsafe<ColumnRow[]>(`
      select
        c.table_name,
        c.column_name
      from information_schema.columns c
      where c.table_schema = 'public'
        and (
          (c.table_name = 'media_items' and c.column_name = 'is_canonical')
          or (c.table_name = 'media_units' and c.column_name = 'is_canonical')
        )
    `),
    sql.unsafe<TableRow[]>(`
      select
        t.table_name
      from information_schema.tables t
      where t.table_schema = 'public'
        and t.table_name in ('media_item_links', 'media_unit_links')
    `),
  ]);

  return resolveComicDbSchemaCapabilities(columnRows, tableRows);
}

export async function getComicDbSchemaCapabilities(
  sql: PostgresClient | null = getPostgresClient(),
): Promise<PostgresSchemaCapabilities> {
  if (!sql) {
    return DEFAULT_POSTGRES_SCHEMA_CAPABILITIES;
  }

  if (!postgresSchemaCapabilitiesPromise) {
    postgresSchemaCapabilitiesPromise = loadPostgresSchemaCapabilities(sql).catch(
      () => DEFAULT_POSTGRES_SCHEMA_CAPABILITIES,
    );
  }

  return postgresSchemaCapabilitiesPromise;
}

export function resetComicDbSchemaCapabilitiesForTests(): void {
  postgresSchemaCapabilitiesPromise = null;
}

export const getPostgresSchemaCapabilities = getComicDbSchemaCapabilities;
export const resolvePostgresSchemaCapabilities = resolveComicDbSchemaCapabilities;

export function buildCanonicalItemFlagSelection(
  alias: string,
  schemaCapabilities: ComicDbSchemaCapabilities,
): string {
  return schemaCapabilities.itemCanonicalFlag ? `${alias}.is_canonical` : 'false as is_canonical';
}

export function buildCanonicalUnitFlagSelection(
  alias: string,
  schemaCapabilities: ComicDbSchemaCapabilities,
): string {
  return schemaCapabilities.unitCanonicalFlag ? `${alias}.is_canonical` : 'false as is_canonical';
}

export function buildCanonicalItemOrdering(
  alias: string,
  schemaCapabilities: ComicDbSchemaCapabilities,
): string {
  return schemaCapabilities.itemCanonicalFlag ? `coalesce(${alias}.is_canonical, false) desc, ` : '';
}

export function buildCanonicalUnitOrdering(
  alias: string,
  schemaCapabilities: ComicDbSchemaCapabilities,
): string {
  return schemaCapabilities.unitCanonicalFlag ? `coalesce(${alias}.is_canonical, false) desc, ` : '';
}

export function buildCanonicalItemKeySelection(
  alias: string,
  schemaCapabilities: ComicDbSchemaCapabilities,
): string {
  const expressions: string[] = [];

  if (schemaCapabilities.itemCanonicalFlag) {
    expressions.push(`case when coalesce(${alias}.is_canonical, false) then ${alias}.item_key end`);
  }

  if (schemaCapabilities.itemLinks) {
    expressions.push(`cl.canonical_item_key`);
  }

  expressions.push(`${alias}.item_key`);

  return `coalesce(
    ${expressions.join(',\n    ')}
  )`;
}

export function buildCanonicalItemKeyExpression(
  alias: string,
  schemaCapabilities: ComicDbSchemaCapabilities,
): string {
  const expressions: string[] = [];

  if (schemaCapabilities.itemCanonicalFlag) {
    expressions.push(`case when coalesce(${alias}.is_canonical, false) then ${alias}.item_key end`);
  }

  if (schemaCapabilities.itemLinks) {
    expressions.push(`(
      select mil.canonical_item_key
      from public.media_item_links mil
      where mil.source_item_key = ${alias}.item_key
      order by mil.is_primary desc, mil.priority desc, mil.updated_at desc
      limit 1
    )`);
  }

  expressions.push(`${alias}.item_key`);

  return `coalesce(
    ${expressions.join(',\n    ')}
  )`;
}

export function buildCanonicalItemLateralSubquery(
  alias: string,
  sourceAlias: string,
  enabled = true,
): string {
  if (!enabled) {
    return `select null::text as canonical_item_key`;
  }

  return `
    select mil.canonical_item_key
    from public.media_item_links mil
    where mil.source_item_key = ${sourceAlias}.item_key
    order by mil.is_primary desc, mil.priority desc, mil.updated_at desc
    limit 1
  `;
}

export function buildCanonicalUnitKeyExpression(
  alias: string,
  schemaCapabilities: ComicDbSchemaCapabilities,
): string {
  const expressions: string[] = [];

  if (schemaCapabilities.unitCanonicalFlag) {
    expressions.push(`case when coalesce(${alias}.is_canonical, false) then ${alias}.unit_key end`);
  }

  if (schemaCapabilities.unitLinks) {
    expressions.push(`(
      select mul.canonical_unit_key
      from public.media_unit_links mul
      where mul.source_unit_key = ${alias}.unit_key
      order by mul.is_primary desc, mul.priority desc, mul.updated_at desc
      limit 1
    )`);
  }

  expressions.push(`${alias}.unit_key`);

  return `coalesce(
    ${expressions.join(',\n    ')}
  )`;
}

export function buildCanonicalItemShadowCondition(
  alias: string,
  buildScopeCondition: (canonicalAlias: string) => string,
  buildPublicSlugExpression: (slugAlias: string) => string,
  schemaCapabilities: ComicDbSchemaCapabilities,
): string {
  if (schemaCapabilities.itemCanonicalFlag) {
    const aliasSlugExpression = buildPublicSlugExpression(alias);
    const canonicalSlugExpression = buildPublicSlugExpression('canonical_item');
    return `
      and (
        coalesce(${alias}.is_canonical, false) = true
        or not exists (
          select 1
          from public.media_items canonical_item
          where ${canonicalSlugExpression} = ${aliasSlugExpression}
            and ${buildScopeCondition('canonical_item')}
            and coalesce(canonical_item.is_canonical, false) = true
        )
      )
    `;
  }

  if (schemaCapabilities.itemLinks) {
    return `
      and not exists (
        select 1
        from public.media_item_links mil
        where mil.source_item_key = ${alias}.item_key
          and mil.canonical_item_key is not null
          and mil.canonical_item_key <> ${alias}.item_key
      )
    `;
  }

  return '';
}
