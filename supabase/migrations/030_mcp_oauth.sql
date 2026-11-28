-- OAuth sign-in for the Claude connector, so claude.ai (and any MCP client) can connect by
-- sending the teacher to the site to log in and click Allow, instead of copying a token.
--
-- Adds:
--   * oauth_clients   apps that may ask for sign-in: registered automatically (Dynamic Client
--                     Registration) or described by a published client metadata document
--   * oauth_codes     one-time authorization codes (10 minutes, PKCE), stored hashed
--   * mcp_tokens      now also holds OAuth connections: kind = 'oauth', with an access-token
--                     expiry and a rotating refresh token (both stored hashed)
--
-- oauth_clients and oauth_codes are only used by the server (service role): RLS is on with no
-- policies, so the app's API can't read or write them.
--
-- Reversible: supabase/rollbacks/030_mcp_oauth_down.sql

begin;

create table if not exists public.oauth_clients (
  client_id                  text primary key,
  client_name                text not null default '',
  redirect_uris              text[] not null,
  token_endpoint_auth_method text not null default 'none'
    check (token_endpoint_auth_method in ('none', 'client_secret_post', 'client_secret_basic')),
  client_secret_hash         text,
  source                     text not null check (source in ('dcr', 'cimd')),
  metadata                   jsonb not null default '{}',
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
alter table public.oauth_clients enable row level security;

create table if not exists public.oauth_codes (
  code_hash      text primary key,
  client_id      text not null,
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  redirect_uri   text not null,
  code_challenge text not null,
  scope          text not null default '',
  resource       text,
  expires_at     timestamptz not null,
  used_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists oauth_codes_expires on public.oauth_codes (expires_at);
alter table public.oauth_codes enable row level security;

alter table public.mcp_tokens
  add column if not exists kind               text not null default 'personal' check (kind in ('personal', 'oauth')),
  add column if not exists client_id          text,
  add column if not exists expires_at         timestamptz,
  add column if not exists refresh_token_hash text unique,
  add column if not exists refresh_expires_at timestamptz;

commit;
