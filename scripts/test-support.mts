// Shared by scripts/test-mcp.mts and scripts/test-oauth.mts: an in-memory Store with the same
// behaviour as the Supabase one, and a local HTTP server that routes requests the way
// vercel.json does (/api/mcp, /api/oauth/<route>, /.well-known/oauth-*).
import http from 'node:http'
import { readFileSync } from 'node:fs'
import { handleMcp } from '../api/mcp.ts'
import { handleOAuth } from '../api/_lib/oauth.ts'
import { hashToken, type Row, type Store } from '../api/_lib/store.ts'
import { siteOrigin } from '../api/_lib/http.ts'

export const ME = '11111111-1111-4111-8111-111111111111'
export const OTHER = '22222222-2222-4222-8222-222222222222'
export const TOKEN = 'wsp_test_token_abc'
export const TEACHER_TOKEN = 'wsp_non_admin_token'
/** Fake site logins (Supabase access tokens) for the consent page */
export const ADMIN_JWT = 'jwt-admin'
export const TEACHER_JWT = 'jwt-teacher'

export function createMemoryStore() {
  const db = {
    tokens: [
      { id: 't1', kind: 'personal', token_hash: hashToken(TOKEN), profile_id: ME, revoked_at: null as string | null },
      { id: 't2', kind: 'personal', token_hash: hashToken(TEACHER_TOKEN), profile_id: OTHER, revoked_at: null as string | null },
    ] as Row[],
    profiles: [{ id: ME, name: 'Ms Test', is_admin: true }, { id: OTHER, name: 'Mr Other', is_admin: false }],
    courses: [{ profile_id: ME, qualification_id: 'gcse-physics', exam_board: 'AQA' }],
    worksheets: [] as Row[],
    schemes: [{ id: '33333333-3333-4333-8333-333333333333', profile_id: ME, name: 'Y10 Physics', academic_year: '2026-27', qualification_id: 'gcse-physics', exam_board: 'AQA', browsable_qualifications: [] }] as Row[],
    topics: [] as Row[],
    stw: [] as Row[],
    oauthClients: [] as Row[],
    oauthCodes: [] as Row[],
  }
  const wave = JSON.parse(readFileSync(new URL('./fixtures/wave-equation.json', import.meta.url), 'utf8'))
  db.worksheets.push({ ...wave, id: '44444444-4444-4444-8444-444444444444', profile_id: OTHER, title: 'Waves recap', topic: 'Waves', qualification_id: 'gcse-physics', exam_board: 'AQA', spec_point: 'P6.2', tier: 'higher', is_public: true, rating: 5, attribution: 'named', profiles: { name: 'Mr Other' } })

  const match = (r: Row, f: { qualification?: string; examBoard?: string; specPoint?: string }) =>
    (!f.qualification || r.qualification_id === f.qualification) && (!f.examBoard || r.exam_board === f.examBoard) && (!f.specPoint || r.spec_point === f.specPoint)
  let uid = 0
  const live = (t: Row) => !t.revoked_at

  const store: Store = {
    async accessForToken(token) {
      const t = db.tokens.find(x => x.token_hash === hashToken(token) && live(x))
      if (!t) return null
      if (t.expires_at && new Date(t.expires_at).getTime() <= Date.now()) return null
      t.last_used_at = new Date().toISOString()
      return { profileId: t.profile_id, isAdmin: !!db.profiles.find(p => p.id === t.profile_id)?.is_admin }
    },
    async profile(id) { return db.profiles.find(p => p.id === id) ?? null },
    async courses(id) { return db.courses.filter(c => c.profile_id === id) },
    async publicWorksheets(f) { return db.worksheets.filter(w => w.is_public && match(w, f)).slice(0, f.limit) },
    async myWorksheets(id, f) { return db.worksheets.filter(w => w.profile_id === id && match(w, f)).slice(0, f.limit) },
    async worksheet(id) { return db.worksheets.find(w => w.id === id) ?? null },
    async insertWorksheet(row) { if (db.worksheets.some(w => w.id === row.id)) throw new Error('duplicate key'); db.worksheets.push({ ...row }) },
    async updateWorksheet(id, pid, patch) { const w = db.worksheets.find(x => x.id === id && x.profile_id === pid); if (w) Object.assign(w, patch) },
    async schemes(id) { return db.schemes.filter(s => s.profile_id === id) },
    async scheme(id, pid) { return db.schemes.find(s => s.id === id && s.profile_id === pid) ?? null },
    async schemeTopics(sid) { return db.topics.filter(t => t.scheme_id === sid).map(t => ({ ...t, worksheets: db.stw.filter(s => s.scheme_topic_id === t.id).map(s => { const w = db.worksheets.find(x => x.id === s.worksheet_id)!; return { id: w.id, title: w.title, spec_point: w.spec_point } }) })) },
    async schemeTopic(id) { const t = db.topics.find(x => x.id === id); return t ? { ...t, scheme_topic_worksheets: db.stw.filter(s => s.scheme_topic_id === id) } : null },
    async insertSchemeTopic(row) { const t = { id: `55555555-5555-4555-8555-${String(++uid).padStart(12, '0')}`, ...row }; db.topics.push(t); return t },
    async insertSchemeTopicWorksheet(row) { if (db.stw.some(s => s.scheme_topic_id === row.scheme_topic_id && s.worksheet_id === row.worksheet_id)) throw new Error('duplicate key value violates unique constraint'); db.stw.push(row); return row },

    async profileForUserJwt(jwt) { return jwt === ADMIN_JWT ? ME : jwt === TEACHER_JWT ? OTHER : null },
    async isAdmin(id) { return !!db.profiles.find(p => p.id === id)?.is_admin },
    async oauthClient(id) { return db.oauthClients.find(c => c.client_id === id) ?? null },
    async upsertOAuthClient(row) {
      const i = db.oauthClients.findIndex(c => c.client_id === row.client_id)
      const r = { updated_at: new Date().toISOString(), ...row }
      if (i >= 0) db.oauthClients[i] = { ...db.oauthClients[i], ...r }; else db.oauthClients.push(r)
    },
    async insertOAuthCode(row) { db.oauthCodes.push({ ...row, used_at: null }) },
    async consumeOAuthCode(hash) {
      const c = db.oauthCodes.find(x => x.code_hash === hash && !x.used_at)
      if (!c) return null
      c.used_at = new Date().toISOString()
      return { ...c }
    },
    async insertConnection(row) { db.tokens.push({ id: `conn-${++uid}`, created_at: new Date().toISOString(), revoked_at: null, ...row }) },
    async connectionByRefresh(hash) { return db.tokens.find(t => t.refresh_token_hash === hash && t.kind === 'oauth' && live(t)) ?? null },
    async updateConnection(id, patch) { const t = db.tokens.find(x => x.id === id); if (t) Object.assign(t, patch) },
    async revokeByTokenHash(hash) {
      for (const t of db.tokens) if (live(t) && (t.token_hash === hash || t.refresh_token_hash === hash)) t.revoked_at = new Date().toISOString()
    },
  }
  return { db, store }
}

