// OAuth 2.1 sign-in for the Claude connector, following the MCP authorization spec, so a
// client such as claude.ai can connect by sending the teacher to the site to log in and click
// Allow. Pieces:
//
//   /.well-known/oauth-protected-resource   which sign-in service protects /api/mcp (RFC 9728)
//   /.well-known/oauth-authorization-server what that service supports (RFC 8414)
//   /api/oauth/register                     automatic client registration (RFC 7591)
//   /oauth/authorize                        the consent page (React, src/pages/OAuthAuthorizePage)
//   /api/oauth/authorize-info, /approve     what the consent page calls
//   /api/oauth/token                        code (+PKCE) and refresh-token exchange
//   /api/oauth/revoke                       token revocation (RFC 7009)
//
// Clients identify themselves either by registering (Dynamic Client Registration) or with a
// URL to a published client metadata document (claude.ai's "Claude's published identity").
// While the connector is trialled, sign-in is admin-only and redirects are only allowed back
// to Claude (claude.ai / claude.com) or to a local app on this computer (Claude Code etc.).
//
// Access tokens are rows in mcp_tokens (kind 'oauth'), so /api/mcp checks them exactly like
// personal tokens, and teachers see and disconnect them on their Profile page.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { hashToken, type Row, type Store } from './store.js'

export const ACCESS_TOKEN_TTL_S = 60 * 60              // 1 hour
export const REFRESH_TOKEN_TTL_S = 60 * 60 * 24 * 90   // 90 days, rotated on every use
const CODE_TTL_S = 10 * 60
const CLIENT_METADATA_MAX_AGE_MS = 24 * 60 * 60 * 1000
export const SCOPE = 'worksheets'

// Where sign-in may send people back to. Keep this tight: a redirect URI is where the
// authorization code goes.
const CLAUDE_HOSTS = ['claude.ai', 'claude.com']
const METADATA_DOC_HOSTS = ['claude.ai', 'claude.com', 'anthropic.com']
const hostMatches = (host: string, allowed: string[]) => allowed.some(a => host === a || host.endsWith(`.${a}`))

export function isAllowedRedirect(uri: string): boolean {
  let u: URL
  try { u = new URL(uri) } catch { return false }
  if (u.hash) return false
  if (u.protocol === 'https:' && hostMatches(u.hostname, CLAUDE_HOSTS)) return true
  // Native/CLI apps on the teacher's own computer (RFC 8252 loopback redirects)
  return u.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname)
}

export interface OAuthContext {
  store: Store
  origin: string
  /** Fetches a client metadata document (injected so tests don't touch the network). */
  fetchJson: (url: string) => Promise<unknown>
}

type Params = Record<string, string | undefined>

const newSecret = (prefix: string) => `${prefix}_${randomBytes(32).toString('base64url')}`
const b64urlSha256 = (s: string) => createHash('sha256').update(s).digest('base64url')
const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

function body(req: VercelRequest): Params {
  const b = req.body
  if (!b) return {}
  if (typeof b === 'string') return Object.fromEntries(new URLSearchParams(b))
  if (Buffer.isBuffer(b)) return Object.fromEntries(new URLSearchParams(b.toString('utf8')))
  return Object.fromEntries(Object.entries(b as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'string' ? v : v == null ? undefined : JSON.stringify(v)]))
}
function query(req: VercelRequest): Params {
  return Object.fromEntries(Object.entries(req.query ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
}

function send(res: VercelResponse, status: number, data: unknown, cache = 'no-store') {
  res.setHeader('Cache-Control', cache)
  res.setHeader('Content-Type', 'application/json')
  res.status(status).send(JSON.stringify(data))
}
const oauthError = (res: VercelResponse, status: number, error: string, description: string) =>
  send(res, status, { error, error_description: description })

// ── Metadata ────────────────────────────────────────────────────────────────

export function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ['header'],
    resource_name: 'The Worksheet Project',
  }
}

