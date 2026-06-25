-- Stores results from scanning completed bubble sheets.
-- question_results is a map of canonical question id → correct (true/false).
create table quiz_scans (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references mc_quizzes(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade not null,
  version_number int not null,
  score int not null,
  question_count int not null,
  question_results jsonb not null default '{}',
  scanned_at timestamptz default now()
);

alter table quiz_scans enable row level security;

create policy "owner: full access on quiz_scans"
  on quiz_scans for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
