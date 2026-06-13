-- Migrate user_courses: replace Edexcel/Hodder with Pearson for exploring-science qualifications.
-- Handle the unique constraint (profile_id, qualification_id, exam_board):
-- if a Pearson row already exists for the same course, delete the stale row; otherwise update it.

-- Step 1: delete stale rows where a Pearson equivalent already exists
delete from public.user_courses
where qualification_id like 'exploring-science-%'
  and exam_board in ('Edexcel', 'Hodder')
  and exists (
    select 1 from public.user_courses uc2
    where uc2.profile_id       = user_courses.profile_id
      and uc2.qualification_id = user_courses.qualification_id
      and uc2.exam_board       = 'Pearson'
  );

-- Step 2: update remaining stale rows (no Pearson duplicate exists)
update public.user_courses
set exam_board = 'Pearson'
where qualification_id like 'exploring-science-%'
  and exam_board in ('Edexcel', 'Hodder');

-- Migrate worksheets table: same Edexcel/Hodder → Pearson for exploring-science qualifications
update public.worksheets
set exam_board = 'Pearson'
where qualification_id like 'exploring-science-%'
  and exam_board in ('Edexcel', 'Hodder');
