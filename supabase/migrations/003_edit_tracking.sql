-- Migration: edit tracking for AI-generated worksheets
-- Run in Supabase SQL editor after 002_supabase_auth.sql

-- Add metadata columns to worksheets
alter table public.worksheets
  add column if not exists ai_generated  boolean     not null default false,
  add column if not exists worksheet_type text,
  add column if not exists original_blocks jsonb;

-- One edit-tracking row per AI worksheet, upserted on each autosave.
-- Stores the net diff between the original AI output and the current saved state.
create table if not exists public.worksheet_edits (
  worksheet_id      uuid        primary key references public.worksheets(id) on delete cascade,
  profile_id        uuid        not null references public.profiles(id) on delete cascade,

  -- Context (denormalised for efficient querying)
  topic             text,
  exam_board        text,
  worksheet_type    text,   -- 'maths' | 'knowledge' | 'practical'

  -- Net block-level changes vs. original AI output
  blocks_added      int         not null default 0,
  blocks_removed    int         not null default 0,
  blocks_modified   int         not null default 0,

  -- Which block types were affected (useful for aggregation)
  block_types_added     text[]  not null default '{}',
  block_types_removed   text[]  not null default '{}',
  block_types_modified  text[]  not null default '{}',

  -- Question-specific signals
  questions_added   int         not null default 0,
  questions_removed int         not null default 0,
  marks_raised      int         not null default 0,   -- questions where marks went up
  marks_lowered     int         not null default 0,   -- questions where marks went down
  stems_edited      int         not null default 0,   -- question stems that were changed

  -- Snapshot metadata
  original_block_count  int,
  final_block_count     int,
  last_updated          timestamptz not null default now()
);

alter table public.worksheet_edits enable row level security;
create policy "edits: owner access"
  on public.worksheet_edits for all
  using  (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Index for dashboard queries
create index if not exists worksheet_edits_topic       on public.worksheet_edits (topic);
create index if not exists worksheet_edits_type        on public.worksheet_edits (worksheet_type);
create index if not exists worksheet_edits_profile     on public.worksheet_edits (profile_id);
create index if not exists worksheet_edits_updated     on public.worksheet_edits (last_updated desc);