export function authorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    revocation_endpoint: `${origin}/api/oauth/revoke`,
    scopes_supported: [SCOPE],
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    revocation_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    client_id_metadata_document_supported: true,
    service_documentation: `${origin}/profile`,
  }
}

// ── Clients ─────────────────────────────────────────────────────────────────

const isMetadataDocUrl = (clientId: string) => {
  try {
    const u = new URL(clientId)
    return u.protocol === 'https:' && u.pathname !== '/' && hostMatches(u.hostname, METADATA_DOC_HOSTS)
  } catch { return false }
}

// A client from Dynamic Client Registration, or one described by its published metadata
// document (fetched, checked and cached for a day).
async function loadClient(ctx: OAuthContext, clientId: string): Promise<Row | null> {
  const cached = await ctx.store.oauthClient(clientId)
  if (cached?.source === 'dcr') return cached
  if (!clientId.startsWith('https://')) return null
  if (!isMetadataDocUrl(clientId)) return null
  if (cached && Date.now() - new Date(cached.updated_at).getTime() < CLIENT_METADATA_MAX_AGE_MS) return cached

  let doc: Row
  try { doc = (await ctx.fetchJson(clientId)) as Row } catch { return cached ?? null }
  if (!doc || typeof doc !== 'object' || doc.client_id !== clientId || !Array.isArray(doc.redirect_uris)) return cached ?? null
  const redirectUris = (doc.redirect_uris as unknown[]).filter((u): u is string => typeof u === 'string')
  if (!redirectUris.length) return null
  const row = {
    client_id: clientId,
    client_name: typeof doc.client_name === 'string' ? doc.client_name.slice(0, 100) : '',
    redirect_uris: redirectUris,
    token_endpoint_auth_method: 'none',
    client_secret_hash: null,
    source: 'cimd',
    metadata: doc,
    updated_at: new Date().toISOString(),
  }
  await ctx.store.upsertOAuthClient(row)
  return row
}

async function register(ctx: OAuthContext, req: VercelRequest, res: VercelResponse) {
  const b = (typeof req.body === 'object' && req.body && !Buffer.isBuffer(req.body) ? req.body : {}) as Row
  const redirectUris = Array.isArray(b.redirect_uris) ? b.redirect_uris.filter((u: unknown): u is string => typeof u === 'string') : []
  if (!redirectUris.length) return oauthError(res, 400, 'invalid_redirect_uri', 'redirect_uris is required.')
  const bad = redirectUris.find((u: string) => !isAllowedRedirect(u))
  if (bad) return oauthError(res, 400, 'invalid_redirect_uri', `Redirect URI not allowed: ${bad}. Only Claude (claude.ai, claude.com) and local apps (http://localhost) can sign in to The Worksheet Project at the moment.`)
  const grantTypes: string[] = Array.isArray(b.grant_types) ? b.grant_types : ['authorization_code', 'refresh_token']
  if (grantTypes.some(g => !['authorization_code', 'refresh_token'].includes(g))) return oauthError(res, 400, 'invalid_client_metadata', 'Only authorization_code and refresh_token grants are supported.')
  const method = typeof b.token_endpoint_auth_method === 'string' ? b.token_endpoint_auth_method : 'none'
  if (!['none', 'client_secret_post', 'client_secret_basic'].includes(method)) return oauthError(res, 400, 'invalid_client_metadata', `Unsupported token_endpoint_auth_method "${method}".`)

  const clientId = newSecret('wsp_client')
  const secret = method === 'none' ? undefined : newSecret('wsp_secret')
  const clientName = typeof b.client_name === 'string' ? b.client_name.slice(0, 100) : ''
  await ctx.store.upsertOAuthClient({
    client_id: clientId, client_name: clientName, redirect_uris: redirectUris,
    token_endpoint_auth_method: method, client_secret_hash: secret ? hashToken(secret) : null,
    source: 'dcr', metadata: { ...b, client_secret: undefined },
  })
  send(res, 201, {
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    ...(secret ? { client_secret: secret, client_secret_expires_at: 0 } : {}),
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: grantTypes,
    response_types: ['code'],
    token_endpoint_auth_method: method,
    scope: SCOPE,
  })
}

