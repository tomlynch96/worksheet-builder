-- Rollback for 030_mcp_oauth.sql. Every OAuth connection (claude.ai sign-ins) stops working;
-- personal tokens keep working.

begin;

delete from public.mcp_tokens where kind = 'oauth';

alter table public.mcp_tokens
  drop column if exists refresh_expires_at,
  drop column if exists refresh_token_hash,
  drop column if exists expires_at,
  drop column if exists client_id,
  drop column if exists kind;

drop table if exists public.oauth_codes;
drop table if exists public.oauth_clients;

commit;
