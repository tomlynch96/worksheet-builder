-- Migration: switch from localStorage UUID identity to Supabase Auth
-- Run this in your Supabase SQL editor AFTER the initial schema (001_initial.sql)
--
-- What this does:
--   1. Drops the open "allow all" RLS policies
--   2. Adds auth-based RLS: each user can only access their own data
--   3. Profiles.id is now expected to equal auth.uid() (the app inserts it that way)

-- Drop the open MVP policies
drop policy if exists "allow all" on public.profiles;
drop policy if exists "allow all" on public.user_courses;
drop policy if exists "allow all" on public.worksheets;

-- Profiles: each user owns one row where id = auth.uid()
create policy "profiles: owner access"
  on public.profiles for all
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- User courses: scoped through the parent profile
create policy "user_courses: owner access"
  on public.user_courses for all
  using  (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Worksheets: scoped to the owning profile
create policy "worksheets: owner access"
  on public.worksheets for all
  using  (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
