-- Aggregated AI insights generated from all a teacher's annotations
create table if not exists public.profile_insights (
  id              uuid        primary key default gen_random_uuid(),
  profile_id      uuid        not null references public.profiles(id) on delete cascade,
  insight_text    text        not null,
  annotation_count int        not null default 0,
  generated_at    timestamptz not null default now()
);
alter table public.profile_insights enable row level security;
create policy "allow all" on public.profile_insights for all using (true) with check (true);

create index if not exists profile_insights_profile on public.profile_insights (profile_id, generated_at desc);
