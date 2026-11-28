// Everything the MCP server reads or writes, behind one interface so the tools can be
// tested against an in-memory copy. The production store uses the Supabase service-role
// key, which bypasses row-level security, so EVERY method here that touches a teacher's
// data takes their profile id and filters on it explicitly.
import { createHash } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Row = Record<string, any>

export interface WorksheetFilters {
  qualification?: string
  examBoard?: string
  specPoint?: string
  query?: string
  limit: number
}

export interface TokenAccess {
  profileId: string
  isAdmin: boolean
}

export interface Store {
  /** Who a live token belongs to, or null. Also records that the token was used. */
  accessForToken(token: string): Promise<TokenAccess | null>
  profile(profileId: string): Promise<Row | null>
  courses(profileId: string): Promise<{ qualification_id: string; exam_board: string }[]>

  publicWorksheets(f: WorksheetFilters): Promise<Row[]>
  myWorksheets(profileId: string, f: WorksheetFilters): Promise<Row[]>
  /** Any worksheet by id; callers decide whether this teacher may see it. */
  worksheet(id: string): Promise<Row | null>
  insertWorksheet(row: Row): Promise<void>
  updateWorksheet(id: string, profileId: string, patch: Row): Promise<void>

  schemes(profileId: string): Promise<Row[]>
  scheme(id: string, profileId: string): Promise<Row | null>
  schemeTopics(schemeId: string): Promise<Row[]>          // each with .worksheets: Row[] (id, title, spec_point)
  schemeTopic(id: string): Promise<Row | null>
  insertSchemeTopic(row: Row): Promise<Row>
  insertSchemeTopicWorksheet(row: Row): Promise<Row>

  // ── OAuth sign-in (api/_lib/oauth.ts) ──
  /** Profile id for a site login (a Supabase Auth access token), or null. */
  profileForUserJwt(jwt: string): Promise<string | null>
  isAdmin(profileId: string): Promise<boolean>
  oauthClient(clientId: string): Promise<Row | null>
  upsertOAuthClient(row: Row): Promise<void>
  insertOAuthCode(row: Row): Promise<void>
  /** Marks a code used and returns it, or null if it doesn't exist or was already used. */
  consumeOAuthCode(codeHash: string): Promise<Row | null>
  insertConnection(row: Row): Promise<void>
  /** A live (not revoked) OAuth connection by refresh-token hash. */
  connectionByRefresh(refreshHash: string): Promise<Row | null>
  updateConnection(id: string, patch: Row): Promise<void>
  /** Revoke whichever connection this access or refresh token belongs to. */
  revokeByTokenHash(hash: string): Promise<void>
}

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

