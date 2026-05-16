-- Phase 5: PDF uploads parsed into searchable text
-- One row per upload. Extracted text is stored so subsequent turns can
-- reference the document without re-parsing.

create table if not exists public.uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete set null,
  filename text not null,
  extracted_text text not null,
  page_count int,
  byte_size int,
  created_at timestamptz not null default now()
);

create index if not exists uploaded_documents_conversation_id_idx
  on public.uploaded_documents(conversation_id);
create index if not exists uploaded_documents_created_at_idx
  on public.uploaded_documents(created_at desc);

alter table public.uploaded_documents enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'uploaded_documents'
      and policyname = 'anon can read uploaded documents'
  ) then
    create policy "anon can read uploaded documents"
      on public.uploaded_documents for select
      to anon
      using (true);
  end if;
end $$;

-- Writes come from the chat Edge Function under the service role, so no anon
-- insert policy is needed.
