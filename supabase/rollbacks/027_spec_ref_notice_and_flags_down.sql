-- Rollback for 027_spec_ref_notice_and_flags.sql. Run this BEFORE the 026 rollback.
--
-- Removes the notice switch, the undo function, the policies and the acknowledgements table.
-- spec_ref_flags is teacher feedback, so it is only dropped when it is empty; otherwise it is kept
-- (export or resolve the flags, then drop it by hand: drop table public.spec_ref_flags;).

begin;

delete from public.app_config where key = 'spec_ref_notice';

drop function if exists public.spec_ref_set_applied(text, uuid, boolean);

drop policy if exists "owner: read own spec ref changes" on public.spec_ref_migration_log;
drop policy if exists "signed in: read spec ref map" on public.spec_ref_map;

drop table if exists public.spec_ref_acks;

do $$
begin
  if to_regclass('public.spec_ref_flags') is not null then
    if exists (select 1 from public.spec_ref_flags) then
      raise notice 'spec_ref_flags has rows and has been kept.';
    else
      drop table public.spec_ref_flags;
    end if;
  end if;
end $$;

commit;
