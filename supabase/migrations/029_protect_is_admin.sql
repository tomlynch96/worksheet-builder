-- Stop teachers making themselves admins.
--
-- Signed-in users have UPDATE on public.profiles and the "profiles: owner access" policy lets
-- them edit their own row, so before this migration anyone could run
--   supabase.from('profiles').update({ is_admin: true }).eq('id', <their id>)
-- from the browser and gain admin access (all worksheets, the admin pages, the Claude connector).
-- The app itself never writes is_admin.
--
-- After this, only the database owner (the Supabase SQL editor) or the service role can set it.
-- Requests from the app (roles anon/authenticated) can't change it, and new profiles always start
-- as non-admin.
--
-- Reversible: supabase/rollbacks/029_protect_is_admin_down.sql

begin;

create or replace function public.protect_is_admin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.is_admin := false;
    elsif new.is_admin is distinct from old.is_admin then
      raise exception 'is_admin can only be changed by a database administrator'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_is_admin on public.profiles;
create trigger profiles_protect_is_admin
  before insert or update on public.profiles
  for each row execute function public.protect_is_admin();

commit;
