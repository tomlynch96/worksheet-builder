-- Mark recall-generated worksheets so they don't appear in the gallery
alter table public.worksheets add column if not exists is_recall boolean not null default false;
