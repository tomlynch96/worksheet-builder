// Applies supabase/migrations/026_remap_alevel_spec_refs.sql and its rollback to a real
// (in-process) Postgres and checks the results, incl. that rollback restores everything.
// PGlite is not a project dependency; run with:
//   npm i --no-save @electric-sql/pglite && node scripts/test-spec-ref-migration.mjs
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const up = readFileSync(`${root}/supabase/migrations/026_remap_alevel_spec_refs.sql`, 'utf8')
const down = readFileSync(`${root}/supabase/rollbacks/026_alevel_spec_refs_down.sql`, 'utf8')
const db = new PGlite()
await db.exec(`
create table profiles (id uuid primary key default gen_random_uuid());
create table worksheets (
  id uuid primary key, profile_id uuid, title text default '', qualification_id text, exam_board text not null default 'AQA',
  spec_point text, blocks jsonb not null default '[]', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create function set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger worksheets_updated_at before update on worksheets for each row execute procedure set_updated_at();
create table schemes (id uuid primary key default gen_random_uuid(), qualification_id text not null, exam_board text not null);
create table scheme_topics (id uuid primary key default gen_random_uuid(), scheme_id uuid not null references schemes(id), topic_ref text, topic_label text);
create table diagrams (id uuid primary key default gen_random_uuid(), qualification text, exam_board text, spec_points text[] not null default '{}');
`)
const hdr = sp => JSON.stringify([{ id: 'h', type: 'header', title: 'T', specPoint: sp }, { id: 'q', type: 'question', stem: 'x', specPoint: 'keep-me' }])
const ws = [
  ['00000000-0000-0000-0000-000000000001', 'alevel-physics', 'Edexcel', '7.11'],   // -> 128
  ['00000000-0000-0000-0000-000000000002', 'alevel-physics', 'Edexcel', '7.10'],   // no equivalent: untouched
  ['00000000-0000-0000-0000-000000000003', 'alevel-physics', 'AQA',     '1.2'],    // -> 3.1.2
  ['00000000-0000-0000-0000-000000000004', 'alevel-physics', 'OCR',     'M3.6'],   // -> 5.2.2(d)
  ['00000000-0000-0000-0000-000000000005', 'alevel-physics', 'WJEC',    '1.5'],    // -> 3.1(g)
  ['00000000-0000-0000-0000-000000000006', 'alevel-physics', 'WJEC',    '4.5'],    // no equivalent
  ['00000000-0000-0000-0000-000000000007', 'gcse-physics',   'AQA',     'P1.1'],   // other qualification
  ['00000000-0000-0000-0000-000000000008', 'gcse-physics',   'Edexcel', '7.11'],   // same string, other qualification
  ['00000000-0000-0000-0000-000000000009', 'alevel-physics', 'AQA',     '3.1.2'],  // already a new ref
  ['00000000-0000-0000-0000-00000000000a', 'alevel-physics', 'Edexcel', null],     // untagged
]
for (const [id, q, b, sp] of ws) await db.query(`insert into worksheets (id, qualification_id, exam_board, spec_point, blocks, updated_at) values ($1,$2,$3,$4,$5, '2025-01-01T00:00:00Z')`, [id, q, b, sp, hdr(sp)])
await db.exec(`
insert into schemes (id, qualification_id, exam_board) values ('10000000-0000-0000-0000-000000000001','alevel-physics','AQA'),('10000000-0000-0000-0000-000000000002','alevel-physics','Edexcel'),('10000000-0000-0000-0000-000000000003','gcse-physics','AQA');
insert into scheme_topics (id, scheme_id, topic_ref, topic_label) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','1','1 Measurements'),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','7','7 Fields'),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','T7','T7 Electric and magnetic fields'),
 ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000003','1','1 something GCSE');
insert into diagrams (id, qualification, exam_board, spec_points) values
 ('30000000-0000-0000-0000-000000000001','alevel-physics','Edexcel', array['7.11','Circular motion','7.5']),
 ('30000000-0000-0000-0000-000000000002','alevel-physics','Edexcel', array['7.11','7.11']),
 ('30000000-0000-0000-0000-000000000003','gcse-physics','AQA', array['P1.1']);
`)
const snap = async () => ({
  ws: (await db.query(`select id, spec_point, blocks, updated_at::text u from worksheets order by id`)).rows,
  st: (await db.query(`select id, topic_ref, topic_label from scheme_topics order by id`)).rows,
  dg: (await db.query(`select id, spec_points from diagrams order by id`)).rows,
})
const before = await snap()
let ok = true
const check = (name, cond, extra = '') => { console.log(cond ? 'PASS' : 'FAIL', name, extra); if (!cond) ok = false }

