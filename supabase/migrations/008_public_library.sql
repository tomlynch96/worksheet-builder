-- Public library: worksheets can be shared when exported to PDF.
-- is_public: whether this worksheet is visible in the public library
-- published_at: when it was first published
-- attribution: 'anonymous' or 'named' (teacher's display name shown)
-- publish_opt_out: teacher explicitly chose not to share this sheet
alter table public.worksheets
  add column if not exists is_public       boolean not null default false,
  add column if not exists published_at    timestamptz,
  add column if not exists attribution     text check (attribution in ('anonymous', 'named')) default 'anonymous',
  add column if not exists publish_opt_out boolean not null default false;

-- Index for efficient spec-point search on the public library
create index if not exists worksheets_public_spec
  on public.worksheets (is_public, qualification_id, exam_board, spec_point)
  where is_public;

-- Allow any signed-in user to read public worksheets (read-only)
create policy "worksheets: public read"
  on public.worksheets for select
  using (is_public = true);
