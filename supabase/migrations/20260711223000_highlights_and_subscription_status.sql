alter table public.profiles
  add column if not exists subscription_status text not null default 'free'
    check (subscription_status in ('free','trialing','active','canceled','past_due')),
  add column if not exists subscription_provider text,
  add column if not exists subscription_cancel_at_period_end boolean not null default false;

update public.profiles
set subscription_status = case
  when subscription_tier = 'pro' and trial_ends_at is not null and trial_ends_at > now() then 'trialing'
  when subscription_tier = 'pro' then 'active'
  else 'free'
end
where subscription_status = 'free';

create table if not exists public.scripture_highlights (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  translation_id text not null default 'BSB',
  book_id text not null,
  book_name text not null,
  chapter integer not null check (chapter > 0),
  page integer not null check (page > 0),
  verse_start integer not null check (verse_start > 0),
  verse_end integer not null check (verse_end >= verse_start),
  color text not null default '#F7D774' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scripture_highlights_user_location_idx
  on public.scripture_highlights(user_id, translation_id, book_id, chapter, page);

drop trigger if exists scripture_highlights_updated on public.scripture_highlights;
create trigger scripture_highlights_updated before update on public.scripture_highlights
for each row execute function public.set_updated_at();

alter table public.scripture_highlights enable row level security;

drop policy if exists "highlights_all_own" on public.scripture_highlights;
create policy "highlights_all_own" on public.scripture_highlights
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.scripture_highlights to authenticated;
