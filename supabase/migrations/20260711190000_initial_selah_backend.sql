create extension if not exists pgcrypto with schema extensions;

create type public.thought_group as enum ('Observation','Interpretation','Connection','Application','Prayer','Question');
create type public.subscription_tier as enum ('free','pro');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  preferred_translation_id text not null default 'BSB',
  preferred_translation_name text not null default 'Berean Standard Bible',
  preferred_translation_short_name text not null default 'BSB',
  subscription_tier public.subscription_tier not null default 'free',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.garden_notes (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  translation_id text not null default 'BSB',
  book_id text,
  book_name text not null,
  chapter integer not null check (chapter > 0),
  page integer not null check (page > 0),
  verse_start integer check (verse_start is null or verse_start > 0),
  verse_end integer check (verse_end is null or verse_end >= verse_start),
  reference text not null,
  title text not null check (char_length(trim(title)) between 1 and 160),
  body text not null check (char_length(trim(body)) between 1 and 20000),
  thought_group public.thought_group not null default 'Observation',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index garden_notes_user_updated_idx on public.garden_notes(user_id, updated_at desc);
create index garden_notes_tags_idx on public.garden_notes using gin(tags);
create index garden_notes_location_idx on public.garden_notes(user_id, book_id, chapter, page);

create table public.reader_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dark_mode boolean not null default true,
  show_verse_numbers boolean not null default true,
  red_lettering boolean not null default true,
  reader_font_size smallint not null default 20 check (reader_font_size between 16 and 34),
  bookmark_color text not null default '#D4A72C' check (bookmark_color ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz not null default now()
);

create table public.reading_bookmarks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  translation_id text not null default 'BSB',
  book_id text not null,
  book_name text not null,
  chapter integer not null check (chapter > 0),
  page integer not null check (page > 0),
  color text not null default '#D4A72C' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz not null default now()
);

create table public.reminder_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  hour smallint not null default 8 check (hour between 1 and 12),
  minute smallint not null default 0 check (minute between 0 and 59),
  period text not null default 'AM' check (period in ('AM','PM')),
  days smallint[] not null default '{1,2,3,4,5}',
  timezone text not null default 'America/New_York',
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger garden_notes_updated before update on public.garden_notes for each row execute function public.set_updated_at();
create trigger preferences_updated before update on public.reader_preferences for each row execute function public.set_updated_at();
create trigger bookmarks_updated before update on public.reading_bookmarks for each row execute function public.set_updated_at();
create trigger reminders_updated before update on public.reminder_settings for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name',''));
  insert into public.reader_preferences(user_id) values (new.id);
  insert into public.reminder_settings(user_id) values (new.id);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.garden_notes enable row level security;
alter table public.reader_preferences enable row level security;
alter table public.reading_bookmarks enable row level security;
alter table public.reminder_settings enable row level security;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "notes_select_own" on public.garden_notes for select to authenticated using ((select auth.uid()) = user_id);
create policy "notes_insert_own" on public.garden_notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "notes_update_own" on public.garden_notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notes_delete_own" on public.garden_notes for delete to authenticated using ((select auth.uid()) = user_id);
create policy "preferences_select_own" on public.reader_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "preferences_update_own" on public.reader_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "preferences_insert_own" on public.reader_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "bookmarks_all_own" on public.reading_bookmarks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "reminders_select_own" on public.reminder_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy "reminders_update_own" on public.reminder_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "reminders_insert_own" on public.reminder_settings for insert to authenticated with check ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.garden_notes to authenticated;
grant select, insert, update on public.reader_preferences to authenticated;
grant select, insert, update, delete on public.reading_bookmarks to authenticated;
grant select, insert, update on public.reminder_settings to authenticated;
