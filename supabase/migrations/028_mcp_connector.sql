-- Claude connector (MCP server at /api/mcp).
--
-- Adds:
--   * mcp_tokens   personal access tokens a teacher creates on their profile page so Claude
--                  can act for them. Only a SHA-256 hash is stored; the token is shown once.
--                  The server looks tokens up with the service-role key, so teachers only
--                  need to read, create and revoke their own.
--   * worksheets.source           'app' (made on the site) or 'mcp' (saved from Claude)
--   * worksheets.needs_review     true for sheets saved from Claude until the teacher approves
--                                 or edits them on the site
--   * worksheets.first_opened_at  when the teacher first opened the sheet on the site
--   * worksheets.reviewed_at      when the review flag was cleared
--
-- Reversible: supabase/rollbacks/028_mcp_connector_down.sql

begin;

create table if not exists public.mcp_tokens (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  name          text not null default 'Claude',
  token_hash    text not null unique,
  token_hint    text not null default '',   -- last 4 characters, so teachers can tell tokens apart
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  revoked_at    timestamptz
);

create index if not exists mcp_tokens_profile on public.mcp_tokens (profile_id);

alter table public.mcp_tokens enable row level security;

drop policy if exists "owner: read own mcp tokens" on public.mcp_tokens;
create policy "owner: read own mcp tokens"
  on public.mcp_tokens for select
  using (profile_id = auth.uid());

drop policy if exists "owner: create own mcp tokens" on public.mcp_tokens;
create policy "owner: create own mcp tokens"
  on public.mcp_tokens for insert
  with check (profile_id = auth.uid());

drop policy if exists "owner: revoke own mcp tokens" on public.mcp_tokens;
create policy "owner: revoke own mcp tokens"
  on public.mcp_tokens for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

alter table public.worksheets
  add column if not exists source          text not null default 'app' check (source in ('app', 'mcp')),
  add column if not exists needs_review    boolean not null default false,
  add column if not exists first_opened_at timestamptz,
  add column if not exists reviewed_at     timestamptz;

create index if not exists worksheets_needs_review
  on public.worksheets (profile_id)
  where needs_review;

commit;
