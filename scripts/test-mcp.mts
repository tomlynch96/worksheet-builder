// End-to-end test of the MCP server: the real /api/mcp handler on a local HTTP server with an
// in-memory store, driven by the official MCP client exactly as Claude would. Run: npm run test:mcp
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { readFileSync } from 'node:fs'
import { createMemoryStore, startServer, checker, ME, TOKEN, TEACHER_TOKEN } from './test-support.mts'

const { db, store } = createMemoryStore()
const wave = JSON.parse(readFileSync(new URL('./fixtures/wave-equation.json', import.meta.url), 'utf8'))
const server = await startServer(store)
const url = server.url
const { ok, done } = checker()
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

await client.close(); server.close()
done()
