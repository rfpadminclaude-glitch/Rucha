-- Phase 3: conversation rating
-- One rating per conversation; nullable until the user submits.

alter table public.conversations
  add column if not exists rating int check (rating between 1 and 5),
  add column if not exists rating_comment text,
  add column if not exists rated_at timestamptz;

-- Allow anon to update their conversation's rating fields.
create policy "anon can rate conversations"
  on public.conversations for update
  to anon
  using (true)
  with check (true);
