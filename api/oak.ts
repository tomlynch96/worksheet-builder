import type { VercelRequest, VercelResponse } from '@vercel/node'

const OAK_BASE = 'https://open-api.thenational.academy'

// Candidate URL paths to try in order. We'll return the first successful one.
const ENDPOINT_CANDIDATES = [
  '/api/v0/curriculum/science-secondary',
  '/api/v0/curriculum/science',
  '/api/v1/curriculum/science-secondary',
  '/api/v1/curriculum/science',
  '/curriculum/science-secondary',
  '/curriculum/science',
]

const PHYSICS_CANDIDATES = [
  '/api/v0/curriculum/physics-secondary',
  '/api/v0/curriculum/physics',
  '/api/v1/curriculum/physics-secondary',
  '/api/v1/curriculum/physics',
  '/curriculum/physics-secondary',
  '/curriculum/physics',
]

const SUBJECT_CANDIDATES: Record<string, string[]> = {
  science: ENDPOINT_CANDIDATES,
  physics: PHYSICS_CANDIDATES,
}

// The key stage we want for each subject
const TARGET_KEY_STAGE: Record<string, string> = {
  science: 'ks3',
  physics: 'ks4',
}

interface AttemptResult {
  url: string
  status: number
  body: string
}

async function fetchOakSubject(subject: string, apiKey: string) {
  const candidates = SUBJECT_CANDIDATES[subject]
  if (!candidates) throw new Error(`Unknown subject: ${subject}`)

  const attempts: AttemptResult[] = []

  for (const path of candidates) {
    const url = `${OAK_BASE}${path}`
    let res: Response
    try {
      res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      })
    } catch (networkErr) {
      attempts.push({ url, status: 0, body: String(networkErr) })
      continue
    }

    const body = await res.text()
    attempts.push({ url, status: res.status, body: body.slice(0, 300) })

    if (res.status === 404 || res.status === 405) continue
    if (!res.ok) continue

    try {
      return JSON.parse(body)
    } catch {
      attempts.push({ url, status: res.status, body: 'Response was not valid JSON: ' + body.slice(0, 200) })
      continue
    }
  }

  const summary = attempts.map(a => `  ${a.status} ${a.url}: ${a.body.slice(0, 120)}`).join('\n')
  throw new Error(`Could not find a working Oak API endpoint for "${subject}". Tried:\n${summary}`)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const subject = req.query.subject as string
  if (!subject || !SUBJECT_CANDIDATES[subject]) {
    return res.status(400).json({ error: 'subject must be "science" or "physics"' })
  }

  const apiKey = process.env.OAK_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OAK_API_KEY not configured on the server' })
  }

  try {
    const raw = await fetchOakSubject(subject, apiKey)
    const targetKs = TARGET_KEY_STAGE[subject]

    // Build simplified lesson list
    const lessons = (raw.lessons ?? [])
      .filter((l: { keyStageSlug: string; restricted?: boolean }) =>
        l.keyStageSlug === targetKs && !l.restricted
      )
      .map((l: {
        lessonSlug: string
        lessonTitle: string
        unitSlug: string
        unitTitle: string
        keyStageSlug: string
        pupilLessonOutcome: string
        keyLearningPoints: Array<{ keyLearningPoint: string }>
        lessonKeywords: Array<{ keyword: string; description: string }>
        misconceptionsAndCommonMistakes: Array<{ misconception: string; response: string }>
      }) => ({
        lessonSlug: l.lessonSlug,
        lessonTitle: l.lessonTitle,
        unitSlug: l.unitSlug,
        unitTitle: l.unitTitle,
        keyStageSlug: l.keyStageSlug,
        pupilLessonOutcome: l.pupilLessonOutcome ?? '',
        keyLearningPoints: (l.keyLearningPoints ?? []).map((k) => k.keyLearningPoint),
        keywords: l.lessonKeywords ?? [],
        misconceptions: l.misconceptionsAndCommonMistakes ?? [],
      }))

    // Build unit list filtered to target key stage
    const lessonSlugsInResult = new Set(lessons.map((l: { lessonSlug: string }) => l.lessonSlug))
    const units = (raw.sequence ?? [])
      .filter((u: { keyStageSlug: string }) => u.keyStageSlug === targetKs)
      .map((u: {
        unitSlug: string
        unitTitle: string
        yearSlug: string
        keyStageSlug: string
        unitLessons: Array<{ lessonSlug: string; lessonTitle: string; state: string }>
      }) => ({
        unitSlug: u.unitSlug,
        unitTitle: u.unitTitle,
        yearSlug: u.yearSlug,
        keyStageSlug: u.keyStageSlug,
        lessons: (u.unitLessons ?? [])
          .filter((ul) => ul.state === 'published' && lessonSlugsInResult.has(ul.lessonSlug))
          .map((ul) => ({ lessonSlug: ul.lessonSlug, lessonTitle: ul.lessonTitle })),
      }))
      .filter((u: { lessons: unknown[] }) => u.lessons.length > 0)

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
    return res.status(200).json({ units, lessons })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return res.status(502).json({ error: message })
  }
}