// Client authentication at the token and revocation endpoints.
async function authenticateClient(ctx: OAuthContext, req: VercelRequest, p: Params): Promise<{ client: Row } | { error: string; description: string }> {
  let clientId = p.client_id
  let secret = p.client_secret
  const basic = /^Basic\s+(.+)$/i.exec(String(req.headers.authorization ?? ''))?.[1]
  if (basic) {
    const [id, sec] = Buffer.from(basic, 'base64').toString('utf8').split(':')
    clientId = decodeURIComponent(id ?? '')
    secret = decodeURIComponent(sec ?? '')
  }
  if (!clientId) return { error: 'invalid_client', description: 'client_id is required.' }
  const client = await loadClient(ctx, clientId)
  if (!client) return { error: 'invalid_client', description: 'Unknown client.' }
  if (client.token_endpoint_auth_method !== 'none') {
    if (!secret || !client.client_secret_hash || !safeEqual(hashToken(secret), client.client_secret_hash)) {
      return { error: 'invalid_client', description: 'Client authentication failed.' }
    }
  }
  return { client }
}

// ── Authorization request (shared by the consent page's two calls) ──────────

interface CheckedRequest {
  client: Row
  clientId: string
  redirectUri: string
  codeChallenge: string
  state?: string
  scope: string
  resource?: string
}
type AuthorizeCheck =
  | { ok: true; req: CheckedRequest }
  // redirectable: the redirect URI is trusted, so the error can be sent back to the client
  | { ok: false; error: string; description: string; redirectUri?: string; state?: string }

export async function checkAuthorizeRequest(ctx: OAuthContext, p: Params): Promise<AuthorizeCheck> {
  if (!p.client_id) return { ok: false, error: 'invalid_request', description: 'client_id is missing.' }
  const client = await loadClient(ctx, p.client_id)
  if (!client) return { ok: false, error: 'invalid_client', description: 'This app is not registered with The Worksheet Project.' }
  const registered: string[] = client.redirect_uris ?? []
  const redirectUri = p.redirect_uri ?? (registered.length === 1 ? registered[0] : undefined)
  if (!redirectUri || !registered.includes(redirectUri)) return { ok: false, error: 'invalid_request', description: 'The redirect address does not match this app’s registration.' }
  if (!isAllowedRedirect(redirectUri)) return { ok: false, error: 'invalid_request', description: 'This app is not allowed to sign in to The Worksheet Project at the moment.' }

  const fail = (error: string, description: string): AuthorizeCheck => ({ ok: false, error, description, redirectUri, state: p.state })
  if (p.response_type !== 'code') return fail('unsupported_response_type', 'Only response_type=code is supported.')
  if (!p.code_challenge || p.code_challenge_method !== 'S256') return fail('invalid_request', 'PKCE with code_challenge_method=S256 is required.')
  if (!/^[A-Za-z0-9_-]{43,128}$/.test(p.code_challenge)) return fail('invalid_request', 'code_challenge is malformed.')
  const scopes = (p.scope ?? '').split(/\s+/).filter(Boolean)
  if (scopes.some(s => s !== SCOPE)) return fail('invalid_scope', `The only scope is "${SCOPE}".`)
  if (p.resource) {
    try { if (new URL(p.resource).pathname.replace(/\/+$/, '') !== '/api/mcp') return fail('invalid_target', 'Unknown resource.') }
    catch { return fail('invalid_target', 'Unknown resource.') }
  }
  return { ok: true, req: { client, clientId: p.client_id, redirectUri, codeChallenge: p.code_challenge, state: p.state, scope: SCOPE, resource: p.resource } }
}

export function redirectWith(redirectUri: string, params: Record<string, string | undefined>): string {
  const u = new URL(redirectUri)
  for (const [k, v] of Object.entries(params)) if (v !== undefined) u.searchParams.set(k, v)
  return u.toString()
}

const clientLabel = (c: Row) => {
  if (c.client_name) return String(c.client_name)
  try { return new URL(c.client_id).hostname } catch { return 'An app' }
}

