import type { VercelRequest, VercelResponse } from '@vercel/node'

const OAK_BASE = 'https://open-api.thenational.academy/api/v0'

async function oakFetch(path: string, apiKey: string) {
  const res = await fetch(`${OAK_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
  })
  if (!res.ok) {
    const text = await res.text()
    // Treat "not found" as empty rather than an error (search returns 404 for no results)
    try {
      const j = JSON.parse(text)
      if (j.code === 'NOT_FOUND') return []
    } catch { /* not JSON */ }
    throw new Error(`Oak API ${res.status} at ${path}: ${text.slice(0, 300)}`)
  }
  return res.json()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OAK_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'OAK_API_KEY not configured on the server' })

  // ── Mode 1: search lessons by keyword ─────────────────────────────────────
  // GET /api/oak?search={term}&ks=ks3|ks4
  if (req.query.search !== undefined) {
    const term = (req.query.search as string).trim()
    const ks = (req.query.ks as string) || 'ks3'

    if (!term) return res.status(200).json({ lessons: [] })

    try {
      const params = new URLSearchParams({ q: term, keyStage: ks, subject: 'science' })
      const data = await oakFetch(`/search/lessons?${params}`, apiKey)
      const lessons = (Array.isArray(data) ? data : []).map(
        (l: { lessonSlug: string; lessonTitle: string }) => ({
          lessonSlug: l.lessonSlug,
          lessonTitle: l.lessonTitle,
        })
      )
      return res.status(200).json({ lessons })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return res.status(502).json({ error: message })
    }
  }

  // ── Mode 2: units list for a key stage ────────────────────────────────────
  // GET /api/oak?units&ks=ks3|ks4
  if (req.query.units !== undefined) {
    const ks = (req.query.ks as string) || 'ks3'
    try {
      const unitParams = new URLSearchParams()
      if (req.query.examBoard) unitParams.set('examBoard', (req.query.examBoard as string).toLowerCase())
      if (req.query.childSubject) unitParams.set('childSubject', req.query.childSubject as string)
      const unitQs = unitParams.toString() ? `?${unitParams}` : ''
      const data = await oakFetch(`/key-stages/${ks}/subject/science/units${unitQs}`, apiKey)
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
      return res.status(200).json({ units: Array.isArray(data) ? data : [] })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return res.status(502).json({ error: message })
    }
  }

  // ── Mode 3: unit summary (title, description, lessons list) ───────────────
  // GET /api/oak?unit={slug}[&examBoard=aqa][&childSubject=physics]
  if (req.query.unit) {
    const slug = req.query.unit as string
    try {
      const params = new URLSearchParams()
      if (req.query.examBoard) params.set('examBoard', req.query.examBoard as string)
      if (req.query.childSubject) params.set('childSubject', req.query.childSubject as string)
      if (req.query.tier) params.set('tier', req.query.tier as string)
      const qs = params.toString() ? `?${params}` : ''
      const data = await oakFetch(`/units/${slug}/summary${qs}`, apiKey)
      return res.status(200).json(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return res.status(502).json({ error: message })
    }
  }

  // ── Mode 4: lesson detail (summary + quiz) ─────────────────────────────────
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

  return res.status(400).json({ error: 'Provide ?search= or ?lesson= parameter' })
}