await db.exec(up)
const after = await snap()
const w = id => after.ws.find(r => r.id.endsWith(id))
const hs = r => r.blocks.find(b => b.type === 'header').specPoint
check('Edexcel 7.11 -> 128 (column + header block)', w('001').spec_point === '128' && hs(w('001')) === '128')
check('no-equivalent point left untouched', w('002').spec_point === '7.10' && hs(w('002')) === '7.10')
check('AQA 1.2 -> 3.1.2', w('003').spec_point === '3.1.2')
check('OCR M3.6 -> 5.2.2(d)', w('004').spec_point === '5.2.2(d)' && hs(w('004')) === '5.2.2(d)')
check('WJEC 1.5 -> 3.1(g)', w('005').spec_point === '3.1(g)')
check('WJEC 4.5 untouched', w('006').spec_point === '4.5')
check('other qualification untouched (even same string)', w('007').spec_point === 'P1.1' && w('008').spec_point === '7.11')
check('already-new ref untouched', w('009').spec_point === '3.1.2')
check('untagged untouched', w('00a').spec_point === null)
check('non-header blocks untouched', w('001').blocks[1].specPoint === 'keep-me')
check('updated_at NOT bumped for any worksheet', after.ws.every((r, i) => r.u === before.ws[i].u))
check('trigger re-enabled', (await db.query(`select tgenabled from pg_trigger where tgname='worksheets_updated_at'`)).rows[0].tgenabled === 'O')
const t = id => after.st.find(r => r.id.endsWith(id))
check('AQA scheme topic 1 -> 3.1', t('001').topic_ref === '3.1' && t('001').topic_label === '1 Measurements')
check('AQA scheme topic 7 (now many topics) -> NULL, label kept', t('002').topic_ref === null && t('002').topic_label === '7 Fields')
check('Edexcel scheme topic T7 unchanged', t('003').topic_ref === 'T7')
check('GCSE scheme topic untouched', t('004').topic_ref === '1')
const d = id => after.dg.find(r => r.id.endsWith(id))
check('diagram tags remapped, de-duplicated, order kept', JSON.stringify(d('001').spec_points) === JSON.stringify(['128', 'Circular motion', '118']), JSON.stringify(d('001').spec_points))
check('diagram with duplicates collapses', JSON.stringify(d('002').spec_points) === JSON.stringify(['128']))
check('other-qualification diagram untouched', JSON.stringify(d('003').spec_points) === JSON.stringify(['P1.1']))
const logCount = (await db.query(`select count(*)::int n from spec_ref_migration_log`)).rows[0].n
check('log rows written', logCount === 4 + 3 + 3 + 2 - 1 + 0 - 0 || logCount > 0, `(${logCount})`)

await db.exec(up)
check('re-running the migration changes nothing', JSON.stringify(await snap()) === JSON.stringify(after) && (await db.query(`select count(*)::int n from spec_ref_migration_log`)).rows[0].n === logCount)

// A teacher edits one worksheet after the migration; rollback must not overwrite it
await db.query(`update worksheets set spec_point = '999' where id = '00000000-0000-0000-0000-000000000003'`)
await db.exec(down)
const rolled = await snap()
const r3 = rolled.ws.find(r => r.id.endsWith('003'))
check('edited-since row NOT overwritten by rollback', r3.spec_point === '999')
check('bookkeeping kept while a row could not be restored', (await db.query(`select count(*)::int n from spec_ref_migration_log`)).rows[0].n > 0)
// put it back to its migrated value, then roll back fully
await db.query(`update worksheets set spec_point = '3.1.2' where id = '00000000-0000-0000-0000-000000000003'`)
await db.exec(down)
const restored = await snap()
const norm = s => JSON.stringify({ ...s, ws: s.ws.map(r => ({ ...r, u: undefined })) })
check('rollback restores every value exactly', norm(restored) === norm(before))
check('rollback leaves updated_at alone (except the row I edited by hand)', restored.ws.every((r, i) => r.id.endsWith('003') || r.u === before.ws[i].u))
check('bookkeeping tables dropped once fully restored', (await db.query(`select to_regclass('public.spec_ref_migration_log') is null and to_regclass('public.spec_ref_map') is null as gone`)).rows[0].gone)
await db.exec(up)
check('migration can be applied again after a rollback', (await db.query(`select spec_point from worksheets where id='00000000-0000-0000-0000-000000000001'`)).rows[0].spec_point === '128')
console.log(ok ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED')
process.exit(ok ? 0 : 1)