async function authorizeInfo(ctx: OAuthContext, p: Params, res: VercelResponse) {
  const check = await checkAuthorizeRequest(ctx, p)
  if (!check.ok) return send(res, 400, { error: check.error, error_description: check.description })
  const { client, redirectUri } = check.req
  send(res, 200, { client_name: clientLabel(client), redirect_host: new URL(redirectUri).host })
}

async function approve(ctx: OAuthContext, req: VercelRequest, res: VercelResponse) {
  const b = (typeof req.body === 'object' && req.body && !Buffer.isBuffer(req.body) ? req.body : {}) as Row
  const p = (b.params && typeof b.params === 'object' ? b.params : {}) as Params
  const check = await checkAuthorizeRequest(ctx, p)
  if (!check.ok) {
    // Only bounce the error back to the app when its redirect address is trusted
    if (check.redirectUri) return send(res, 200, { redirect: redirectWith(check.redirectUri, { error: check.error, error_description: check.description, state: check.state, iss: ctx.origin }) })
    return send(res, 400, { error: check.error, error_description: check.description })
  }
  const r = check.req
  if (b.allow !== true) {
    return send(res, 200, { redirect: redirectWith(r.redirectUri, { error: 'access_denied', error_description: 'The teacher declined.', state: r.state, iss: ctx.origin }) })
  }

  const jwt = /^Bearer\s+(\S+)$/i.exec(String(req.headers.authorization ?? ''))?.[1]
  const profileId = jwt ? await ctx.store.profileForUserJwt(jwt) : null
  if (!profileId) return send(res, 401, { error: 'login_required', error_description: 'Please log in to The Worksheet Project first.' })
  if (!(await ctx.store.isAdmin(profileId))) return send(res, 403, { error: 'not_admin', error_description: 'The Claude connector is only available to admin accounts at the moment.' })

  const code = newSecret('wspc')
  await ctx.store.insertOAuthCode({
    code_hash: hashToken(code), client_id: r.clientId, profile_id: profileId, redirect_uri: r.redirectUri,
    code_challenge: r.codeChallenge, scope: r.scope, resource: r.resource ?? null,
    expires_at: new Date(Date.now() + CODE_TTL_S * 1000).toISOString(),
  })
  send(res, 200, { redirect: redirectWith(r.redirectUri, { code, state: r.state, iss: ctx.origin }) })
}

// ── Tokens ──────────────────────────────────────────────────────────────────

function issueTokens() {
  const access = newSecret('wsp')
  const refresh = newSecret('wspr')
  const now = Date.now()
  return {
    access, refresh,
    accessExpires: new Date(now + ACCESS_TOKEN_TTL_S * 1000).toISOString(),
    refreshExpires: new Date(now + REFRESH_TOKEN_TTL_S * 1000).toISOString(),
  }
}
const tokenResponse = (t: ReturnType<typeof issueTokens>) => ({
  access_token: t.access, token_type: 'Bearer', expires_in: ACCESS_TOKEN_TTL_S, refresh_token: t.refresh, scope: SCOPE,
})

