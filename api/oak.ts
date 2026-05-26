import type { VercelRequest, VercelResponse } from '@vercel/node'

const OAK_BASE = 'https://open-api.thenational.academy/api/v0'

// Map our exam board strings to Oak slugs
const EXAM_BOARD_SLUG: Record<string, string> = {
  AQA: 'aqa', OCR: 'ocr', Edexcel: 'edexcel', WJEC: 'wjec', Eduqas: 'eduqas',
}

async function oakFetch(path: string, apiKey: string) {
  const res = await fetch(`${OAK_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Oak API ${res.status} at ${path}: ${text.slice(0, 300)}`)
  }
  return res.json()
}

async function fetchAllLessons(
  path: string,
  apiKey: string
): Promise<Array<{ lessonSlug: string; lessonTitle: string }>> {
  const PAGE = 100
  const results: Array<{ lessonSlug: string; lessonTitle: string }> = []
  let offset = 0

  for (let page = 0; page < 10; page++) {
    const sep = path.includes('?') ? '&' : '?'
    const data = await oakFetch(`${path}${sep}limit=${PAGE}&offset=${offset}`, apiKey)
    const batch = Array.isArray(data) ? data : []
    for (const l of batch as Array<{ lessonSlug: string; lessonTitle: string }>) {
      results.push({ lessonSlug: l.lessonSlug, lessonTitle: l.lessonTitle })
    }
    if (batch.length < PAGE) break
    offset += PAGE
  }

  return results
}

// Try multiple sequence slug patterns in order, return first that yields lessons.
async function trySequenceSlugs(slugs: string[], apiKey: string) {
  for (const slug of slugs) {
    try {
      const lessons = await fetchAllLessons(`/sequences/${slug}/questions`, apiKey)
      if (lessons.length > 0) return lessons
    } catch {
      // 404 / 400 — try next
    }
  }
  return []
}

async function fetchLessonList(
  subject: string,
  examBoard: string | undefined,
  apiKey: string
): Promise<Array<{ lessonSlug: string; lessonTitle: string }>> {

  if (subject === 'science') {
    // KS3 Science — key-stages endpoint works
    return fetchAllLessons('/key-stages/ks3/subject/science/questions', apiKey)
  }

  // KS4 Physics — must use the sequences endpoint.
  // Oak sequence slugs for KS4 science include the exam-board suffix.
  // e.g. science-secondary-aqa, science-secondary-ocr, science-secondary-edexcel
  const ebSlug = examBoard ? EXAM_BOARD_SLUG[examBoard] : undefined

  const slugCandidates = [
    // Exam-board specific (most precise)
    ...(ebSlug ? [
      `science-secondary-${ebSlug}`,
      `physics-secondary-${ebSlug}`,
    ] : []),
    // Generic secondary science (all exam boards combined)
    'science-secondary',
    'physics-secondary',
    // Combined science fallback
    ...(ebSlug ? [`combined-science-secondary-${ebSlug}`] : []),
    'combined-science-secondary',
  ]

  return trySequenceSlugs(slugCandidates, apiKey)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OAK_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'OAK_API_KEY not configured on the server' })

  // ── Mode 1: lesson list ────────────────────────────────────────────────────
  // GET /api/oak?subject=science|physics[&examBoard=AQA]
  if (req.query.subject) {
    const subject = req.query.subject as string
    if (subject !== 'science' && subject !== 'physics') {
      return res.status(400).json({ error: 'subject must be "science" or "physics"' })
    }
    const examBoard = req.query.examBoard as string | undefined

    try {
      const lessons = await fetchLessonList(subject, examBoard, apiKey)
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
      return res.status(200).json({ lessons })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return res.status(502).json({ error: message })
    }
  }

  // ── Mode 2: lesson detail (summary + quiz) ─────────────────────────────────
  // GET /api/oak?lesson={slug}
  if (req.query.lesson) {
    const slug = req.query.lesson as string
    try {
      const [summary, quiz] = await Promise.all([
        oakFetch(`/lessons/${slug}/summary`, apiKey),
        oakFetch(`/lessons/${slug}/quiz`, apiKey),
      ])

      return res.status(200).json({
        lessonSlug: slug,
        lessonTitle: summary.lessonTitle ?? '',
        unitTitle: summary.units?.[0]?.unitTitle ?? undefined,
        keyStageSlug: summary.keyStageSlug ?? '',
        pupilLessonOutcome: summary.pupilLessonOutcome ?? '',
        keyLearningPoints: (summary.keyLearningPoints ?? []).map(
          (k: { keyLearningPoint: string }) => k.keyLearningPoint
        ),
        keywords: summary.lessonKeywords ?? [],
        misconceptions: summary.misconceptionsAndCommonMistakes ?? [],
        starterQuiz: quiz.starterQuiz ?? [],
        exitQuiz: quiz.exitQuiz ?? [],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return res.status(502).json({ error: message })
    }
  }

  return res.status(400).json({ error: 'Provide ?subject= or ?lesson= parameter' })
}
