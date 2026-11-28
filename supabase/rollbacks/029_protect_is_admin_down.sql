-- Rollback for 029_protect_is_admin.sql. Warning: this lets signed-in users set is_admin on
-- their own profile again.

begin;

drop trigger if exists profiles_protect_is_admin on public.profiles;
drop function if exists public.protect_is_admin();

commit;
