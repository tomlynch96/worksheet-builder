import type { VercelRequest, VercelResponse } from '@vercel/node'

const OAK_BASE = 'https://open-api.thenational.academy/api/v0'

const SUBJECT_KEY_STAGE: Record<string, string> = {
  science: 'ks3',
  physics: 'ks4',
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OAK_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'OAK_API_KEY not configured on the server' })

  // ── Mode 1: lesson list for a subject ──────────────────────────────────────
  // GET /api/oak?subject=science|physics
  if (req.query.subject) {
    const subject = req.query.subject as string
    const ks = SUBJECT_KEY_STAGE[subject]
    if (!ks) return res.status(400).json({ error: 'subject must be "science" or "physics"' })

    try {
      // Use the questions endpoint to get lesson list — strip quiz data server-side
      // so we don't send hundreds of questions to the browser
      const data = await oakFetch(
        `/key-stages/${ks}/subject/${subject}/questions?limit=300`,
        apiKey
      )

      const lessons: Array<{ lessonSlug: string; lessonTitle: string }> = (
        Array.isArray(data) ? data : []
      ).map((l: { lessonSlug: string; lessonTitle: string }) => ({
        lessonSlug: l.lessonSlug,
        lessonTitle: l.lessonTitle,
      }))

      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
      return res.status(200).json({ lessons })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return res.status(502).json({ error: message })
    }
  }

  // ── Mode 2: full lesson detail (summary + quiz) ────────────────────────────
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
