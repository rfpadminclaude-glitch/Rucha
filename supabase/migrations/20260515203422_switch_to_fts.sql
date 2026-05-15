-- Phase 2 (revised): switch from vector RAG to Postgres FTS keyword search.
-- Embedding columns are kept nullable for a future vector upgrade; their
-- IVFFlat indexes are dropped because they index NULLs.

drop index if exists public.faqs_embedding_idx;
drop index if exists public.site_content_embedding_idx;

-- Generated tsvector columns ('simple' config — language-agnostic, no stemming).
alter table public.faqs
  add column if not exists tsv tsvector
  generated always as (
    to_tsvector('simple', coalesce(question, '') || ' ' || coalesce(answer, ''))
  ) stored;

alter table public.site_content
  add column if not exists tsv tsvector
  generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) stored;

create index if not exists faqs_tsv_idx on public.faqs using gin(tsv);
create index if not exists site_content_tsv_idx on public.site_content using gin(tsv);

-- Replace match_content with FTS version.
drop function if exists public.match_content(vector, int, text);

create or replace function public.match_content(
  query_text text,
  match_count int default 5,
  filter_lang text default null
)
returns table (
  kind text,
  title text,
  content text,
  similarity float,
  domain text,
  source_url text
)
language sql stable
as $$
  with q as (
    select websearch_to_tsquery('simple', coalesce(query_text, '')) as ts
  ),
  faq_hits as (
    select
      'faq'::text as kind,
      f.question as title,
      f.answer as content,
      ts_rank_cd(f.tsv, q.ts)::float as similarity,
      f.domain,
      f.source_url
    from public.faqs f, q
    where f.tsv @@ q.ts
      and (filter_lang is null or f.lang = filter_lang)
  ),
  site_hits as (
    select
      'site'::text as kind,
      coalesce(s.title, s.source_url) as title,
      s.content,
      ts_rank_cd(s.tsv, q.ts)::float as similarity,
      s.domain,
      s.source_url
    from public.site_content s, q
    where s.tsv @@ q.ts
  )
  select * from (
    select * from faq_hits
    union all
    select * from site_hits
  ) all_hits
  where similarity > 0
  order by similarity desc
  limit match_count;
$$;

grant execute on function public.match_content(text, int, text) to anon, authenticated, service_role;
