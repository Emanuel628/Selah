alter table public.profiles
  add column if not exists subscription_expires_at timestamptz;

alter table public.app_store_transactions
  add column if not exists original_transaction_id text,
  add column if not exists environment text,
  add column if not exists expires_at timestamptz;

create index if not exists app_store_transactions_original_idx
  on public.app_store_transactions(original_transaction_id);

create index if not exists profiles_subscription_expires_idx
  on public.profiles(subscription_expires_at);
