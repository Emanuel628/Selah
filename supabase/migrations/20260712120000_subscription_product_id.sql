alter table public.profiles
  add column if not exists subscription_product_id text;

create index if not exists profiles_subscription_product_idx
  on public.profiles(subscription_product_id);
