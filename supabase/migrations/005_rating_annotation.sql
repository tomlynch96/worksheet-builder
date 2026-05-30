-- Worksheet Builder — rating, annotation & block-level insights
-- Run this in your Supabase SQL editor

-- Overall worksheet rating + teacher annotation
alter table public.worksheets
  add column if not exists rating     smallint check (rating >= 1 and rating <= 5),
  add column if not exists annotation text;

-- Per-block annotations (saved with the final block JSON; original is optional)
create table if not exists public.block_annotations (
  id              uuid primary key default gen_random_uuid(),
  worksheet_id    uuid not null references public.worksheets(id) on delete cascade,
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  block_id        text not null,
  block_type      text not null,
  original_block  jsonb,
  final_block     jsonb not null,
  annotation      text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (worksheet_id, block_id)
);
alter table public.block_annotations enable row level security;
create policy "allow all" on public.block_annotations for all using (true) with check (true);

-- AI-generated insights on block annotations, with teacher feedback
create table if not exists public.annotation_insights (
  id                    uuid primary key default gen_random_uuid(),
  block_annotation_id   uuid not null references public.block_annotations(id) on delete cascade,
  insight_text          text not null,
  teacher_rating        smallint check (teacher_rating in (-1, 1)),
  teacher_comment       text,
  created_at            timestamptz not null default now()
);
alter table public.annotation_insights enable row level security;
create policy "allow all" on public.annotation_insights for all using (true) with check (true);

create index if not exists block_annotations_worksheet on public.block_annotations (worksheet_id);
create index if not exists block_annotations_profile   on public.block_annotations (profile_id);
create index if not exists block_annotations_type      on public.block_annotations (block_type);
