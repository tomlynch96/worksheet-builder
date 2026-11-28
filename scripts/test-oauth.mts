// End-to-end test of OAuth sign-in for the Claude connector: the MCP SDK's own OAuth client
// (what MCP clients use) against the real handlers, with the consent page's calls made by hand
// in place of a browser. Run: npm run test:oauth
import { createHash } from 'node:crypto'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { UnauthorizedError, type OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js'
import { createMemoryStore, startServer, checker, ME, ADMIN_JWT, TEACHER_JWT } from './test-support.mts'

const CLAUDE_METADATA_URL = 'https://claude.ai/oauth/mcp-oauth-client-metadata'
const CLAUDE_CALLBACK = 'https://claude.ai/api/mcp/auth_callback'

const { db, store } = createMemoryStore()
const fetched: string[] = []
const server = await startServer(store, {
  fetchJson: async u => {
    fetched.push(u)
    if (u === CLAUDE_METADATA_URL) return { client_id: CLAUDE_METADATA_URL, client_name: 'Claude', redirect_uris: [CLAUDE_CALLBACK] }
    throw new Error('not found')
  },
})
const { origin, url } = server
const { ok, done } = checker()

/* eslint-disable @typescript-eslint/no-explicit-any */
class TestProvider implements OAuthClientProvider {
  client: any; saved: any; verifier = ''; authUrl?: URL
  constructor(private redirect: string, public clientMetadataUrl?: string) {}
  get redirectUrl() { return this.redirect }
  get clientMetadata() {
    return { client_name: 'Test Claude', redirect_uris: [this.redirect], grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none' }
  }
  clientInformation() { return this.client }
  saveClientInformation(c: any) { this.client = c }
  tokens() { return this.saved }
  saveTokens(t: any) { this.saved = t }
  redirectToAuthorization(u: URL) { this.authUrl = u }
  saveCodeVerifier(v: string) { this.verifier = v }
  codeVerifier() { return this.verifier }
}

const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${origin}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
const form = (path: string, fields: Record<string, string>) =>
  fetch(`${origin}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fields).toString() })
const mcpList = (accessToken: string) => fetch(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
})

// The consent page: what the browser does after the client redirects the teacher
async function consent(authUrl: URL, jwt: string | null, allow = true) {
  const params = Object.fromEntries(authUrl.searchParams)
  const r = await post('/api/oauth/approve', { params, allow }, jwt ? { Authorization: `Bearer ${jwt}` } : {})
  return { status: r.status, data: await r.json() as any }
}

// Connect with a provider: first attempt needs sign-in, then consent, then finishAuth.
async function signIn(p: TestProvider) {
  const t1 = new StreamableHTTPClientTransport(url, { authProvider: p })
  let needed = false
  try { await new Client({ name: 'oauth-test', version: '1' }).connect(t1) } catch (e) { needed = e instanceof UnauthorizedError }
  const { data } = await consent(p.authUrl!, ADMIN_JWT)
  const back = new URL(data.redirect)
  await t1.finishAuth(back.searchParams.get('code')!)
  const c = new Client({ name: 'oauth-test', version: '1' })
  await c.connect(new StreamableHTTPClientTransport(url, { authProvider: p }))
  return { needed, back, client: c }
}

console.log('\nDiscovery')
const unauth = await mcpList('')
const www = unauth.headers.get('www-authenticate') ?? ''
ok(unauth.status === 401 && www.includes(`resource_metadata="${origin}/.well-known/oauth-protected-resource"`), '401 from /api/mcp points at the protected-resource metadata', www)
const prm = await (await fetch(`${origin}/.well-known/oauth-protected-resource/api/mcp`)).json() as any
ok(prm.resource === `${origin}/api/mcp` && prm.authorization_servers[0] === origin, 'protected-resource metadata names the resource and the sign-in service')
const asm = await (await fetch(`${origin}/.well-known/oauth-authorization-server`)).json() as any
ok(asm.issuer === origin && asm.code_challenge_methods_supported.includes('S256') && asm.client_id_metadata_document_supported === true && asm.registration_endpoint, 'authorization-server metadata: PKCE S256, registration, client metadata documents')

console.log('\nSign in with automatic registration (Claude Code style, loopback redirect)')
const dcr = new TestProvider('http://localhost:4321/callback')
const a = await signIn(dcr)
ok(a.needed, 'first connect asks for sign-in')
ok(dcr.authUrl!.origin === origin && dcr.authUrl!.pathname === '/oauth/authorize', 'teacher is sent to the site’s consent page')
ok(dcr.client?.client_id?.startsWith('wsp_client_'), 'client registered itself')
ok(a.back.origin + a.back.pathname === 'http://localhost:4321/callback' && a.back.searchParams.get('iss') === origin, 'Allow returns a code to the app, with iss')
ok((await a.client.listTools()).tools.length === 12, 'signed-in client can use the 12 tools')
const conn = db.tokens.find(t => t.kind === 'oauth')!
ok(conn && conn.profile_id === ME && conn.name === 'Test Claude' && conn.expires_at && conn.refresh_token_hash && !JSON.stringify(conn).includes(dcr.saved.access_token), 'connection saved for the teacher, tokens stored only as hashes')

console.log('\nCodes and PKCE')
const info = await fetch(`${origin}/api/oauth/authorize-info${dcr.authUrl!.search}`)
ok(info.status === 200 && (await info.json() as any).client_name === 'Test Claude', 'consent page gets the app’s name')
const { data: d2 } = await consent(dcr.authUrl!, ADMIN_JWT)
const code2 = new URL(d2.redirect).searchParams.get('code')!
const wrongVerifier = await form('/api/oauth/token', { grant_type: 'authorization_code', code: code2, code_verifier: 'x'.repeat(43), client_id: dcr.client.client_id, redirect_uri: 'http://localhost:4321/callback' })
ok(wrongVerifier.status === 400 && (await wrongVerifier.json() as any).error === 'invalid_grant', 'wrong PKCE verifier refused')
const reused = await form('/api/oauth/token', { grant_type: 'authorization_code', code: code2, code_verifier: dcr.verifier, client_id: dcr.client.client_id })
ok(reused.status === 400, 'a code can only be used once (even after a failed attempt)')

console.log('\nRefresh, expiry and revocation')
const oldRefresh = dcr.saved.refresh_token
conn.expires_at = new Date(Date.now() - 1000).toISOString()
const expired = await mcpList(dcr.saved.access_token)
ok(expired.status === 401 && (expired.headers.get('www-authenticate') ?? '').includes('invalid_token'), 'expired access token → 401 invalid_token')
const c2 = new Client({ name: 'oauth-test', version: '1' })
await c2.connect(new StreamableHTTPClientTransport(url, { authProvider: dcr }))
ok((await c2.listTools()).tools.length === 12 && dcr.saved.refresh_token !== oldRefresh, 'client refreshes automatically, refresh token rotated')
const replay = await form('/api/oauth/token', { grant_type: 'refresh_token', refresh_token: oldRefresh, client_id: dcr.client.client_id })
ok(replay.status === 400, 'old refresh token no longer works')
const revoked = await form('/api/oauth/revoke', { token: dcr.saved.access_token, client_id: dcr.client.client_id })
ok(revoked.status === 200 && (await mcpList(dcr.saved.access_token)).status === 401, 'revoking ends access')
const afterRevoke = await form('/api/oauth/token', { grant_type: 'refresh_token', refresh_token: dcr.saved.refresh_token, client_id: dcr.client.client_id })
ok(afterRevoke.status === 400, 'and its refresh token is dead too')

console.log('\nConsent page rules')
const p3 = new TestProvider('http://localhost:4321/callback')
try { await new Client({ name: 'x', version: '1' }).connect(new StreamableHTTPClientTransport(url, { authProvider: p3 })) } catch { /* sign-in needed */ }
const noLogin = await consent(p3.authUrl!, null)
ok(noLogin.status === 401 && noLogin.data.error === 'login_required', 'Allow without a site login is refused')
const teacher = await consent(p3.authUrl!, TEACHER_JWT)
ok(teacher.status === 403 && teacher.data.error === 'not_admin', 'non-admin accounts can’t connect (admin-only trial)')
const deny = await consent(p3.authUrl!, ADMIN_JWT, false)
const denied = new URL(deny.data.redirect)
ok(denied.searchParams.get('error') === 'access_denied' && denied.searchParams.get('state') === p3.authUrl!.searchParams.get('state'), 'Cancel sends access_denied back with the state')
const tampered = new URL(p3.authUrl!); tampered.searchParams.set('redirect_uri', 'http://localhost:9999/steal')
const bad = await fetch(`${origin}/api/oauth/authorize-info${tampered.search}`)
ok(bad.status === 400, 'a redirect address that wasn’t registered is refused (and not redirected to)')
const evilReg = await post('/api/oauth/register', { client_name: 'Evil', redirect_uris: ['https://evil.example/cb'] })
ok(evilReg.status === 400 && (await evilReg.json() as any).error === 'invalid_redirect_uri', 'registration only allows Claude or local redirect addresses')

console.log('\nSign in with Claude’s published identity (claude.ai style)')
const claude = new TestProvider(CLAUDE_CALLBACK, CLAUDE_METADATA_URL)
const b = await signIn(claude)
ok(claude.authUrl!.searchParams.get('client_id') === CLAUDE_METADATA_URL, 'client_id is the metadata document URL')
ok(fetched.includes(CLAUDE_METADATA_URL), 'server fetched and checked the metadata document')
ok(b.back.origin + b.back.pathname === CLAUDE_CALLBACK, 'Allow returns to claude.ai’s callback')
ok((await b.client.listTools()).tools.length === 12, 'claude.ai-style client can use the tools')
ok(db.tokens.some(t => t.kind === 'oauth' && t.name === 'Claude' && !t.revoked_at), 'connection listed as “Claude”')
const evilDoc = new URL(claude.authUrl!); evilDoc.searchParams.set('client_id', 'https://evil.example/meta.json')
ok((await fetch(`${origin}/api/oauth/authorize-info${evilDoc.search}`)).status === 400, 'metadata documents only accepted from Anthropic domains')

console.log('\nPersonal tokens still work')
ok((await mcpList('wsp_test_token_abc')).status === 200, 'Authorization: Bearer personal token')

await a.client.close(); await b.client.close(); await c2.close()
server.close()
done()
