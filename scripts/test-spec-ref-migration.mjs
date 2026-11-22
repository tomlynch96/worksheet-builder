// Applies migrations 026 + 027 and their rollbacks to a real (in-process) Postgres, with a schema
// that mirrors production (no updated_at trigger; auth.uid(); row level security), and checks them.
// PGlite is not a project dependency; run with:
//   npm i --no-save @electric-sql/pglite && node scripts/test-spec-ref-migration.mjs
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = process.env.REPO_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..')
const f = p => readFileSync(join(root, p), 'utf8')
const up26 = f('supabase/migrations/026_remap_alevel_spec_refs.sql'), up27 = f('supabase/migrations/027_spec_ref_notice_and_flags.sql')
const dn26 = f('supabase/rollbacks/026_alevel_spec_refs_down.sql'), dn27 = f('supabase/rollbacks/027_spec_ref_notice_and_flags_down.sql')

let ok = true
const check = (name, cond, extra = '') => { console.log(cond ? 'PASS' : 'FAIL', name, extra); if (!cond) ok = false }
const P1 = '11111111-1111-1111-1111-111111111111', P2 = '22222222-2222-2222-2222-222222222222' // P2 is an admin
const W = n => `00000000-0000-0000-0000-0000000000${n}`

async function makeDb({ withTrigger }) {
  const db = new PGlite()
  await db.exec(`
  create schema auth;
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create table profiles (id uuid primary key, is_admin boolean not null default false);
  create function public.is_admin() returns boolean language sql stable security definer as $$ select coalesce((select is_admin from profiles where id = auth.uid()), false) $$;
  create table worksheets (
    id uuid primary key, profile_id uuid not null references profiles(id), title text not null default '', qualification_id text,
    exam_board text not null default 'AQA', spec_point text, blocks jsonb not null default '[]',
    created_at timestamptz not null default now(), updated_at timestamptz not null default now());
  create table schemes (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id), qualification_id text not null, exam_board text not null);
  create table scheme_topics (id uuid primary key default gen_random_uuid(), scheme_id uuid not null references schemes(id), topic_ref text, topic_label text);
  create table diagrams (id uuid primary key default gen_random_uuid(), profile_id uuid references profiles(id), qualification text, exam_board text, spec_points text[] not null default '{}');
  create table app_config (key text primary key, value text not null);
  alter table worksheets enable row level security; alter table schemes enable row level security;
  alter table scheme_topics enable row level security; alter table diagrams enable row level security; alter table profiles enable row level security;
  create policy own on worksheets for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
  create policy own on schemes for all using (profile_id = auth.uid());
  create policy own on scheme_topics for all using (exists (select 1 from schemes s where s.id = scheme_id and s.profile_id = auth.uid()));
  create policy own on diagrams for all using (profile_id = auth.uid());
  create policy own on profiles for all using (id = auth.uid());
  create role anon; create role authenticated; grant usage on schema public, auth to authenticated, anon;
  -- Supabase grants table/function privileges to its API roles by default; row level security does the real gating
  grant all on all tables in schema public to authenticated, anon;
  alter default privileges in schema public grant all on tables to authenticated, anon;
  alter default privileges in schema public grant execute on functions to authenticated, anon;
  `)
  if (withTrigger) await db.exec(`create function set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
    create trigger worksheets_updated_at before update on worksheets for each row execute procedure set_updated_at();`)
  await db.exec(`insert into profiles (id, is_admin) values ('${P1}', false), ('${P2}', true);`)
  const hdr = sp => JSON.stringify([{ id: 'h', type: 'header', specPoint: sp }, { id: 'q', type: 'question', specPoint: 'keep-me' }])
  const ws = [
    [W('01'), P1, 'alevel-physics', 'Edexcel', '7.11'], [W('02'), P1, 'alevel-physics', 'Edexcel', '10.4'],
    [W('03'), P2, 'alevel-physics', 'AQA', '1.2'],      [W('04'), P1, 'gcse-physics', 'Edexcel', '7.11'],
    [W('05'), P1, 'alevel-physics', 'Edexcel', '3.3'],  [W('06'), P1, null, 'AQA', null],
  ]
  for (const [id, p, q, b, sp] of ws) await db.query(`insert into worksheets (id, profile_id, title, qualification_id, exam_board, spec_point, blocks, updated_at) values ($1,$2,'t',$3,$4,$5,$6,'2025-01-01T00:00:00Z')`, [id, p, q, b, sp, hdr(sp)])
  await db.exec(`
  insert into schemes (id, profile_id, qualification_id, exam_board) values ('10000000-0000-0000-0000-000000000001','${P1}','alevel-physics','AQA'),('10000000-0000-0000-0000-000000000002','${P1}','alevel-physics','Edexcel');
  insert into scheme_topics (id, scheme_id, topic_ref, topic_label) values
   ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','1','1 Measurements'),
   ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','7','7 Fields'),
   ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','T9','T9 Thermodynamics');
  insert into diagrams (id, profile_id, qualification, exam_board, spec_points) values
   ('30000000-0000-0000-0000-000000000001','${P1}','alevel-physics','Edexcel', array['5.5','Edexcel-9PH0-5.5']),
   ('30000000-0000-0000-0000-000000000002','${P1}','alevel-physics','Edexcel', array['6.4','Edexcel 6.4','Circular motion','Edexcel-6.4']),
   ('30000000-0000-0000-0000-000000000003','${P1}','alevel-physics','Edexcel', array['Edexcel-1PH0-15.3','Edexcel-1PH0-15.4']),
   ('30000000-0000-0000-0000-000000000004','${P1}','gcse-physics','Edexcel', array['4.1','Edexcel-1PH0-4.1']);`)
  return db
}
const snap = async db => JSON.stringify({
  ws: (await db.query(`select id, spec_point, blocks, updated_at::text u from worksheets order by id`)).rows,
  st: (await db.query(`select id, topic_ref, topic_label from scheme_topics order by id`)).rows,
  dg: (await db.query(`select id, spec_points from diagrams order by id`)).rows,
  cfg: (await db.query(`select key, value from app_config order by key`)).rows,
})
const as = async (db, uid) => { await db.exec(`reset role; select set_config('test.uid', '${uid ?? ''}', false); ${uid ? 'set role authenticated;' : ''}`) }
const one = async (db, sql, params) => (await db.query(sql, params)).rows

