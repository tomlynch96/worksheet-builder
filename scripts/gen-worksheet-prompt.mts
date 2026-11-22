// Builds the "write a worksheet JSON" prompt for any Claude chat from the
// hand-written guide plus the site's own curriculum taxonomy, so spec refs in
// the prompt always match src/data. Re-run after changing the specs or the guide.
//
//   npx tsx scripts/gen-worksheet-prompt.mts
//       → docs/worksheet-json-prompt.md (every course and board)
//   npx tsx scripts/gen-worksheet-prompt.mts --course gcse-physics --board AQA
//       → docs/worksheet-json-prompt.gcse-physics.AQA.md (one course, much shorter)
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { QUALIFICATION_OFFERINGS, getSpecTopics } from '../src/data/qualifications'

const root = resolve(import.meta.dirname, '..')
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > -1 ? process.argv[i + 1] : undefined
}
const onlyCourse = arg('course')
const onlyBoard = arg('board')

const offerings = QUALIFICATION_OFFERINGS.filter(q => !onlyCourse || q.id === onlyCourse)
if (!offerings.length) throw new Error(`Unknown course "${onlyCourse}". Courses: ${QUALIFICATION_OFFERINGS.map(q => q.id).join(', ')}`)

const sections: string[] = []

sections.push('### Courses\n\n| Course id (`qualification`) | Course | Exam boards (`examBoard`) |\n|---|---|---|')
for (const q of offerings) {
  const boards = q.examBoards.filter(b => (!onlyBoard || b === onlyBoard) && getSpecTopics(q.id, b))
  if (boards.length) sections[0] += `\n| \`${q.id}\` | ${q.label} | ${boards.join(', ')} |`
}

let points = 0
for (const q of offerings) {
  for (const board of q.examBoards) {
    if (onlyBoard && board !== onlyBoard) continue
    const topics = getSpecTopics(q.id, board)
    if (!topics) continue
    const lines = [`### ${q.label} — ${board}\n\n\`"qualification": "${q.id}", "examBoard": "${board}"\`\n`]
    for (const topic of topics) {
      lines.push(`\n**${topic.ref} ${topic.title}**`)
      for (const p of topic.points) {
        lines.push(`- \`${p.ref}\` ${p.title}`)
        points++
      }
    }
    sections.push(lines.join('\n'))
  }
}
if (!points) throw new Error(`No spec data for course "${onlyCourse}" with board "${onlyBoard}"`)

const template = readFileSync(join(root, 'docs/worksheet-json-prompt.template.md'), 'utf8')
if (!template.includes('<!-- TAXONOMY -->')) throw new Error('Template is missing the <!-- TAXONOMY --> marker')
const out = template.replace('<!-- TAXONOMY -->', sections.join('\n\n'))

const file = onlyCourse
  ? `docs/worksheet-json-prompt.${onlyCourse}${onlyBoard ? `.${onlyBoard}` : ''}.md`
  : 'docs/worksheet-json-prompt.md'
writeFileSync(join(root, file), out)
console.log(`Wrote ${file}: ${points} spec points, ${Math.round(out.length / 1024)} KB`)
