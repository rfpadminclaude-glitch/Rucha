-- Phase 1: thin-slice chat schema
-- Two tables: conversations (one row per chat session) and messages (one row per turn)

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_lang text not null default 'en' check (user_lang in ('en', 'es'))
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  llm_provider text check (llm_provider in ('gemini', 'groq')),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_created_at_idx on public.messages(created_at);
create index if not exists conversations_created_at_idx on public.conversations(created_at);

-- RLS: anon clients can insert (chat is public-facing) but can only read their own session.
-- For POC, keep simple: allow anon read+write. Tighten before production.
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "anon can read conversations"
  on public.conversations for select
  to anon
  using (true);

create policy "anon can insert conversations"
  on public.conversations for insert
  to anon
  with check (true);

create policy "anon can read messages"
  on public.messages for select
  to anon
  using (true);

create policy "anon can insert messages"
  on public.messages for insert
  to anon
  with check (true);
