-- Phase 4: 311 service requests + storage bucket for photos

create sequence if not exists public.service_request_seq;

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique not null,
  conversation_id uuid references public.conversations(id) on delete set null,
  request_type text not null check (
    request_type in (
      'pothole', 'streetlight', 'graffiti', 'tree', 'sidewalk',
      'trash', 'noise', 'other'
    )
  ),
  location text,
  description text,
  photo_url text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists service_requests_conversation_id_idx
  on public.service_requests(conversation_id);
create index if not exists service_requests_created_at_idx
  on public.service_requests(created_at desc);
create index if not exists service_requests_status_idx
  on public.service_requests(status);

alter table public.service_requests enable row level security;

create policy "anon can read service requests"
  on public.service_requests for select
  to anon
  using (true);

-- Ticket numbers are minted server-side via the chat Edge Function using the
-- service role key, so we don't need an anon insert policy here.

-- Mint human-readable ticket numbers: PREFIX-YYYY-####
create or replace function public.generate_ticket_number(req_type text)
returns text
language sql
as $$
  select
    case req_type
      when 'pothole' then 'POT'
      when 'streetlight' then 'LGT'
      when 'graffiti' then 'GRF'
      when 'tree' then 'TRE'
      when 'sidewalk' then 'SDW'
      when 'trash' then 'TRH'
      when 'noise' then 'NOI'
      else 'SR'
    end
    || '-' || to_char(now(), 'YYYY')
    || '-' || lpad(nextval('public.service_request_seq')::text, 4, '0');
$$;

-- Storage bucket for chat-attached photos
insert into storage.buckets (id, name, public)
values ('service-request-photos', 'service-request-photos', true)
on conflict (id) do nothing;

-- Anyone can upload to this bucket (chat is unauthenticated); files are publicly readable.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'anon can upload service request photos'
  ) then
    create policy "anon can upload service request photos"
      on storage.objects for insert to anon
      with check (bucket_id = 'service-request-photos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'public can read service request photos'
  ) then
    create policy "public can read service request photos"
      on storage.objects for select to anon
      using (bucket_id = 'service-request-photos');
  end if;
end $$;
