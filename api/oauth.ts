// OAuth sign-in for the Claude connector: one function for every endpoint (see api/_lib/oauth.ts).
// vercel.json rewrites /.well-known/oauth-* and /api/oauth/<route> here as ?route=<route>.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchClientMetadata, handleOAuth } from './_lib/oauth.js'
import { siteOrigin } from './_lib/http.js'
import { supabaseStore, type Store } from './_lib/store.js'

let cachedStore: Store | null = null

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    cachedStore ??= supabaseStore()
    await handleOAuth(req, res, { store: cachedStore, origin: siteOrigin(req), fetchJson: fetchClientMetadata })
  } catch (err) {
    console.error('[oauth]', err)
    if (!res.headersSent) res.status(500).json({ error: 'server_error', error_description: err instanceof Error ? err.message : 'Server error' })
  }
}
