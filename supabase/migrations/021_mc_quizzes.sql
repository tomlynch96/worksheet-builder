-- MC follow-up quizzes linked to a worksheet.
-- Each quiz stores canonical questions; versions are computed client-side.
create table mc_quizzes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade not null,
  worksheet_id uuid references worksheets(id) on delete cascade not null,
  title text not null default '',
  question_count int not null,
  version_count int not null,
  questions jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table mc_quizzes enable row level security;

create policy "owner: full access on mc_quizzes"
  on mc_quizzes for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
