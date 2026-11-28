// End-to-end test of the MCP server: the real /api/mcp handler on a local HTTP server with an
// in-memory store, driven by the official MCP client exactly as Claude would. Run: npm run test:mcp
import http from 'node:http'
import { readFileSync } from 'node:fs'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { handleMcp } from '../api/mcp.ts'
import { hashToken, type Row, type Store } from '../api/_lib/store.ts'

const ME = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'
const TOKEN = 'wsp_test_token_abc'
const TEACHER_TOKEN = 'wsp_non_admin_token'
const db = {
  tokens: [
    { token_hash: hashToken(TOKEN), profile_id: ME, revoked_at: null as string | null },
    { token_hash: hashToken(TEACHER_TOKEN), profile_id: OTHER, revoked_at: null as string | null },
  ],
  profiles: [{ id: ME, name: 'Ms Test', is_admin: true }, { id: OTHER, name: 'Mr Other', is_admin: false }],
  courses: [{ profile_id: ME, qualification_id: 'gcse-physics', exam_board: 'AQA' }],
  worksheets: [] as Row[],
  schemes: [{ id: '33333333-3333-4333-8333-333333333333', profile_id: ME, name: 'Y10 Physics', academic_year: '2026-27', qualification_id: 'gcse-physics', exam_board: 'AQA', browsable_qualifications: [] }],
  topics: [] as Row[],
  stw: [] as Row[],
}
const wave = JSON.parse(readFileSync(new URL('./fixtures/wave-equation.json', import.meta.url), 'utf8'))
db.worksheets.push({ ...wave, id: '44444444-4444-4444-8444-444444444444', profile_id: OTHER, title: 'Waves recap', topic: 'Waves', qualification_id: 'gcse-physics', exam_board: 'AQA', spec_point: 'P6.2', tier: 'higher', is_public: true, rating: 5, attribution: 'named', profiles: { name: 'Mr Other' } })

const match = (r: Row, f: { qualification?: string; examBoard?: string; specPoint?: string }) =>
  (!f.qualification || r.qualification_id === f.qualification) && (!f.examBoard || r.exam_board === f.examBoard) && (!f.specPoint || r.spec_point === f.specPoint)
let uid = 0
const store: Store = {
  async accessForToken(t) {
    const tok = db.tokens.find(x => x.token_hash === hashToken(t) && !x.revoked_at)
    return tok ? { profileId: tok.profile_id, isAdmin: !!db.profiles.find(p => p.id === tok.profile_id)?.is_admin } : null
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
}

// Minimal Vercel-style req/res on a plain Node server.
const srv = http.createServer(async (req, res) => {
  let body = ''
  for await (const c of req) body += c
  const vreq = Object.assign(req, { body: body ? JSON.parse(body) : undefined }) as any
  const vres = Object.assign(res, {
    status(code: number) { res.statusCode = code; return vres },
    json(v: unknown) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(v)); return vres },
  }) as any
  await handleMcp(vreq, vres, store)
})
await new Promise<void>(r => srv.listen(0, r))
const url = new URL(`http://127.0.0.1:${(srv.address() as any).port}/api/mcp`)

let pass = 0, fail = 0
const ok = (cond: unknown, name: string, detail?: unknown) => { if (cond) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗', name, detail ?? '') } }
const txt = (r: any) => r.content?.map((c: any) => c.text).join('\n') ?? ''

// Auth
for (const [name, headers, status] of [
  ['no token', {}, 401],
  ['bad token', { Authorization: 'Bearer nope' }, 401],
  ['non-admin teacher token', { Authorization: `Bearer ${TEACHER_TOKEN}` }, 403],
  ['bad x-api-key', { 'x-api-key': 'nope' }, 401],
] as const) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...headers }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) })
  ok(r.status === status, `${name} → ${status}`, r.status)
}

// claude.ai request-header connectors: the bare token in x-api-key or x-auth-token
for (const [name, headers] of [
  ['x-api-key', { 'x-api-key': TOKEN }],
  ['x-auth-token', { 'x-auth-token': TOKEN }],
  ['x-api-key with "Bearer "', { 'x-api-key': `Bearer ${TOKEN}` }],
] as const) {
  const c = new Client({ name: 'e2e-header', version: '1.0.0' })
  await c.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers } }))
  ok((await c.listTools()).tools.length === 12, `token accepted in ${name}`)
  await c.close()
}

const client = new Client({ name: 'e2e', version: '1.0.0' })
await client.connect(new StreamableHTTPClientTransport(url, { requestInit: { headers: { Authorization: `Bearer ${TOKEN}` } } }))
console.log('\nServer instructions present:', !!client.getInstructions())

const tools = (await client.listTools()).tools.map(t => t.name)
ok(tools.length === 12, `12 tools: ${tools.join(', ')}`)
const prompts = (await client.listPrompts()).prompts.map(p => p.name)
ok(prompts.includes('make-worksheet') && prompts.includes('plan-unit'), `prompts: ${prompts.join(', ')}`)

const call = (name: string, args: Record<string, unknown> = {}) => client.callTool({ name, arguments: args }) as Promise<any>

const guide = await call('get_worksheet_guide')
ok(txt(guide).includes('save_worksheet') && !txt(guide).includes('Editor → **Open**'), 'guide is the MCP wording')

