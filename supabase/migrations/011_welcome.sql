-- App-wide config table (key/value, admin-writable, world-readable)
create table if not exists public.app_config (
  key   text primary key,
  value text not null
);

alter table public.app_config enable row level security;

create policy "app_config: anyone can read"
  on public.app_config for select using (true);

create policy "app_config: admin can write"
  on public.app_config for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Seed the default welcome message (admin can edit this from the dashboard)
insert into public.app_config (key, value) values
  ('welcome_title',   'Welcome to Worksheet Builder — Early Access'),
  ('welcome_message', 'Thanks for joining the trial. This is a free tool built for secondary science teachers. You can generate, edit and download print-ready worksheets in minutes.

By using the trial you agree to receive occasional emails from me asking for feedback on your experience. These will be short and infrequent — your input directly shapes what gets built next.

If you have any questions, reply directly to any of my emails.')
on conflict (key) do nothing;

-- Track whether a user has seen and accepted the welcome message
alter table public.profiles
  add column if not exists welcome_seen    boolean not null default false,
  add column if not exists email_consent   boolean not null default false;
