alter table public.reader_preferences
  add column if not exists highlight_color text default '#F7D774';

create table if not exists public.app_store_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  transaction_id text not null unique,
  raw_purchase jsonb not null default '{}'::jsonb,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_store_transactions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'app_store_transactions'
      and policyname = 'Users can read own app store transactions'
  ) then
    create policy "Users can read own app store transactions"
      on public.app_store_transactions for select
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists app_store_transactions_user_idx
  on public.app_store_transactions(user_id, created_at desc);
