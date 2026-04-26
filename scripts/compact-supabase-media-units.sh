#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
JAWATCH_ENV_FILE="${JAWATCH_ENV_FILE:-${PROJECT_DIR}/.env.local}"
SLOANE_ENV_FILE="${SLOANE_ENV_FILE:-/home/dwizzy/workspace/projects/dwizzyOS/dwizzySCRAPE/.env}"
SUPABASE_DB_HOST="${SUPABASE_DB_HOST:-db.wkededojfpjzbndcldom.supabase.co}"
SUPABASE_DB_NAME="${SUPABASE_DB_NAME:-postgres}"
SUPABASE_DB_USER="${SUPABASE_DB_USER:-postgres}"
SUPABASE_DIRECT_PORT="${SUPABASE_DIRECT_PORT:-5432}"
PSQL_BIN="${PSQL_BIN:-psql}"
WORK_DIR="${WORK_DIR:-$(mktemp -d /tmp/jawatch-media-units-compact.XXXXXX)}"
EXPORT_FILE="${EXPORT_FILE:-${WORK_DIR}/media_units_compact.bin}"

read_env_value() {
  local key="$1"
  local file="$2"
  [[ -f "${file}" ]] || return 0
  node -e '
const fs = require("fs");
const key = process.argv[1];
const file = process.argv[2];
const text = fs.readFileSync(file, "utf8");
for (const line of text.split(/\r?\n/)) {
  const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!match || match[1] !== key) continue;
  let value = match[2].trim();
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'\''") && value.endsWith("'\''"))) {
    value = value.slice(1, -1);
  }
  process.stdout.write(value);
  process.exit(0);
}
' "${key}" "${file}"
}

build_postgres_url() {
  local password="$1"
  SUPABASE_DB_USER="${SUPABASE_DB_USER}" \
    SUPABASE_DB_HOST="${SUPABASE_DB_HOST}" \
    SUPABASE_DB_NAME="${SUPABASE_DB_NAME}" \
    SUPABASE_DB_PORT="${SUPABASE_DIRECT_PORT}" \
    SUPABASE_DB_PASSWORD="${password}" \
    node -e '
const user = encodeURIComponent(process.env.SUPABASE_DB_USER || "postgres");
const password = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD || "");
const host = process.env.SUPABASE_DB_HOST;
const port = process.env.SUPABASE_DB_PORT;
const db = process.env.SUPABASE_DB_NAME || "postgres";
if (!host || !password) process.exit(2);
process.stdout.write(`postgresql://${user}:${password}@${host}:${port}/${db}?sslmode=require`);
'
}

resolve_database_url() {
  local value
  for key in MEDIA_SERVING_DATABASE_URL SUPABASE_MEDIA_DATABASE_URL DATABASE_URL; do
    value="${!key:-}"
    [[ -n "${value}" ]] && printf '%s' "${value}" && return 0
  done
  for file in "${SLOANE_ENV_FILE}" "${JAWATCH_ENV_FILE}"; do
    for key in MEDIA_SERVING_DATABASE_URL SUPABASE_MEDIA_DATABASE_URL DATABASE_URL; do
      value="$(read_env_value "${key}" "${file}")"
      [[ -n "${value}" ]] && printf '%s' "${value}" && return 0
    done
  done

  local password="${SUPABASE_DB_PASSWORD:-}"
  [[ -n "${password}" ]] || password="$(read_env_value SUPABASE_DB_PASSWORD "${JAWATCH_ENV_FILE}")"
  [[ -n "${password}" ]] || return 1
  build_postgres_url "${password}"
}

DATABASE_URL="$(resolve_database_url)"
if [[ -z "${DATABASE_URL}" ]]; then
  printf '[compact-media-units] missing Supabase media database URL\n' >&2
  exit 64
fi

mkdir -p "${WORK_DIR}"

source_count="$("${PSQL_BIN}" "${DATABASE_URL}" -v ON_ERROR_STOP=1 -Atqc "select count(*) from public.media_units;")"
printf '[compact-media-units] exporting %s media_units rows to %s\n' "${source_count}" "${EXPORT_FILE}"

"${PSQL_BIN}" "${DATABASE_URL}" -v ON_ERROR_STOP=1 -q >"${EXPORT_FILE}" <<'SQL'
copy (
  select
    unit_key,
    item_key,
    unit_type,
    title,
    label,
    number,
    published_at,
    case
      when unit_type = 'chapter' then jsonb_strip_nulls(jsonb_build_object(
        'pages', detail -> 'pages'
      ))
      when unit_type in ('movie', 'episode') then jsonb_strip_nulls(jsonb_build_object(
        'stream_links_json', detail -> 'stream_links_json',
        'download_links_json', detail -> 'download_links_json',
        'stream_url', detail -> 'stream_url',
        'embed_url', detail -> 'embed_url',
        'video_url', detail -> 'video_url',
        'thumbnail', detail -> 'thumbnail',
        'provider_url', detail -> 'provider_url',
        'platform_code', detail -> 'platform_code',
        'presentation_format', detail -> 'presentation_format',
        'tags', detail -> 'tags',
        'synopsis', detail -> 'synopsis',
        'overview', detail -> 'overview'
      ))
      else '{}'::jsonb
    end as detail,
    updated_at,
    is_canonical
  from public.media_units
  order by unit_key
) to stdout with (format binary);
SQL

