// Checks scripts/spec-ref-map-alevel.json against the OLD spec data (read from git)
// and the CURRENT spec data. Run: npx tsx scripts/validate-spec-ref-map.mts
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const OLD_REV = '7635d35' // last commit before the A Level specs were rebuilt
const root = resolve(import.meta.dirname, '..')
const map = JSON.parse(readFileSync(join(root, 'scripts/spec-ref-map-alevel.json'), 'utf8')) as {
  points: Record<string, Record<string, string | null>>
  topics: Record<string, Record<string, string | null>>
}

const tmp = mkdtempSync(join(tmpdir(), 'oldspecs-'))
writeFileSync(join(tmp, 'old_specs.ts'), execSync(`git show ${OLD_REV}:src/data/specs.ts`, { cwd: root, encoding: 'utf8' }))
const oldMod = await import(pathToFileURL(join(tmp, 'old_specs.ts')).href)
const newMod = await import(pathToFileURL(join(root, 'src/data/specs.ts')).href)

const ids: Record<string, string> = { AQA: 'aqa-alevel-physics', OCR: 'ocr-alevel-physics', Edexcel: 'edexcel-alevel-physics', WJEC: 'wjec-alevel-physics' }
const find = (mod: any, id: string) => mod.QUALIFICATIONS.find((q: any) => q.id === id)
let problems = 0
const bad = (msg: string) => { problems++; console.log('PROBLEM:', msg) }

for (const [board, id] of Object.entries(ids)) {
  const oq = find(oldMod, id), nq = find(newMod, id)
  const oldPoints = new Set<string>(oq.topics.flatMap((t: any) => t.points.map((p: any) => p.ref)))
  const oldTopics = new Set<string>(oq.topics.map((t: any) => t.ref))
  const newPoints = new Set<string>(nq.topics.flatMap((t: any) => t.points.map((p: any) => p.ref)))
  const newTopics = new Set<string>(nq.topics.map((t: any) => t.ref))
  const pm = map.points[board] ?? {}, tm = map.topics[board] ?? {}

  for (const r of oldPoints) if (!(r in pm)) bad(`${board}: old point ${r} has no mapping entry`)
  for (const r of Object.keys(pm)) if (!oldPoints.has(r)) bad(`${board}: mapping has ${r}, which is not an old point`)
  for (const [o, n] of Object.entries(pm)) if (n !== null && !newPoints.has(n)) bad(`${board}: ${o} -> ${n}, which is not a current point`)
  // Re-running the migration must be a no-op: no old ref may equal a current ref
  for (const r of oldPoints) if (newPoints.has(r)) bad(`${board}: old point ref ${r} also exists in the new data (re-run would be ambiguous)`)

  for (const [o, n] of Object.entries(tm)) {
    if (!oldTopics.has(o)) bad(`${board}: mapping has topic ${o}, which is not an old topic`)
    if (n !== null && !newTopics.has(n)) bad(`${board}: topic ${o} -> ${n}, which is not a current topic`)
    if (newTopics.has(o)) bad(`${board}: old topic ref ${o} also exists in the new data`)
  }
  // Old topics with no entry must keep a ref that still means the same thing in the new data
  for (const r of oldTopics) if (!(r in tm) && !newTopics.has(r)) bad(`${board}: old topic ${r} unmapped and no longer exists`)

  const unmapped = Object.entries(pm).filter(([, n]) => n === null).map(([o]) => o)
  console.log(`${board.padEnd(8)} points mapped ${Object.keys(pm).length - unmapped.length}/${oldPoints.size}` +
    (unmapped.length ? ` | no equivalent in new spec: ${unmapped.join(', ')}` : '') +
    ` | topics remapped ${Object.values(tm).filter(Boolean).length}, cleared ${Object.values(tm).filter(v => v === null).length}`)
}
console.log(problems ? `\n${problems} problem(s)` : '\nMapping is consistent with old and new data.')
process.exit(problems ? 1 : 0)
