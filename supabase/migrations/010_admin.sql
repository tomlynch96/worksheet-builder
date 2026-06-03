-- Add is_admin flag to profiles
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Allow admins to update any worksheet (e.g. unpublish from library)
create policy "admin: update any worksheet"
  on public.worksheets
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Allow admins to read all worksheets (not just their own or public)
create policy "admin: read all worksheets"
  on public.worksheets
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
