alter table public.reader_preferences
  add column if not exists theme_mode text not null default 'system'
  check (theme_mode in ('system','light','dark'));
