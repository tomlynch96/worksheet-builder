import type { VercelRequest, VercelResponse } from '@vercel/node'

const OAK_BASE = 'https://open-api.thenational.academy/api/v0'

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

// The key-stages endpoint only accepts top-level subject slugs ('science', not 'physics').
// For KS4 Physics we try the sequences endpoint, with a fallback to KS4 science overall.
async function fetchLessonList(subject: string, apiKey: string): Promise<Array<{ lessonSlug: string; lessonTitle: string }>> {
  let data: unknown

  if (subject === 'physics') {
    // Try sequence endpoint for physics secondary first
    try {
      data = await oakFetch('/sequences/physics-secondary/questions?limit=300', apiKey)
    } catch {
      // Fallback: all KS4 science (includes physics, biology, chemistry)
      data = await oakFetch('/key-stages/ks4/subject/science/questions?limit=300', apiKey)
    }
  } else {
    // KS3 science — key-stages endpoint works fine
    data = await oakFetch('/key-stages/ks3/subject/science/questions?limit=300', apiKey)
  }

  return (Array.isArray(data) ? data : []).map((l: { lessonSlug: string; lessonTitle: string }) => ({
    lessonSlug: l.lessonSlug,
    lessonTitle: l.lessonTitle,
  }))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OAK_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'OAK_API_KEY not configured on the server' })

  // ── Mode 1: lesson list for a subject ──────────────────────────────────────
  // GET /api/oak?subject=science|physics
  if (req.query.subject) {
    const subject = req.query.subject as string
    if (subject !== 'science' && subject !== 'physics') {
      return res.status(400).json({ error: 'subject must be "science" or "physics"' })
    }

    try {
      const lessons = await fetchLessonList(subject, apiKey)
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