/** Serves the API like Vercel, including vercel.json's rewrites. */
export async function startServer(store: Store, opts: { fetchJson?: (url: string) => Promise<unknown> } = {}) {
  const srv = http.createServer(async (req, res) => {
    req.headers['x-forwarded-proto'] = 'http'   // as Vercel's edge would set it
    let raw = ''
    for await (const c of req) raw += c
    const u = new URL(req.url ?? '/', 'http://local')
    const type = String(req.headers['content-type'] ?? '')
    const body = !raw ? undefined
      : type.includes('application/json') ? JSON.parse(raw)
      : type.includes('application/x-www-form-urlencoded') ? Object.fromEntries(new URLSearchParams(raw))
      : raw
    let route: string | undefined
    if (u.pathname.startsWith('/.well-known/oauth-protected-resource')) route = 'protected-resource'
    else if (u.pathname.startsWith('/.well-known/oauth-authorization-server')) route = 'authorization-server'
    else { const m = /^\/api\/oauth\/([^/]+)$/.exec(u.pathname); if (m) route = m[1] }
    const queryObj = Object.fromEntries(u.searchParams)
    const vreq = Object.assign(req, { body, query: route ? { ...queryObj, route } : queryObj }) as any
    const vres = Object.assign(res, {
      status(code: number) { res.statusCode = code; return vres },
      json(v: unknown) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(v)); return vres },
      send(v: unknown) { res.end(typeof v === 'string' ? v : JSON.stringify(v)); return vres },
    }) as any
    if (u.pathname === '/api/mcp') return handleMcp(vreq, vres, store)
    if (route) return handleOAuth(vreq, vres, { store, origin: siteOrigin(vreq), fetchJson: opts.fetchJson ?? (async () => { throw new Error('no network in tests') }) })
    res.statusCode = 404; res.end('not found')
  })
  await new Promise<void>(r => srv.listen(0, r))
  const origin = `http://127.0.0.1:${(srv.address() as any).port}`
  return { origin, url: new URL(`${origin}/api/mcp`), close: () => srv.close() }
}

export function checker() {
  let pass = 0, fail = 0
  return {
    ok(cond: unknown, name: string, detail?: unknown) {
      if (cond) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗', name, detail ?? '') }
    },
    done() { console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0) },
  }
}
