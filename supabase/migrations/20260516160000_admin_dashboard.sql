-- Phase 8: admin dashboard
-- Adds:
--   * faqs.topic_key  → pairs EN/ES rows for the same topic in the editor
--   * announcements   → CRUD-able content with priority + active toggle
--   * admin_users     → allowlist for the /admin gate (membership = admin)

alter table public.faqs
  add column if not exists topic_key text;

create index if not exists faqs_topic_key_idx on public.faqs(topic_key);

-- Pair EN/ES rows of the same topic — required for the side-by-side editor's
-- upsert to work.
create unique index if not exists faqs_topic_key_lang_uniq
  on public.faqs(topic_key, lang)
  where topic_key is not null;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_es text not null,
  body_en text not null,
  body_es text not null,
  priority int not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists announcements_active_priority_idx
  on public.announcements(active, priority desc);
create index if not exists announcements_starts_at_idx
  on public.announcements(starts_at);

alter table public.announcements enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'announcements'
      and policyname = 'anon can read active announcements'
  ) then
    create policy "anon can read active announcements"
      on public.announcements for select
      to anon
      using (active = true);
  end if;
end $$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

-- admin_users is read by the server-side admin gate using the service role
-- (not exposed to anon).
alter table public.admin_users enable row level security;
