-- Schemes of Work feature
-- schemes: one scheme per teacher per qualification
create table if not exists public.schemes (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  qualification_id text not null,
  exam_board     text not null,
  name           text not null default 'Scheme of Work',
  academic_year  text not null default '2025-26',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- scheme_topics: ordered topic slots within a scheme (week-based)
create table if not exists public.scheme_topics (
  id           uuid primary key default gen_random_uuid(),
  scheme_id    uuid not null references public.schemes(id) on delete cascade,
  week_number  int not null,  -- 1-based week in academic year
  topic_ref    text,          -- spec point ref e.g. "P1.1"
  topic_label  text,          -- human-readable label
  position     int not null default 0,
  created_at   timestamptz not null default now()
);

-- scheme_topic_worksheets: worksheets attached to a topic in teaching order
create table if not exists public.scheme_topic_worksheets (
  id               uuid primary key default gen_random_uuid(),
  scheme_topic_id  uuid not null references public.scheme_topics(id) on delete cascade,
  worksheet_id     uuid not null references public.worksheets(id) on delete cascade,
  position         int not null default 0,
  unique (scheme_topic_id, worksheet_id)
);

-- recall_checkins: generated recall check-in worksheets attached to a scheme at a given week
create table if not exists public.recall_checkins (
  id                   uuid primary key default gen_random_uuid(),
  scheme_id            uuid not null references public.schemes(id) on delete cascade,
  profile_id           uuid not null references public.profiles(id) on delete cascade,
  at_week              int not null,  -- week number the check-in is scheduled for
  marks_target         int not null default 20,
  worksheet_id         uuid references public.worksheets(id) on delete set null,
  source_worksheet_ids uuid[] not null default '{}',
  created_at           timestamptz not null default now()
);

-- RLS
alter table public.schemes enable row level security;
alter table public.scheme_topics enable row level security;
alter table public.scheme_topic_worksheets enable row level security;
alter table public.recall_checkins enable row level security;

create policy "owner: all on schemes"
  on public.schemes for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "owner: all on scheme_topics"
  on public.scheme_topics for all
  using (exists (select 1 from public.schemes s where s.id = scheme_id and s.profile_id = auth.uid()));

create policy "owner: all on scheme_topic_worksheets"
  on public.scheme_topic_worksheets for all
  using (exists (
    select 1 from public.scheme_topics st
    join public.schemes s on s.id = st.scheme_id
    where st.id = scheme_topic_id and s.profile_id = auth.uid()
  ));

create policy "owner: all on recall_checkins"
  on public.recall_checkins for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
