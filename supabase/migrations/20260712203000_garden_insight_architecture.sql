create extension if not exists vector with schema extensions;

alter table public.garden_notes
  add column if not exists embedding extensions.vector(384),
  add column if not exists embedding_model text,
  add column if not exists embedding_version text,
  add column if not exists embedding_updated_at timestamptz,
  add column if not exists search_vector tsvector,
  add column if not exists analysis_updated_at timestamptz;

create or replace function public.set_garden_notes_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    to_tsvector(
      'english',
      coalesce(new.title,'') || ' ' ||
      coalesce(new.body,'') || ' ' ||
      coalesce(new.reference,'') || ' ' ||
      coalesce(new.book_name,'') || ' ' ||
      array_to_string(coalesce(new.tags, array[]::text[]), ' ')
    );
  return new;
end;
$$;

drop trigger if exists garden_notes_search_vector_update on public.garden_notes;
create trigger garden_notes_search_vector_update
  before insert or update of title, body, reference, book_name, tags
  on public.garden_notes
  for each row execute function public.set_garden_notes_search_vector();

update public.garden_notes
set search_vector =
  to_tsvector(
    'english',
    coalesce(title,'') || ' ' ||
    coalesce(body,'') || ' ' ||
    coalesce(reference,'') || ' ' ||
    coalesce(book_name,'') || ' ' ||
    array_to_string(coalesce(tags, array[]::text[]), ' ')
  )
where search_vector is null;

create index if not exists garden_notes_search_vector_idx
  on public.garden_notes using gin(search_vector);

create index if not exists garden_notes_embedding_idx
  on public.garden_notes using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 50);

alter table public.garden_notes
  drop constraint if exists garden_notes_origin_check;

alter table public.garden_notes
  add constraint garden_notes_origin_check
    check (origin in ('user_written','guided_prompted','system_generated','user_edited','ai_prompted','ai_generated','ai_edited'));

create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  created_at timestamptz not null default now(),
  unique(user_id, normalized_name)
);

create table if not exists public.reflection_themes (
  reflection_id uuid not null references public.garden_notes(id) on delete cascade,
  theme_id uuid not null references public.themes(id) on delete cascade,
  source text not null default 'user'
    check (source in ('user','suggested','confirmed')),
  confidence double precision,
  created_at timestamptz not null default now(),
  primary key(reflection_id, theme_id)
);

alter table public.reflection_links
  add column if not exists source text not null default 'user'
    check (source in ('user','inferred')),
  add column if not exists confidence double precision,
  add column if not exists confirmed_at timestamptz;

alter table public.reflection_links
  drop constraint if exists reflection_links_relationship_type_check;

alter table public.reflection_links
  add constraint reflection_links_relationship_type_check
    check (relationship_type in ('relates_to','builds_on','answers','contrasts_with','follow_up_to','application_of','fulfillment_of'));

alter table public.reflection_events
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.reflection_events
  drop constraint if exists reflection_events_event_type_check;

alter table public.reflection_events
  add constraint reflection_events_event_type_check
    check (event_type in ('revisited','resolved','practiced','follow_up_added','relationship_confirmed','relationship_rejected','connection_created'));

create table if not exists public.garden_insights (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  headline text not null,
  explanation text not null,
  confidence double precision not null,
  status text not null default 'active'
    check (status in ('active','dismissed','expired','accepted')),
  evidence_hash text not null,
  engine_version text not null,
  created_at timestamptz not null default now(),
  last_shown_at timestamptz,
  expires_at timestamptz
);

create table if not exists public.garden_insight_evidence (
  insight_id text not null references public.garden_insights(id) on delete cascade,
  reflection_id uuid not null references public.garden_notes(id) on delete cascade,
  evidence_role text not null default 'supporting',
  evidence_score double precision,
  primary key(insight_id, reflection_id)
);

create table if not exists public.garden_insight_feedback (
  id uuid primary key default gen_random_uuid(),
  insight_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  feedback text not null
    check (feedback in ('accurate','inaccurate','useful','dismissed')),
  created_at timestamptz not null default now()
);

alter table public.themes enable row level security;
alter table public.reflection_themes enable row level security;
alter table public.garden_insights enable row level security;
alter table public.garden_insight_evidence enable row level security;
alter table public.garden_insight_feedback enable row level security;

create policy "themes_all_own" on public.themes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "reflection_themes_all_own" on public.reflection_themes
  for all to authenticated
  using (
    exists (
      select 1 from public.garden_notes n
      where n.id = reflection_id and n.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.garden_notes n
      where n.id = reflection_id and n.user_id = (select auth.uid())
    )
  );

create policy "garden_insights_all_own" on public.garden_insights
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "garden_insight_evidence_all_own" on public.garden_insight_evidence
  for all to authenticated
  using (
    exists (
      select 1 from public.garden_insights i
      where i.id = insight_id and i.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.garden_insights i
      where i.id = insight_id and i.user_id = (select auth.uid())
    )
  );

create policy "garden_insight_feedback_all_own" on public.garden_insight_feedback
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.themes to authenticated;
grant select, insert, update, delete on public.reflection_themes to authenticated;
grant select, insert, update, delete on public.garden_insights to authenticated;
grant select, insert, update, delete on public.garden_insight_evidence to authenticated;
grant select, insert, update, delete on public.garden_insight_feedback to authenticated;