for (const withTrigger of [false, true]) {
  console.log(`\n=== schema ${withTrigger ? 'WITH' : 'WITHOUT (as in production)'} an updated_at trigger ===`)
  const db = await makeDb({ withTrigger })
  const before = await snap(db)

  let upErr = null
  try { await db.exec(up26) } catch (e) { upErr = e.message }
  check('026 applies without error', !upErr, upErr ?? '')
  if (upErr) continue
  const a = JSON.parse(await snap(db))
  const w = id => a.ws.find(r => r.id.endsWith(id)), hs = r => r.blocks.find(b => b.type === 'header').specPoint
  check('Edexcel 7.11 -> 128 in column and header block', w('01').spec_point === '128' && hs(w('01')) === '128')
  check('no-equivalent point (Edexcel 10.4) untouched', w('02').spec_point === '10.4')
  check('AQA 1.2 -> 3.1.2 (other owner)', w('03').spec_point === '3.1.2')
  check('other qualification untouched even with the same string', w('04').spec_point === '7.11')
  check('Edexcel 3.3 -> 33', w('05').spec_point === '33')
  check('updated_at not bumped', a.ws.every((r, i) => r.u === JSON.parse(before).ws[i].u))
  const d = id => a.dg.find(r => r.id.endsWith(id)).spec_points
  check('diagram: ref and prefixed variant collapse to one new ref', JSON.stringify(d('001')) === JSON.stringify(['65']), JSON.stringify(d('001')))
  check('diagram: all variants of 6.4 collapse, other tags kept in order', JSON.stringify(d('002')) === JSON.stringify(['183', 'Circular motion']), JSON.stringify(d('002')))
  check('diagram: GCSE-coded tags on an A Level diagram untouched', JSON.stringify(d('003')) === JSON.stringify(['Edexcel-1PH0-15.3', 'Edexcel-1PH0-15.4']))
  check('diagram: other qualification untouched', JSON.stringify(d('004')) === JSON.stringify(['4.1', 'Edexcel-1PH0-4.1']))
  check('scheme topic AQA 1 -> 3.1; label kept', a.st.find(r => r.id.endsWith('001')).topic_ref === '3.1' && a.st.find(r => r.id.endsWith('001')).topic_label === '1 Measurements')
  check('scheme topic AQA 7 -> NULL (now several topics)', a.st.find(r => r.id.endsWith('002')).topic_ref === null)
  check('Edexcel scheme topic T9 unchanged', a.st.find(r => r.id.endsWith('003')).topic_ref === 'T9')
  check('log rows carry the owner', (await one(db, `select count(*)::int n from spec_ref_migration_log where profile_id is null`))[0].n === 0)

  const logN = (await one(db, `select count(*)::int n from spec_ref_migration_log`))[0].n
  await db.exec(up26)
  check('re-running 026 changes nothing', (await snap(db)) === JSON.stringify(a) && (await one(db, `select count(*)::int n from spec_ref_migration_log`))[0].n === logN)

  await db.exec(up27)
  check('027 applies; notice switched on', (await one(db, `select value from app_config where key='spec_ref_notice'`))[0]?.value === '026_alevel_spec_refs')
  await db.exec(up27)
  check('re-running 027 is harmless', true)

  // ── row level security as a signed-in teacher ─────────────────────────────────────────────
  await as(db, P1)
  const myLog = await one(db, `select distinct profile_id from spec_ref_migration_log`)
  check('teacher sees only their own change log', myLog.length === 1 && myLog[0].profile_id === P1)
  check('teacher can read the old/new map', (await one(db, `select count(*)::int n from spec_ref_map`))[0].n > 100)
  await db.query(`insert into spec_ref_acks (profile_id, batch) values ($1, '026_alevel_spec_refs')`, [P1])
  check('teacher can acknowledge the notice', (await one(db, `select count(*)::int n from spec_ref_acks`))[0].n === 1)
  let denied = false
  try { await db.query(`insert into spec_ref_acks (profile_id, batch) values ($1, 'x')`, [P2]) } catch { denied = true }
  check('teacher cannot acknowledge on behalf of someone else', denied)
  await db.query(`insert into spec_ref_flags (profile_id, batch, kind, message, qualification_id, exam_board, spec_ref, worksheet_id) values ($1,'026_alevel_spec_refs','wrong_tag','Should be 129',$2,$3,$4,$5)`, [P1, 'alevel-physics', 'Edexcel', '128', W('01')])
  check('teacher can flag a problem', (await one(db, `select count(*)::int n from spec_ref_flags`))[0].n === 1)
  denied = false
  try { await db.query(`insert into spec_ref_flags (profile_id, kind, message) values ($1,'other','spoof')`, [P2]) } catch { denied = true }
  check('teacher cannot flag as someone else', denied)
  denied = false
  try { await db.query(`insert into spec_ref_flags (profile_id, kind, message) values ($1,'other','')`, [P1]) } catch { denied = true }
  check('empty flag message rejected', denied)
  await db.query(`update spec_ref_flags set status='resolved'`)
  check('teacher cannot resolve flags', (await one(db, `select status from spec_ref_flags`))[0].status === 'open')

  // ── per-teacher undo / re-apply ───────────────────────────────────────────────────────────
  check('other teacher cannot undo my worksheet', (await (async () => { await as(db, P2); return (await one(db, `select spec_ref_set_applied('worksheets', $1, false) n`, [W('01')]))[0].n })()) === 0)
  await as(db, P1)
  check('undo restores column and header block (2 changes)', (await one(db, `select spec_ref_set_applied('worksheets', $1, false) n`, [W('01')]))[0].n === 2)
  const r1 = (await one(db, `select spec_point, blocks from worksheets where id=$1`, [W('01')]))[0]
  check('...back to 7.11 everywhere, other blocks untouched', r1.spec_point === '7.11' && r1.blocks[0].specPoint === '7.11' && r1.blocks[1].specPoint === 'keep-me')
  check('undoing twice is a no-op', (await one(db, `select spec_ref_set_applied('worksheets', $1, false) n`, [W('01')]))[0].n === 0)
  check('re-apply puts 128 back', (await one(db, `select spec_ref_set_applied('worksheets', $1, true) n`, [W('01')]))[0].n === 2 && (await one(db, `select spec_point from worksheets where id=$1`, [W('01')]))[0].spec_point === '128')
  await db.query(`update worksheets set spec_point = '129' where id = $1`, [W('01')])
  let refused = null
  try { await db.query(`select spec_ref_set_applied('worksheets', $1, false)`, [W('01')]) } catch (e) { refused = e.message }
  const r2 = (await one(db, `select spec_point, blocks from worksheets where id=$1`, [W('01')]))[0]
  check('undo is refused after a later edit, and leaves the row exactly as it was (no half-restore)', refused === 'spec_ref_changed_since' && r2.spec_point === '129' && r2.blocks[0].specPoint === '128', String(refused))
  await db.query(`update worksheets set spec_point = '128' where id = $1`, [W('01')])
  check('undo a scheme topic', (await one(db, `select spec_ref_set_applied('scheme_topics', '20000000-0000-0000-0000-000000000001', false) n`))[0].n === 1 && (await one(db, `select topic_ref from scheme_topics where id='20000000-0000-0000-0000-000000000001'`))[0].topic_ref === '1')
  check('undo a diagram', (await one(db, `select spec_ref_set_applied('diagrams', '30000000-0000-0000-0000-000000000001', false) n`))[0].n === 1 && JSON.stringify((await one(db, `select spec_points from diagrams where id='30000000-0000-0000-0000-000000000001'`))[0].spec_points) === JSON.stringify(['5.5', 'Edexcel-9PH0-5.5']))
  denied = false
  try { await db.query(`select spec_ref_set_applied('profiles', $1, false)`, [P1]) } catch { denied = true }
  check('undo refuses other tables', denied)
  denied = false
  try { await as(db, null); await db.query(`select spec_ref_set_applied('worksheets', $1, false)`, [W('01')]) } catch { denied = true }
  check('undo refuses when not signed in', denied)

  // ── admin sees and resolves flags ─────────────────────────────────────────────────────────
  await as(db, P2)
  check('admin sees every flag', (await one(db, `select count(*)::int n from spec_ref_flags`))[0].n === 1)
  await db.query(`update spec_ref_flags set status='resolved', resolved_at=now(), resolved_by=$1`, [P2])
  check('admin can resolve a flag', (await one(db, `select status from spec_ref_flags`))[0].status === 'resolved')

  // ── full rollback ─────────────────────────────────────────────────────────────────────────
  await as(db, null)
  // leave the scheme topic / diagram undone (restored by the teacher) and the rest migrated
  await db.query(`delete from spec_ref_flags`)
  await db.exec(dn27)
  check('027 rollback removes notice switch, function, acks', (await one(db, `select count(*)::int n from app_config`))[0].n === 0
    && (await one(db, `select to_regproc('public.spec_ref_set_applied(text,uuid,boolean)') is null as gone`))[0].gone
    && (await one(db, `select to_regclass('public.spec_ref_acks') is null as gone`))[0].gone
    && (await one(db, `select to_regclass('public.spec_ref_flags') is null as gone`))[0].gone)
  await db.exec(dn26)
  const norm = s => { const o = JSON.parse(s); o.ws.forEach(r => { r.u = undefined }); return JSON.stringify(o) }
  check('026 rollback restores every value exactly (incl. rows the teacher undid)', norm(await snap(db)) === norm(before))
  check('bookkeeping tables gone', (await one(db, `select to_regclass('public.spec_ref_migration_log') is null and to_regclass('public.spec_ref_map') is null as gone`))[0].gone)
  await db.exec(up26); await db.exec(up27)
  check('both migrations apply cleanly again after rolling back', (await one(db, `select spec_point from worksheets where id=$1`, [W('01')]))[0].spec_point === '128')
}

// A flag that must survive: 027 rollback keeps feedback
{
  const db = await makeDb({ withTrigger: false })
  await db.exec(up26); await db.exec(up27)
  await db.query(`insert into spec_ref_flags (profile_id, kind, message) values ($1,'other','keep me')`, [P1])
  await db.exec(dn27)
  check('027 rollback keeps flags that have content', (await one(db, `select count(*)::int n from spec_ref_flags`))[0].n === 1)
}
console.log(ok ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED')
process.exit(ok ? 0 : 1)