const clean = (s: string) => s.replace(/[,()%*\\"]/g, ' ').trim()
const LIST_COLUMNS = 'id, profile_id, title, topic, qualification_id, exam_board, tier, spec_point, rating, attribution, published_at, is_public, share_enabled, ai_generated, source, needs_review, created_at, updated_at, blocks'

function check<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Database error (${what}): ${res.error.message}`)
  return res.data
}

export function supabaseStore(): Store {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('The connector is not configured: set SUPABASE_SERVICE_ROLE_KEY (and SUPABASE_URL or VITE_SUPABASE_URL) in Vercel.')
  const db: SupabaseClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  const filtered = (q: any, f: WorksheetFilters) => {
    if (f.qualification) q = q.eq('qualification_id', f.qualification)
    if (f.examBoard) q = q.eq('exam_board', f.examBoard)
    if (f.specPoint) q = q.eq('spec_point', f.specPoint)
    const t = f.query ? clean(f.query) : ''
    if (t) q = q.or(`title.ilike.%${t}%,topic.ilike.%${t}%`)
    return q.limit(f.limit)
  }

  return {
    async accessForToken(token) {
      const rows = check(await db.from('mcp_tokens').select('id, profile_id, expires_at, profiles(is_admin)').eq('token_hash', hashToken(token)).is('revoked_at', null).limit(1), 'token') as Row[]
      if (!rows?.length) return null
      if (rows[0].expires_at && new Date(rows[0].expires_at).getTime() <= Date.now()) return null
      await db.from('mcp_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', rows[0].id)
      return { profileId: rows[0].profile_id as string, isAdmin: rows[0].profiles?.is_admin === true }
    },
    async profile(profileId) {
      return check(await db.from('profiles').select('id, name').eq('id', profileId).maybeSingle(), 'profile') as Row | null
    },
    async courses(profileId) {
      return (check(await db.from('user_courses').select('qualification_id, exam_board').eq('profile_id', profileId), 'courses') ?? []) as { qualification_id: string; exam_board: string }[]
    },
    async publicWorksheets(f) {
      const q = db.from('worksheets').select(`${LIST_COLUMNS}, profiles(name)`).eq('is_public', true).order('rating', { ascending: false, nullsFirst: false }).order('published_at', { ascending: false })
      return (check(await filtered(q, f), 'library') ?? []) as Row[]
    },
    async myWorksheets(profileId, f) {
      const q = db.from('worksheets').select(LIST_COLUMNS).eq('profile_id', profileId).neq('is_recall', true).order('updated_at', { ascending: false })
      return (check(await filtered(q, f), 'my worksheets') ?? []) as Row[]
    },
    async worksheet(id) {
      return check(await db.from('worksheets').select('*, profiles(name)').eq('id', id).maybeSingle(), 'worksheet') as Row | null
    },
    async insertWorksheet(row) {
      check(await db.from('worksheets').insert(row), 'save worksheet')
    },
    async updateWorksheet(id, profileId, patch) {
      check(await db.from('worksheets').update(patch).eq('id', id).eq('profile_id', profileId), 'update worksheet')
    },
    async schemes(profileId) {
      return (check(await db.from('schemes').select('*').eq('profile_id', profileId).order('updated_at', { ascending: false }), 'schemes') ?? []) as Row[]
    },
    async scheme(id, profileId) {
      return check(await db.from('schemes').select('*').eq('id', id).eq('profile_id', profileId).maybeSingle(), 'scheme') as Row | null
    },
    async schemeTopics(schemeId) {
      const rows = (check(await db.from('scheme_topics')
        .select('*, scheme_topic_worksheets(id, worksheet_id, position, worksheets(id, title, spec_point))')
        .eq('scheme_id', schemeId).order('week_start').order('position'), 'scheme topics') ?? []) as Row[]
      return rows.map(t => ({
        ...t,
        worksheets: ((t.scheme_topic_worksheets ?? []) as Row[])
          .sort((a, b) => a.position - b.position)
          .map(sw => ({ id: sw.worksheet_id, title: sw.worksheets?.title ?? '', spec_point: sw.worksheets?.spec_point ?? null })),
      }))
    },
    async schemeTopic(id) {
      return check(await db.from('scheme_topics').select('*, scheme_topic_worksheets(id)').eq('id', id).maybeSingle(), 'scheme topic') as Row | null
    },
    async insertSchemeTopic(row) {
      return check(await db.from('scheme_topics').insert(row).select().single(), 'add scheme topic') as Row
    },
    async insertSchemeTopicWorksheet(row) {
      return check(await db.from('scheme_topic_worksheets').insert(row).select().single(), 'add worksheet to scheme') as Row
    },

    async profileForUserJwt(jwt) {
      const { data, error } = await db.auth.getUser(jwt)
      return error || !data.user ? null : data.user.id
    },
    async isAdmin(profileId) {
      const row = check(await db.from('profiles').select('is_admin').eq('id', profileId).maybeSingle(), 'admin check') as Row | null
      return row?.is_admin === true
    },
    async oauthClient(clientId) {
      return check(await db.from('oauth_clients').select('*').eq('client_id', clientId).maybeSingle(), 'oauth client') as Row | null
    },
    async upsertOAuthClient(row) {
      check(await db.from('oauth_clients').upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'client_id' }), 'save oauth client')
    },
    async insertOAuthCode(row) {
      check(await db.from('oauth_codes').insert(row), 'save authorization code')
    },
    async consumeOAuthCode(codeHash) {
      // Single conditional update, so a code can only ever be exchanged once
      const rows = check(await db.from('oauth_codes').update({ used_at: new Date().toISOString() })
        .eq('code_hash', codeHash).is('used_at', null).select(), 'use authorization code') as Row[]
      return rows?.[0] ?? null
    },
    async insertConnection(row) {
      check(await db.from('mcp_tokens').insert(row), 'save connection')
    },
    async connectionByRefresh(refreshHash) {
      return check(await db.from('mcp_tokens').select('*').eq('refresh_token_hash', refreshHash).eq('kind', 'oauth').is('revoked_at', null).maybeSingle(), 'refresh token') as Row | null
    },
    async updateConnection(id, patch) {
      check(await db.from('mcp_tokens').update(patch).eq('id', id), 'update connection')
    },
    async revokeByTokenHash(hash) {
      const now = new Date().toISOString()
      check(await db.from('mcp_tokens').update({ revoked_at: now }).eq('token_hash', hash).is('revoked_at', null), 'revoke')
      check(await db.from('mcp_tokens').update({ revoked_at: now }).eq('refresh_token_hash', hash).is('revoked_at', null), 'revoke')
    },
  }
}
