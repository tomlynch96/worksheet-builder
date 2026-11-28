import { useCallback, useEffect, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import './ClaudeConnector.css'

// Personal tokens for the Claude connector (the MCP server at /api/mcp). The token is
// shown once; only its SHA-256 hash is stored, and the server looks it up by hash.

interface TokenRow {
  id: string
  name: string
  token_hint: string
  created_at: string
  last_used_at: string | null
}

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `wsp_${b64}`
}

async function sha256Hex(s: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

const fmtDate = (iso: string | null) => iso
  ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'never'

export function ClaudeConnector({ profileId }: { profileId: string }) {
  const [tokens, setTokens] = useState<TokenRow[]>([])
  const [name, setName] = useState('')
  const [created, setCreated] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const endpoint = `${window.location.origin}/api/mcp`

  const fetchTokens = useCallback(async (): Promise<TokenRow[] | null> => {
    if (!isConfigured) return []
    const { data, error: err } = await supabase
      .from('mcp_tokens')
      .select('id, name, token_hint, created_at, last_used_at')
      .eq('profile_id', profileId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
    return err ? null : (data as TokenRow[]) ?? []
  }, [profileId])

  const load = useCallback(async () => {
    const rows = await fetchTokens()
    if (rows) setTokens(rows)
    else setError('Could not load your connections.')
  }, [fetchTokens])

  useEffect(() => {
    let cancelled = false
    fetchTokens().then(rows => {
      if (cancelled) return
      if (rows) setTokens(rows)
      else setError('Could not load your connections.')
    })
    return () => { cancelled = true }
  }, [fetchTokens])

  async function create() {
    setBusy(true)
    setError('')
    const token = newToken()
    const { error: err } = await supabase.from('mcp_tokens').insert({
      profile_id: profileId,
      name: name.trim() || 'Claude',
      token_hash: await sha256Hex(token),
      token_hint: token.slice(-4),
    })
    setBusy(false)
    if (err) { setError('Could not create a connection. Please try again.'); return }
    setCreated(token)
    setName('')
    load()
  }

  async function revoke(id: string) {
    if (!window.confirm('Disconnect this connection? Claude will no longer be able to save to your library with it.')) return
    const { error: err } = await supabase.from('mcp_tokens').update({ revoked_at: new Date().toISOString() }).eq('id', id)
    if (err) setError('Could not disconnect. Please try again.')
    else setTokens(prev => prev.filter(t => t.id !== id))
  }

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* clipboard blocked: the text is selectable */ }
  }

  const codeCommand = created ? `claude mcp add --transport http worksheet-project ${endpoint} --header "Authorization: Bearer ${created}"` : ''
  const desktopConfig = created ? JSON.stringify({
    mcpServers: {
      'worksheet-project': {
        command: 'npx',
        // mcp-remote's recommended form: no spaces inside args (they break on Windows)
        args: ['-y', 'mcp-remote', endpoint, '--header', 'Authorization:${AUTH_HEADER}'],
        env: { AUTH_HEADER: `Bearer ${created}` },
      },
    },
  }, null, 2) : ''

  return (
    <div className="profile-linked-section cc-section">
      <p className="profile-linked-title">Claude connector</p>
      <p className="profile-field-hint">
        Let Claude plan worksheets with you and save them straight into your library, tagged to the right spec point.
        Sheets saved from Claude stay private and are flagged for you to review here first.
      </p>

      {created && (
        <div className="cc-created">
          <p className="cc-created-title">Your new connection token — copy it now, it won't be shown again.</p>
          <div className="cc-code-row">
            <code className="cc-code">{created}</code>
            <button type="button" className="profile-linked-btn" onClick={() => copy('token', created)}>{copied === 'token' ? 'Copied' : 'Copy'}</button>
          </div>

          <p className="cc-step"><strong>Claude in the browser (claude.ai):</strong> Customize → Connectors → + Add → Add custom connector.
            Name it “The Worksheet Project”, URL <code>{endpoint}</code>, Authentication <strong>No sign-in</strong>.
            Under <strong>Request headers</strong> (maybe inside Advanced) choose <strong>x-api-key</strong> from the list and paste the token above as the value. Then Add.</p>

          <p className="cc-step"><strong>Claude Code:</strong> run this in a terminal.</p>
          <div className="cc-code-row">
            <code className="cc-code cc-code--block">{codeCommand}</code>
            <button type="button" className="profile-linked-btn" onClick={() => copy('code', codeCommand)}>{copied === 'code' ? 'Copied' : 'Copy'}</button>
          </div>

          <p className="cc-step"><strong>Claude Desktop:</strong> Settings → Developer → Edit Config, add this to <code>claude_desktop_config.json</code>, then restart Claude. Needs Node.js.</p>
          <div className="cc-code-row">
            <pre className="cc-code cc-code--block">{desktopConfig}</pre>
            <button type="button" className="profile-linked-btn" onClick={() => copy('desktop', desktopConfig)}>{copied === 'desktop' ? 'Copied' : 'Copy'}</button>
          </div>

          <p className="cc-step">Then ask Claude, for example: “Make a Higher retrieval sheet on the wave equation and save it to The Worksheet Project.”</p>
          <button type="button" className="cc-done" onClick={() => setCreated(null)}>Done</button>
        </div>
      )}

      {tokens.length > 0 && (
        <div className="profile-linked-list cc-list">
          {tokens.map(t => (
            <div key={t.id} className="profile-linked-row">
              <span className="profile-linked-connected">
                {t.name} <span className="cc-hint">…{t.token_hint}</span>
                <span className="cc-meta">made {fmtDate(t.created_at)} · last used {fmtDate(t.last_used_at)}</span>
              </span>
              <button type="button" className="profile-linked-btn" onClick={() => revoke(t.id)}>Disconnect</button>
            </div>
          ))}
        </div>
      )}

      {!created && (
        <div className="cc-new">
          <input
            className="profile-input cc-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name this connection, e.g. Laptop Claude"
            maxLength={60}
          />
          <button type="button" className="profile-linked-btn" onClick={create} disabled={busy}>
            {busy ? 'Creating…' : 'Connect Claude'}
          </button>
        </div>
      )}
      {error && <p className="profile-linked-error">{error}</p>}
    </div>
  )
}
