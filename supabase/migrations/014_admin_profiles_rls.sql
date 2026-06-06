-- Allow admins to read all profiles (fixes user count on admin dashboard)
create policy "admin: read all profiles"
  on profiles for select
  using (exists (
    select 1 from profiles where id = auth.uid() and is_admin = true
  ));

-- Allow admins to read all worksheet_edits (fixes edit count on admin dashboard)
create policy "admin: read all worksheet_edits"
  on worksheet_edits for select
  using (exists (
    select 1 from profiles where id = auth.uid() and is_admin = true
  ));
