alter table public.profiles
  add column if not exists biometric_enabled boolean not null default false,
  add column if not exists biometric_onboarding_completed boolean not null default false,
  add column if not exists guide_completed boolean not null default false,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz;
