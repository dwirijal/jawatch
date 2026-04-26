set lock_timeout = '5s';
set statement_timeout = '2min';

drop view if exists watch.item_enrichments;
drop view if exists "read".item_enrichments;

drop table if exists public.media_item_enrichments_compact;
create table public.media_item_enrichments_compact (
  item_key text,
  provider text,
  external_id text,
  match_status text,
  match_score smallint,
  matched_title text,
  matched_year smallint,
  payload jsonb,
  updated_at timestamptz
);

insert into public.media_item_enrichments_compact (
  item_key,
  provider,
  external_id,
  match_status,
  match_score,
  matched_title,
  matched_year,
  payload,
  updated_at
)
select
  item_key,
  provider,
  external_id,
  match_status,
  match_score,
  matched_title,
  matched_year,
  payload,
  updated_at
from public.media_item_enrichments
where provider in ('tmdb', 'jikan', 'fanart')
  and match_status = 'matched';

drop table public.media_item_enrichments;
alter table public.media_item_enrichments_compact rename to media_item_enrichments;

create index media_item_enrichments_provider_match_idx
  on public.media_item_enrichments (item_key, provider, match_status, updated_at desc);

create or replace view watch.item_enrichments as
select e.*
from public.media_item_enrichments e
join watch.media_items i on i.item_key = e.item_key;

create or replace view "read".item_enrichments as
select e.*
from public.media_item_enrichments e
join "read".media_items i on i.item_key = e.item_key;

grant select on all tables in schema watch to authenticated, service_role;
grant select on all tables in schema "read" to authenticated, service_role;

analyze public.media_item_enrichments;