async function token(ctx: OAuthContext, req: VercelRequest, res: VercelResponse) {
  const p = body(req)
  const auth = await authenticateClient(ctx, req, p)
  if ('error' in auth) return oauthError(res, 401, auth.error, auth.description)
  const { client } = auth

  if (p.grant_type === 'authorization_code') {
    if (!p.code || !p.code_verifier) return oauthError(res, 400, 'invalid_request', 'code and code_verifier are required.')
    const row = await ctx.store.consumeOAuthCode(hashToken(p.code))
    const invalid = () => oauthError(res, 400, 'invalid_grant', 'The authorization code is invalid, expired or already used.')
    if (!row) return invalid()
    if (row.client_id !== client.client_id) return invalid()
    if (new Date(row.expires_at).getTime() <= Date.now()) return invalid()
    if (p.redirect_uri && p.redirect_uri !== row.redirect_uri) return invalid()
    if (!/^[A-Za-z0-9._~-]{43,128}$/.test(p.code_verifier) || !safeEqual(b64urlSha256(p.code_verifier), row.code_challenge)) return invalid()
    if (!(await ctx.store.isAdmin(row.profile_id))) return oauthError(res, 400, 'invalid_grant', 'The Claude connector is only available to admin accounts at the moment.')

    const t = issueTokens()
    await ctx.store.insertConnection({
      profile_id: row.profile_id, kind: 'oauth', client_id: client.client_id, name: clientLabel(client),
      token_hash: hashToken(t.access), token_hint: '', expires_at: t.accessExpires,
      refresh_token_hash: hashToken(t.refresh), refresh_expires_at: t.refreshExpires,
    })
    return send(res, 200, tokenResponse(t))
  }

  if (p.grant_type === 'refresh_token') {
    if (!p.refresh_token) return oauthError(res, 400, 'invalid_request', 'refresh_token is required.')
    const conn = await ctx.store.connectionByRefresh(hashToken(p.refresh_token))
    const invalid = () => oauthError(res, 400, 'invalid_grant', 'The refresh token is invalid, expired or revoked. Please connect again.')
    if (!conn || conn.client_id !== client.client_id) return invalid()
    if (!conn.refresh_expires_at || new Date(conn.refresh_expires_at).getTime() <= Date.now()) return invalid()
    if (!(await ctx.store.isAdmin(conn.profile_id))) return oauthError(res, 400, 'invalid_grant', 'The Claude connector is only available to admin accounts at the moment.')
    const t = issueTokens()
    // Rotate both tokens: the old refresh token stops working immediately
    await ctx.store.updateConnection(conn.id, {
      token_hash: hashToken(t.access), expires_at: t.accessExpires,
      refresh_token_hash: hashToken(t.refresh), refresh_expires_at: t.refreshExpires,
    })
    return send(res, 200, tokenResponse(t))
  }

  return oauthError(res, 400, 'unsupported_grant_type', 'Use authorization_code or refresh_token.')
}

async function revoke(ctx: OAuthContext, req: VercelRequest, res: VercelResponse) {
  const p = body(req)
  const auth = await authenticateClient(ctx, req, p)
  if ('error' in auth) return oauthError(res, 401, auth.error, auth.description)
  if (p.token) await ctx.store.revokeByTokenHash(hashToken(p.token))
  send(res, 200, {})   // RFC 7009: success even for unknown tokens
}

// ── Router ──────────────────────────────────────────────────────────────────

export async function handleOAuth(req: VercelRequest, res: VercelResponse, ctx: OAuthContext) {
  // Metadata, registration and token calls can come from browser-based MCP clients
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, MCP-Protocol-Version')
  if (req.method === 'OPTIONS') return res.status(204).end()

  const route = query(req).route ?? ''
  const method = req.method ?? 'GET'
  switch (route) {
    case 'protected-resource':
      return send(res, 200, protectedResourceMetadata(ctx.origin), 'public, max-age=300')
    case 'authorization-server':
      return send(res, 200, authorizationServerMetadata(ctx.origin), 'public, max-age=300')
    case 'register':
      if (method !== 'POST') break
      return register(ctx, req, res)
    case 'authorize-info':
      if (method !== 'GET') break
      return authorizeInfo(ctx, query(req), res)
    case 'approve':
      if (method !== 'POST') break
      return approve(ctx, req, res)
    case 'token':
      if (method !== 'POST') break
      return token(ctx, req, res)
    case 'revoke':
      if (method !== 'POST') break
      return revoke(ctx, req, res)
    default:
      return send(res, 404, { error: 'not_found' })
  }
  send(res, 405, { error: 'method_not_allowed' })
}

// Fetch a client metadata document with a timeout and a size cap.
export async function fetchClientMetadata(url: string): Promise<unknown> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 5000)
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' }, redirect: 'error' })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const text = await r.text()
    if (text.length > 64 * 1024) throw new Error('too large')
    return JSON.parse(text)
  } finally {
    clearTimeout(timer)
  }
}
