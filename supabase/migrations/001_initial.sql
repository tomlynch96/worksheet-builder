-- Worksheet Builder — initial schema
-- Run this in your Supabase SQL editor

-- Profiles (identified by UUID stored in localStorage — no auth required)
create table if not exists public.profiles (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Teacher',
  created_at timestamptz not null default now()
);

-- Which qualifications a profile teaches
create table if not exists public.user_courses (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  qualification_id text not null,  -- 'gcse-physics' | 'gcse-combined' | 'alevel-physics'
  exam_board       text not null,  -- 'AQA' | 'OCR' | 'Edexcel' | 'WJEC'
  unique (profile_id, qualification_id, exam_board)
);

-- Worksheets
create table if not exists public.worksheets (
  id               uuid primary key,
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  title            text not null default '',
  topic            text not null default '',
  qualification_id text,          -- links to QualificationOffering.id
  exam_board       text not null default 'AQA',
  tier             text not null default 'higher',
  spec_point       text,
  blocks           jsonb not null default '[]',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger worksheets_updated_at
  before update on public.worksheets
  for each row execute procedure public.set_updated_at();

-- Open RLS policies for single-user MVP (tighten when adding auth)
alter table public.profiles    enable row level security;
alter table public.user_courses enable row level security;
alter table public.worksheets   enable row level security;

create policy "allow all" on public.profiles    for all using (true) with check (true);
create policy "allow all" on public.user_courses for all using (true) with check (true);
create policy "allow all" on public.worksheets   for all using (true) with check (true);