const courses = await call('list_my_courses')
ok(courses.structuredContent.myCourses[0].qualification === 'gcse-physics', 'list_my_courses returns the teacher\'s course')

const spec = await call('search_spec', { query: 'wave equation', qualification: 'gcse-physics', exam_board: 'AQA' })
ok(spec.structuredContent.results[0].ref === 'P6.2', 'search_spec "wave equation" → P6.2', spec.structuredContent?.results?.[0])
const byRef = await call('search_spec', { query: 'P6.4', qualification: 'gcse-physics', exam_board: 'AQA' })
ok(byRef.structuredContent.results[0].ref === 'P6.4', 'search_spec by ref')

const topics = await call('get_spec_topics', { qualification: 'gcse-physics', exam_board: 'AQA', topic_ref: 'P6' })
ok(topics.structuredContent.topic.points.length === 7, 'get_spec_topics P6 has 7 points')

const lib = await call('search_library', { spec_point: 'P6.2' })
ok(lib.structuredContent.results.length === 1 && lib.structuredContent.results[0].totalMarks === 34, 'search_library finds the public sheet with its marks')

const other = await call('get_worksheet', { id: '44444444-4444-4444-8444-444444444444' })
ok(txt(other).includes('Save changes as a new worksheet'), 'get_worksheet on someone else\'s public sheet says save as new')

// Save: errors first
const bad = JSON.parse(JSON.stringify(wave)); delete bad.id; bad.blocks[0].specPoint = 'P6.9'
const badRes = await call('save_worksheet', { worksheet: bad })
ok(badRes.isError && txt(badRes).includes('Closest: P6.2'), 'bad spec ref rejected with suggestions')
ok(db.worksheets.length === 1, 'nothing saved on error')

// Save a new sheet
const good = JSON.parse(JSON.stringify(wave)); delete good.id
const saved = await call('save_worksheet', { worksheet: good, worksheet_type: 'maths' })
ok(!saved.isError, 'valid sheet saved', txt(saved))
const newId = saved.structuredContent.id
const row = db.worksheets.find(w => w.id === newId)!
ok(row.profile_id === ME && row.source === 'mcp' && row.needs_review === true && row.is_public === false && row.share_enabled === false, 'row is private, from MCP, needs review')
ok(row.ai_generated === true && row.worksheet_type === 'maths' && JSON.stringify(row.original_blocks) === JSON.stringify(row.blocks), 'AI baseline recorded')
ok(row.spec_point === 'P6.2' && row.qualification_id === 'gcse-physics' && row.exam_board === 'AQA', 'taxonomy columns filled from header')
ok(txt(saved).includes(`/share/${newId}`), 'link returned', txt(saved))

// Revise the unreviewed draft
good.id = newId; good.blocks[0].title = 'The wave equation (revised)'
const revised = await call('save_worksheet', { worksheet: good })
ok(!revised.isError && db.worksheets.find(w => w.id === newId)!.title === 'The wave equation (revised)', 'revising an unreviewed draft replaces it')

// After the teacher reviews it on the site, Claude can't overwrite it
row.needs_review = false
const blocked = await call('save_worksheet', { worksheet: good })
ok(blocked.isError && txt(blocked).includes('new worksheet'), 'reviewed sheet cannot be overwritten')

// Someone else's id
const stolen = JSON.parse(JSON.stringify(wave)); stolen.id = '44444444-4444-4444-8444-444444444444'
const st = await call('save_worksheet', { worksheet: stolen })
ok(st.isError && txt(st).includes('does not own'), 'cannot overwrite another teacher\'s sheet')

const mine = await call('list_my_worksheets', {})
ok(mine.structuredContent.results.length === 1 && mine.structuredContent.results[0].fromClaude, 'list_my_worksheets shows only mine')

// Schemes
const schemes = await call('list_schemes')
const schemeId = schemes.structuredContent.schemes[0].id
const pointNotTopic = await call('add_scheme_topic', { scheme_id: schemeId, topic_ref: 'P6.2', week_start: 12 })
ok(pointNotTopic.isError && txt(pointNotTopic).includes('"P6"'), 'scheme rejects a point ref and suggests the topic')
const added = await call('add_scheme_topic', { scheme_id: schemeId, topic_ref: 'P6', week_start: 12, week_end: 14 })
ok(!added.isError, 'topic P6 added for weeks 12–14', txt(added))
const att = await call('add_worksheet_to_scheme', { scheme_topic_id: added.structuredContent.schemeTopicId, worksheet_id: newId })
ok(!att.isError, 'worksheet attached to scheme topic', txt(att))
const again = await call('add_worksheet_to_scheme', { scheme_topic_id: added.structuredContent.schemeTopicId, worksheet_id: newId })
ok(!again.isError && txt(again).includes('already attached'), 'duplicate attach handled')
const scheme = await call('get_scheme', { scheme_id: schemeId })
ok(txt(scheme).includes('12–14') && txt(scheme).includes('revised'), 'get_scheme shows the week and the sheet')

const p = await client.getPrompt({ name: 'make-worksheet', arguments: { request: 'Higher sheet on the wave equation' } })
ok((p.messages[0].content as any).text.includes('get_worksheet_guide'), 'make-worksheet prompt')

await client.close(); srv.close()
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
