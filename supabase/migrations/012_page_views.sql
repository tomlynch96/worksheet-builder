-- Track one row per user session for visit/login analytics
create table if not exists page_views (
  id         bigint generated always as identity primary key,
  profile_id uuid references profiles(id) on delete set null,
  visited_at timestamptz default now()
);

alter table page_views enable row level security;

create policy "users insert own" on page_views
  for insert with check (profile_id = auth.uid());

create policy "admin select" on page_views
  for select using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
