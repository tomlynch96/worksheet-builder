-- Add multi-week spanning and multi-qualification browsing to schemes

-- Rename week_number → week_start (idempotent)
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'scheme_topics' and column_name = 'week_number'
  ) then
    alter table public.scheme_topics rename column week_number to week_start;
  end if;
end $$;

-- Add week_end for multi-week topic spans
alter table public.scheme_topics add column if not exists week_end int;
update public.scheme_topics set week_end = week_start where week_end is null;
alter table public.scheme_topics alter column week_end set not null;

-- browsable_qualifications: [{qualification_id, exam_board}] for topic picker
alter table public.schemes add column if not exists browsable_qualifications jsonb not null default '[]';

-- Back-fill primary qualification into browsable_qualifications where empty
update public.schemes
set browsable_qualifications = jsonb_build_array(
  jsonb_build_object('qualification_id', qualification_id, 'exam_board', exam_board)
)
where browsable_qualifications = '[]'::jsonb
  and qualification_id is not null;
