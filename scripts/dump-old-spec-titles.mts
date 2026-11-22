// One-off: writes scripts/spec-ref-old-titles.json (old ref -> old title) from the spec data
// as it was before the A Level rebuild, so the "what changed" notice can show what a
// retagged worksheet used to be tagged with. Run: npx tsx scripts/dump-old-spec-titles.mts
import { execSync } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const OLD_REV = '7635d35'
const root = resolve(import.meta.dirname, '..')
const tmp = mkdtempSync(join(tmpdir(), 'oldspecs-'))
writeFileSync(join(tmp, 'old_specs.ts'), execSync(`git show ${OLD_REV}:src/data/specs.ts`, { cwd: root, encoding: 'utf8' }))
const mod = await import(pathToFileURL(join(tmp, 'old_specs.ts')).href)
const ids: Record<string, string> = { AQA: 'aqa-alevel-physics', OCR: 'ocr-alevel-physics', Edexcel: 'edexcel-alevel-physics', WJEC: 'wjec-alevel-physics' }
const out: Record<string, { points: Record<string, string>; topics: Record<string, string> }> = {}
for (const [board, id] of Object.entries(ids)) {
  const q = mod.QUALIFICATIONS.find((x: any) => x.id === id)
  out[board] = { points: {}, topics: {} }
  for (const t of q.topics) { out[board].topics[t.ref] = t.title; for (const p of t.points) out[board].points[p.ref] = p.title }
}
writeFileSync(join(root, 'scripts/spec-ref-old-titles.json'), JSON.stringify(out, null, 1))
console.log('wrote', Object.entries(out).map(([b, v]) => `${b}: ${Object.keys(v.points).length} points`).join(', '))
