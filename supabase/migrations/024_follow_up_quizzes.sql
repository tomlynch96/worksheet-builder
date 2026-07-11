-- Follow ups: MC quizzes generated directly from an uploaded document (PDF/Word/image)
-- rather than from a worksheet built in the editor. Reuses the mc_quizzes table and every
-- downstream mechanic (print, bubble sheets, QR scan-to-mark, results) unchanged.

alter table mc_quizzes alter column worksheet_id drop not null;

alter table mc_quizzes add column source_type text not null default 'worksheet' check (source_type in ('worksheet', 'document'));
alter table mc_quizzes add column source_file_path text;
alter table mc_quizzes add column source_file_name text;
alter table mc_quizzes add column source_file_type text;

insert into storage.buckets (id, name, public)
values ('follow-up-sources', 'follow-up-sources', false)
on conflict (id) do nothing;

create policy "owner: manage own follow-up source files"
  on storage.objects for all
  using (bucket_id = 'follow-up-sources' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'follow-up-sources' and (storage.foldername(name))[1] = auth.uid()::text);
