-- Phase 2: RAG schema (FAQs + scraped site content + vector search)
-- Embeddings are 1536-dim from OpenAI text-embedding-3-small.

create extension if not exists vector;

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  lang text not null check (lang in ('en', 'es')),
  question text not null,
  answer text not null,
  category text,
  domain text not null check (domain in ('cityofdoral.com', 'doralpd.com')),
  source_url text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  domain text not null check (domain in ('cityofdoral.com', 'doralpd.com')),
  source_url text not null,
  title text,
  content text not null,
  embedding vector(1536),
  updated_at timestamptz not null default now()
);

create index if not exists faqs_lang_idx on public.faqs(lang);
create index if not exists faqs_domain_idx on public.faqs(domain);
create index if not exists site_content_domain_idx on public.site_content(domain);

-- Vector indexes (IVFFlat with cosine distance). lists=100 is fine for small POC corpus.
create index if not exists faqs_embedding_idx
  on public.faqs using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists site_content_embedding_idx
  on public.site_content using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table public.faqs enable row level security;
alter table public.site_content enable row level security;

create policy "anon can read faqs"
  on public.faqs for select to anon using (true);
create policy "anon can read site_content"
  on public.site_content for select to anon using (true);

-- Unified retrieval RPC: returns top-K matches across faqs and site_content
-- ordered by cosine similarity. Filter by lang if provided.
create or replace function public.match_content(
  query_embedding vector(1536),
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
  with faq_hits as (
    select
      'faq'::text as kind,
      question as title,
      answer as content,
      1 - (embedding <=> query_embedding) as similarity,
      domain,
      source_url
    from public.faqs
    where embedding is not null
      and (filter_lang is null or lang = filter_lang)
  ),
  site_hits as (
    select
      'site'::text as kind,
      coalesce(title, source_url) as title,
      content,
      1 - (embedding <=> query_embedding) as similarity,
      domain,
      source_url
    from public.site_content
    where embedding is not null
  )
  select * from (
    select * from faq_hits
    union all
    select * from site_hits
  ) all_hits
  order by similarity desc
  limit match_count;
$$;

grant execute on function public.match_content(vector, int, text) to anon, authenticated, service_role;
