-- In-app notice, per-user undo and issue flagging for the A Level spec ref remap (026).
--
-- Adds:
--   * read access for each teacher to the changes made to THEIR OWN rows
--   * spec_ref_acks     "I've seen this" per teacher and batch
--   * spec_ref_flags    "report a problem" from anywhere in the app; admins can resolve them
--   * spec_ref_set_applied(tbl, row_id, apply)   undo / re-apply one row's changes (owner only)
--   * the app_config key that switches the notice on (set it to '' to switch it off again)
--
-- Reversible: supabase/rollbacks/027_spec_ref_notice_and_flags_down.sql
-- Run AFTER 026_remap_alevel_spec_refs.sql.

begin;

-- 1. Each teacher can read the log rows and the old/new map for their own changes -------------
drop policy if exists "owner: read own spec ref changes" on public.spec_ref_migration_log;
create policy "owner: read own spec ref changes"
  on public.spec_ref_migration_log for select
  using (profile_id = auth.uid());

-- The map is just "old ref -> new ref + old title": not sensitive, and needed to explain changes.
drop policy if exists "signed in: read spec ref map" on public.spec_ref_map;
create policy "signed in: read spec ref map"
  on public.spec_ref_map for select
  using (auth.uid() is not null);

-- 2. Acknowledgements ------------------------------------------------------------------------
create table if not exists public.spec_ref_acks (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  batch      text not null,
  acked_at   timestamptz not null default now(),
  primary key (profile_id, batch)
);
alter table public.spec_ref_acks enable row level security;
drop policy if exists "owner: all on spec_ref_acks" on public.spec_ref_acks;
create policy "owner: all on spec_ref_acks"
  on public.spec_ref_acks for all
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- 3. Issue flags -----------------------------------------------------------------------------
create table if not exists public.spec_ref_flags (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  batch           text,
  kind            text not null check (kind in ('wrong_tag', 'missing_point', 'wrong_point', 'other')),
  message         text not null check (char_length(message) between 1 and 2000),
  qualification_id text,
  exam_board      text,
  spec_ref        text,
  worksheet_id    uuid references public.worksheets(id) on delete set null,
  status          text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolution_note text,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  resolved_by     uuid references public.profiles(id) on delete set null
);
create index if not exists spec_ref_flags_status on public.spec_ref_flags (status, created_at desc);
alter table public.spec_ref_flags enable row level security;

drop policy if exists "owner: add and read own spec flags" on public.spec_ref_flags;
create policy "owner: add and read own spec flags"
  on public.spec_ref_flags for select using (profile_id = auth.uid());
drop policy if exists "owner: insert spec flags" on public.spec_ref_flags;
create policy "owner: insert spec flags"
  on public.spec_ref_flags for insert with check (profile_id = auth.uid() and status = 'open');
drop policy if exists "admin: read all spec flags" on public.spec_ref_flags;
create policy "admin: read all spec flags"
  on public.spec_ref_flags for select using (public.is_admin());
drop policy if exists "admin: resolve spec flags" on public.spec_ref_flags;
create policy "admin: resolve spec flags"
  on public.spec_ref_flags for update using (public.is_admin()) with check (public.is_admin());

-- 4. Undo / re-apply one row's changes ---------------------------------------------------------
-- p_apply = false  puts the old value back;  p_apply = true  puts the migrated value back again.
-- Only the owner of the row can do it. It is all-or-nothing: if ANY of the row's values has been
-- edited since (so it no longer holds what the migration wrote), nothing is changed and the call
-- fails with 'spec_ref_changed_since', so a later edit is never overwritten and a row is never left
-- half-restored. Returns how many logged changes were switched (0 if there was nothing to do).
create or replace function public.spec_ref_set_applied(p_tbl text, p_row_id uuid, p_apply boolean)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  l public.spec_ref_migration_log%rowtype;
  target jsonb;
  expected jsonb;
  n integer;
  switched integer := 0;
  failed boolean := false;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_tbl not in ('worksheets', 'scheme_topics', 'diagrams') then
    raise exception 'unsupported table %', p_tbl using errcode = '22023';
  end if;

  for l in
    select * from public.spec_ref_migration_log
    where tbl = p_tbl and row_id = p_row_id::text and profile_id = me
      and ((p_apply and reverted_at is not null) or (not p_apply and reverted_at is null))
    order by id
  loop
    target   := case when p_apply then l.new_value else l.old_value end;
    expected := case when p_apply then l.old_value else l.new_value end;
    n := 0;

    if l.tbl = 'worksheets' and l.col = 'spec_point' then
      update public.worksheets set spec_point = target #>> '{}'
       where id = p_row_id and profile_id = me and spec_point is not distinct from (expected #>> '{}');
      get diagnostics n = row_count;

    elsif l.tbl = 'worksheets' and l.col = 'blocks.header.specPoint' then
      update public.worksheets w
         set blocks = (
           select jsonb_agg(
                    case when b ->> 'type' = 'header' and b ->> 'specPoint' = (expected #>> '{}')
                         then jsonb_set(b, '{specPoint}', target)
                         else b end
                    order by ord)
           from jsonb_array_elements(w.blocks) with ordinality as t(b, ord))
       where w.id = p_row_id and w.profile_id = me and jsonb_typeof(w.blocks) = 'array'
         and exists (select 1 from jsonb_array_elements(w.blocks) b
                     where b ->> 'type' = 'header' and b ->> 'specPoint' = (expected #>> '{}'));
      get diagnostics n = row_count;

    elsif l.tbl = 'scheme_topics' and l.col = 'topic_ref' then
      update public.scheme_topics st set topic_ref = target #>> '{}'
       where st.id = p_row_id and st.topic_ref is not distinct from (expected #>> '{}')
         and exists (select 1 from public.schemes s where s.id = st.scheme_id and s.profile_id = me);
      get diagnostics n = row_count;

    elsif l.tbl = 'diagrams' and l.col = 'spec_points' then
      update public.diagrams set spec_points = array(select jsonb_array_elements_text(target))
       where id = p_row_id and profile_id = me and to_jsonb(spec_points) = expected;
      get diagnostics n = row_count;
    end if;

    if n > 0 then
      update public.spec_ref_migration_log
         set reverted_at = case when p_apply then null else now() end
       where id = l.id;
      switched := switched + 1;
    else
      failed := true;
    end if;
  end loop;

  if failed then
    raise exception 'spec_ref_changed_since' using errcode = 'P0001';  -- rolls back this call's updates
  end if;

  return switched;
end $$;

revoke all on function public.spec_ref_set_applied(text, uuid, boolean) from public, anon;
grant execute on function public.spec_ref_set_applied(text, uuid, boolean) to authenticated;

-- 5. Switch the notice on. The app shows it to each teacher once; set the value to '' to hide it for everyone.
insert into public.app_config (key, value) values ('spec_ref_notice', '026_alevel_spec_refs')
on conflict (key) do nothing;

commit;
