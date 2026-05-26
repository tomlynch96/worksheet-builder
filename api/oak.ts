import type { VercelRequest, VercelResponse } from '@vercel/node'

const OAK_BASE = 'https://open-api.thenational.academy'

// Sequence slug candidates to try, in order, for each subject
const SEQUENCE_SLUGS: Record<string, string[]> = {
  science: ['science-secondary', 'science'],
  physics: ['physics-secondary', 'physics'],
}

// The key stage we want for each subject
const TARGET_KEY_STAGE: Record<string, string> = {
  science: 'ks3',
  physics: 'ks4',
}

async function fetchOakSubject(subject: string, apiKey: string) {
  const slugs = SEQUENCE_SLUGS[subject]
  if (!slugs) throw new Error(`Unknown subject: ${subject}`)

  let lastError: Error | null = null
  for (const slug of slugs) {
    const res = await fetch(`${OAK_BASE}/api/v0/curriculum/${slug}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })
    if (res.status === 404) continue
    if (!res.ok) {
      const text = await res.text()
      lastError = new Error(`Oak API ${res.status}: ${text.slice(0, 200)}`)
      continue
    }
    return await res.json()
  }
  throw lastError ?? new Error(`No valid Oak endpoint found for subject: ${subject}`)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const subject = req.query.subject as string
  if (!subject || !SEQUENCE_SLUGS[subject]) {
    return res.status(400).json({ error: 'subject must be "science" or "physics"' })
  }

  const apiKey = process.env.OAK_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OAK_API_KEY not configured' })
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

    // Build unit list, filtering to target key stage and only published lessons
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
