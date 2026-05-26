import type { VercelRequest, VercelResponse } from '@vercel/node'

const OAK_BASE = 'https://open-api.thenational.academy'

const TARGET_KEY_STAGE: Record<string, string> = {
  science: 'ks3',
  physics: 'ks4',
}

// Subject slug as used in the Oak data model (subjectSlug field)
const SUBJECT_SLUG: Record<string, string> = {
  science: 'science',
  physics: 'physics',
}

async function oakGet(path: string, apiKey: string): Promise<{ ok: boolean; status: number; body: string; json?: unknown }> {
  const url = `${OAK_BASE}${path}`
  let res: Response
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    })
  } catch (e) {
    return { ok: false, status: 0, body: String(e) }
  }
  const body = await res.text()
  let json: unknown
  try { json = JSON.parse(body) } catch { /* not JSON */ }
  return { ok: res.ok, status: res.status, body, json }
}

// Try to find the correct sequence slug by:
// 1. Fetching the curriculum list endpoint
// 2. Trying known slug patterns
async function fetchOakSubject(subject: string, apiKey: string) {
  const attempts: string[] = []

  // Step 1: try to discover available sequences
  const discovery = await oakGet('/api/v0/curriculum', apiKey)
  if (discovery.ok && Array.isArray(discovery.json)) {
    // Response is a list of sequences — find the right one
    const sequences = discovery.json as Array<{ sequenceSlug: string; subjectSlug?: string; keyStageSlug?: string }>
    const subjectSlug = SUBJECT_SLUG[subject]
    const targetKs = TARGET_KEY_STAGE[subject]

    const match = sequences.find(s =>
      (s.subjectSlug === subjectSlug || s.sequenceSlug?.includes(subjectSlug)) &&
      (!s.keyStageSlug || s.keyStageSlug === targetKs || s.sequenceSlug?.includes(targetKs))
    )
    if (match) {
      const r = await oakGet(`/api/v0/curriculum/${match.sequenceSlug}`, apiKey)
      if (r.ok && r.json) return r.json
    }
  }
  if (discovery.ok && discovery.json && !Array.isArray(discovery.json)) {
    // Might be a single object with subject data if we passed right params — unlikely but record it
    attempts.push(`/api/v0/curriculum → ${discovery.status}: ${discovery.body.slice(0, 120)}`)
  }

  // Step 2: try slug patterns systematically
  const slugCandidates = [
    `${subject}-secondary`,
    `secondary-${subject}`,
    subject,
    `${subject}-ks3`,
    `${subject}-ks4`,
    `ks3-${subject}`,
    `ks4-${subject}`,
  ]

  const pathPrefixes = ['/api/v0/curriculum/', '/api/v0/subjects/']

  for (const prefix of pathPrefixes) {
    for (const slug of slugCandidates) {
      const path = `${prefix}${slug}`
      const r = await oakGet(path, apiKey)
      attempts.push(`${r.status} ${OAK_BASE}${path}: ${r.body.slice(0, 100)}`)
      if (r.ok && r.json) return r.json
      if (r.status === 0) break // network failure — stop
    }
  }

  throw new Error(
    `Could not find Oak API endpoint for "${subject}".\n` +
    `Discovery result: ${discovery.status} — ${discovery.body.slice(0, 200)}\n` +
    `Tried slugs:\n${attempts.join('\n')}`
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  // Diagnostic probe: /api/oak?probe=/api/v0/some/path
  // Returns the raw Oak API response for a given path — for endpoint discovery only
  if (req.query.probe) {
    const apiKey = process.env.OAK_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'OAK_API_KEY not configured' })
    const r = await oakGet(req.query.probe as string, apiKey)
    return res.status(200).json({ status: r.status, body: r.body.slice(0, 2000) })
  }

  const subject = req.query.subject as string
  if (!subject || !TARGET_KEY_STAGE[subject]) {
    return res.status(400).json({ error: 'subject must be "science" or "physics"' })
  }

  const apiKey = process.env.OAK_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'OAK_API_KEY not configured on the server' })

  try {
    const raw = await fetchOakSubject(subject, apiKey)
    const targetKs = TARGET_KEY_STAGE[subject]

    const lessons = (raw.lessons ?? [])
      .filter((l: { keyStageSlug: string; restricted?: boolean }) =>
        l.keyStageSlug === targetKs && !l.restricted
      )
      .map((l: {
        lessonSlug: string; lessonTitle: string; unitSlug: string; unitTitle: string
        keyStageSlug: string; pupilLessonOutcome: string
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
        keyLearningPoints: (l.keyLearningPoints ?? []).map(k => k.keyLearningPoint),
        keywords: l.lessonKeywords ?? [],
        misconceptions: l.misconceptionsAndCommonMistakes ?? [],
      }))

    const lessonSlugsInResult = new Set(lessons.map((l: { lessonSlug: string }) => l.lessonSlug))
    const units = (raw.sequence ?? [])
      .filter((u: { keyStageSlug: string }) => u.keyStageSlug === targetKs)
      .map((u: {
        unitSlug: string; unitTitle: string; yearSlug: string; keyStageSlug: string
        unitLessons: Array<{ lessonSlug: string; lessonTitle: string; state: string }>
      }) => ({
        unitSlug: u.unitSlug,
        unitTitle: u.unitTitle,
        yearSlug: u.yearSlug,
        keyStageSlug: u.keyStageSlug,
        lessons: (u.unitLessons ?? [])
          .filter(ul => ul.state === 'published' && lessonSlugsInResult.has(ul.lessonSlug))
          .map(ul => ({ lessonSlug: ul.lessonSlug, lessonTitle: ul.lessonTitle })),
      }))
      .filter((u: { lessons: unknown[] }) => u.lessons.length > 0)

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
    return res.status(200).json({ units, lessons })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return res.status(502).json({ error: message })
  }
}
