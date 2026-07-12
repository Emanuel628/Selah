alter table public.garden_notes
  add column if not exists verse_start integer,
  add column if not exists verse_end integer,
  add column if not exists status text not null default 'open'
    check (status in ('open','resolved','practiced','archived')),
  add column if not exists origin text not null default 'user_written'
    check (origin in ('user_written','ai_prompted','ai_generated','ai_edited')),
  add column if not exists last_revisited_at timestamptz;

alter table public.garden_notes
  alter column title drop not null,
  alter column thought_group drop not null,
  alter column thought_group drop default;

alter table public.garden_notes
  drop constraint if exists garden_notes_title_check;

alter table public.garden_notes
  add constraint garden_notes_title_length
    check (title is null or char_length(trim(title)) <= 160);

create index if not exists garden_notes_verse_anchor_idx
  on public.garden_notes(user_id, translation_id, book_id, chapter, verse_start, verse_end);

create table if not exists public.reflection_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_reflection_id uuid not null references public.garden_notes(id) on delete cascade,
  target_reflection_id uuid not null references public.garden_notes(id) on delete cascade,
  relationship_type text not null
    check (relationship_type in ('relates_to','builds_on','answers','contrasts_with','follow_up_to','fulfillment_of','application_of')),
  created_at timestamptz not null default now(),
  check (source_reflection_id <> target_reflection_id)
);

create table if not exists public.reflection_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reflection_id uuid not null references public.garden_notes(id) on delete cascade,
  event_type text not null
    check (event_type in ('revisited','resolved','practiced','follow_up_added','connection_created')),
  body text,
  occurred_at timestamptz not null default now()
);

alter table public.reflection_links enable row level security;
alter table public.reflection_events enable row level security;

create policy "reflection_links_select_own" on public.reflection_links
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reflection_links_insert_own" on public.reflection_links
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "reflection_links_update_own" on public.reflection_links
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "reflection_links_delete_own" on public.reflection_links
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "reflection_events_select_own" on public.reflection_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reflection_events_insert_own" on public.reflection_events
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "reflection_events_update_own" on public.reflection_events
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "reflection_events_delete_own" on public.reflection_events
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.reflection_links to authenticated;
grant select, insert, update, delete on public.reflection_events to authenticated;
