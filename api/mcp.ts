// MCP endpoint for Claude (Claude Code, Claude Desktop, any MCP client): /api/mcp
//
// Stateless Streamable HTTP: every POST is handled by a fresh server bound to the teacher
// whose personal token (created on the site's Profile page) is in the Authorization header.
// Needs SUPABASE_SERVICE_ROLE_KEY in the Vercel environment. Setup: docs/mcp.md
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { buildServer } from './_lib/mcp-server.js'
import { supabaseStore, type Store } from './_lib/store.js'

let cachedStore: Store | null = null

function siteOrigin(req: VercelRequest): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '')
  const proto = String(req.headers['x-forwarded-proto'] ?? 'https').split(',')[0].trim()
  const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? '').split(',')[0].trim()
  return `${proto}://${host}`
}

function rpcError(res: VercelResponse, status: number, message: string) {
  res.status(status).json({ jsonrpc: '2.0', error: { code: -32001, message }, id: null })
}

export async function handleMcp(req: VercelRequest, res: VercelResponse, store: Store) {
  if (req.method !== 'POST') {
    // Stateless server: no standalone SSE stream (GET) and no sessions to end (DELETE).
    res.setHeader('Allow', 'POST')
    return rpcError(res, 405, 'Method not allowed. The Worksheet Project MCP server accepts POST only.')
  }

  const auth = String(req.headers.authorization ?? '')
  const token = /^Bearer\s+(\S+)$/i.exec(auth)?.[1]
  const profileId = token ? await store.profileForToken(token) : null
  if (!profileId) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="The Worksheet Project"')
    return rpcError(res, 401, token
      ? 'This connector token is not valid or has been revoked. Create a new one on your Profile page in The Worksheet Project.'
      : 'Missing connector token. Create one on your Profile page in The Worksheet Project and send it as "Authorization: Bearer <token>".')
  }

  const server = buildServer({ store, profileId, origin: siteOrigin(req) })
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  res.on('close', () => { transport.close(); server.close() })
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    cachedStore ??= supabaseStore()
    await handleMcp(req, res, cachedStore)
  } catch (err) {
    console.error('[mcp]', err)
    if (!res.headersSent) rpcError(res, 500, err instanceof Error ? err.message : 'Server error')
  }
}
