-- Richer before→after capture on block annotations.
-- change_summary stores a structured description of what changed
-- (e.g. "marks 4→2; stem shortened") so it can be injected into
-- future generation prompts without parsing the full JSON diff.
alter table public.block_annotations
  add column if not exists change_summary text not null default '';

-- Tighten RLS on tables that were still using allow-all policies
-- (block_annotations, annotation_insights, profile_insights).
drop policy if exists "block_annotations: allow all" on public.block_annotations;
create policy "block_annotations: owner access"
  on public.block_annotations for all
  using  (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

drop policy if exists "annotation_insights: allow all" on public.annotation_insights;
create policy "annotation_insights: owner via block_annotation"
  on public.annotation_insights for all
  using (exists (
    select 1 from public.block_annotations ba
    where ba.id = block_annotation_id and auth.uid() = ba.profile_id
  ))
  with check (exists (
    select 1 from public.block_annotations ba
    where ba.id = block_annotation_id and auth.uid() = ba.profile_id
  ));

drop policy if exists "profile_insights: allow all" on public.profile_insights;
create policy "profile_insights: owner access"
  on public.profile_insights for all
  using  (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);
