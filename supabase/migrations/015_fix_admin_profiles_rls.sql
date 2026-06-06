-- 014_admin_profiles_rls.sql introduced a recursive SELECT policy on profiles:
-- it queried profiles from within a profiles SELECT policy, causing infinite
-- recursion that breaks profile reads for all users (including onboarding).
--
-- Fix: drop the broken policies, introduce a security-definer helper that
-- bypasses RLS when checking is_admin, and re-add the policies using it.

drop policy if exists "admin: read all profiles"       on public.profiles;
drop policy if exists "admin: read all worksheet_edits" on public.worksheet_edits;

-- Runs as the function owner (bypasses RLS on profiles — no recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

create policy "admin: read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "admin: read all worksheet_edits"
  on public.worksheet_edits for select
  using (public.is_admin());
