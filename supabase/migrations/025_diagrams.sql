-- Shared diagram library: AI-generated (and teacher-refined) SVG diagrams that
-- any teacher can reuse in their own worksheets.
-- svg_template holds {{key}} placeholders for labelled quantities; `variables`
-- holds their default values so the same drawing can be relabelled per sheet.
create table diagrams (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete set null,
  title text not null default '',
  description text not null default '',
  svg_template text not null,
  variables jsonb not null default '[]',
  spec_points text[] not null default '{}',
  topics text[] not null default '{}',
  exam_board text,
  qualification text,
  prompts text[] not null default '{}',     -- generation + refinement history
  parent_id uuid references diagrams(id) on delete set null,  -- refined from
  is_public boolean not null default true,
  use_count int not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index diagrams_spec_points on diagrams using gin (spec_points);
create index diagrams_topics on diagrams using gin (topics);

alter table diagrams enable row level security;

create policy "owner: full access on diagrams"
  on diagrams for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "signed in: read public diagrams"
  on diagrams for select
  using (is_public and auth.uid() is not null);

-- Reusing someone else's diagram bumps its count without granting update rights.
create or replace function increment_diagram_use(diagram_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update diagrams set use_count = use_count + 1 where id = diagram_id and is_public;
$$;

grant execute on function increment_diagram_use(uuid) to authenticated;