if [[ ! -s "${EXPORT_FILE}" ]]; then
  printf '[compact-media-units] export file is empty: %s\n' "${EXPORT_FILE}" >&2
  exit 1
fi

printf '[compact-media-units] rebuilding remote media_units table\n'
"${PSQL_BIN}" "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
set statement_timeout = 0;
set lock_timeout = 0;

drop view if exists watch.stream_options;
drop view if exists watch.download_options;
drop view if exists watch.media_units;
drop view if exists "read".media_units;

drop table public.media_units;

create table public.media_units (
  unit_key text primary key,
  item_key text not null,
  unit_type text not null,
  title text not null,
  label text not null,
  number real,
  published_at timestamptz,
  detail jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null,
  is_canonical boolean not null default true
);

alter table public.media_units enable row level security;
grant all on table public.media_units to anon, authenticated, service_role;
SQL

printf '[compact-media-units] importing compact media_units rows\n'
"${PSQL_BIN}" "${DATABASE_URL}" -v ON_ERROR_STOP=1 -q -c "copy public.media_units (
  unit_key,
  item_key,
  unit_type,
  title,
  label,
  number,
  published_at,
  detail,
  updated_at,
  is_canonical
) from stdin with (format binary)" <"${EXPORT_FILE}"

target_count="$("${PSQL_BIN}" "${DATABASE_URL}" -v ON_ERROR_STOP=1 -Atqc "select count(*) from public.media_units;")"
if [[ "${target_count}" != "${source_count}" ]]; then
  printf '[compact-media-units] row count mismatch after import: source=%s target=%s\n' "${source_count}" "${target_count}" >&2
  exit 1
fi

printf '[compact-media-units] recreating indexes and serving views\n'
"${PSQL_BIN}" "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
set statement_timeout = 0;
set lock_timeout = 0;

create index media_units_item_key_unit_type_number_idx
  on public.media_units (item_key, unit_type, number desc nulls last);

create index media_units_item_key_unit_type_updated_at_idx
  on public.media_units (item_key, unit_type, updated_at desc);

create index media_units_ready_chapter_item_order_idx
  on public.media_units (item_key, number desc nulls last, published_at desc nulls last, updated_at desc)
  where unit_type = 'chapter'
    and coalesce(jsonb_array_length(detail -> 'pages'), 0) > 0;

create index media_units_unit_type_updated_at_idx
  on public.media_units (unit_type, updated_at desc);

create or replace view watch.media_units as
select
  u.unit_key,
  u.item_key,
  u.unit_type,
  u.title,
  u.label,
  u.number,
  u.published_at,
  u.detail,
  u.updated_at,
  u.is_canonical
from public.media_units u
join watch.media_items i on i.item_key = u.item_key
where u.unit_type in ('movie', 'episode');

create or replace view watch.stream_options as
select s.*
from public.media_stream_options s
join watch.media_units u on u.unit_key = s.canonical_unit_key;

create or replace view watch.download_options as
select d.*
from public.media_download_options d
join watch.media_units u on u.unit_key = d.canonical_unit_key;

create or replace view "read".media_units as
select
  u.unit_key,
  u.item_key,
  u.unit_type,
  u.title,
  u.label,
  u.number,
  u.published_at,
  u.detail,
  u.updated_at,
  u.is_canonical
from public.media_units u
join "read".media_items i on i.item_key = u.item_key
where u.unit_type = 'chapter';

grant select on all tables in schema watch to authenticated, service_role;
grant select on all tables in schema "read" to authenticated, service_role;

analyze public.media_units;
SQL

"${PSQL_BIN}" "${DATABASE_URL}" -v ON_ERROR_STOP=1 -P pager=off -F $'\t' -Atqc "
select
  pg_size_pretty(pg_database_size(current_database())) as db_size,
  pg_size_pretty(pg_total_relation_size('public.media_units')) as media_units_size,
  (select count(*) from public.media_units) as media_units,
  (select count(*) from watch.media_units) as watch_units,
  (select count(*) from \"read\".media_units) as read_units,
  (select count(*) from public.media_units where unit_type = 'chapter' and coalesce(jsonb_array_length(detail -> 'pages'), 0) > 0) as ready_chapters;
"
