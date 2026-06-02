-- Store email on profiles so we can display it and detect identity mismatches.
-- Backfilled on next sign-in by the app (useProfile.loadProfile sets it).
alter table public.profiles
  add column if not exists email text;
