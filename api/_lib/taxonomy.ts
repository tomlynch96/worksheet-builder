import { TAXONOMY, type Course, type CourseBoard, type SpecPoint, type SpecTopic } from './taxonomy.generated.js'

export type { Course, CourseBoard, SpecPoint, SpecTopic }

export function findCourse(id: string): Course | undefined {
  return TAXONOMY.find(c => c.id === id)
}

export function findBoard(courseId: string, board: string): CourseBoard | undefined {
  return findCourse(courseId)?.boards.find(b => b.board === board)
}

export interface SpecMatch {
  qualification: string
  courseLabel: string
  examBoard: string
  ref: string
  title: string
  kind: 'point' | 'topic'
  topicRef: string
  topicTitle: string
}

// A spec ref is either a point ref (what worksheets are tagged with) or a topic ref
// (what scheme-of-work weeks are tagged with).
export function findSpec(courseId: string, board: string, ref: string): SpecMatch | undefined {
  const course = findCourse(courseId)
  const b = course?.boards.find(x => x.board === board)
  if (!course || !b) return undefined
  for (const t of b.topics) {
    if (t.ref === ref) return match(course, b, t, { ref: t.ref, title: t.title }, 'topic')
    const p = t.points.find(x => x.ref === ref)
    if (p) return match(course, b, t, p, 'point')
  }
  return undefined
}

function match(course: Course, b: CourseBoard, t: SpecTopic, p: SpecPoint, kind: 'point' | 'topic'): SpecMatch {
  return {
    qualification: course.id, courseLabel: course.label, examBoard: b.board,
    ref: p.ref, title: p.title, kind, topicRef: t.ref, topicTitle: t.title,
  }
}

const words = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}.]+/gu, ' ').split(' ').filter(w => w.length > 1)

// Ranked search over spec points (and topics) by words or by ref.
export function searchSpec(query: string, opts: { qualification?: string; examBoard?: string; limit?: number } = {}): SpecMatch[] {
  const q = query.trim()
  const qLower = q.toLowerCase()
  const qWords = words(q)
  const scored: { m: SpecMatch; score: number }[] = []
  for (const course of TAXONOMY) {
    if (opts.qualification && course.id !== opts.qualification) continue
    for (const b of course.boards) {
      if (opts.examBoard && b.board !== opts.examBoard) continue
      for (const t of b.topics) {
        const consider = (p: SpecPoint, kind: 'point' | 'topic') => {
          let score = 0
          const ref = p.ref.toLowerCase()
          if (ref === qLower) score += 100
          else if (qLower && ref.startsWith(qLower)) score += 40
          const hay = `${p.title} ${t.title}`.toLowerCase()
          if (qLower.length > 3 && hay.includes(qLower)) score += 30
          for (const w of qWords) if (hay.includes(w)) score += w.length > 3 ? 6 : 3
          if (kind === 'topic') score -= 2   // prefer the specific point
          if (score > 0) scored.push({ m: match(course, b, t, p, kind), score })
        }
        consider({ ref: t.ref, title: t.title }, 'topic')
        t.points.forEach(p => consider(p, 'point'))
      }
    }
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.limit ?? 15)
    .map(s => s.m)
}
