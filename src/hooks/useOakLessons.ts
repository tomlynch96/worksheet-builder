import { useState, useEffect } from 'react'
import type { OakSubject, OakLessonSummary, OakLessonDetail } from '../types/oak'

const listCache = new Map<string, OakLessonSummary[]>()
const detailCache = new Map<string, OakLessonDetail>()

export function useOakLessons(subject: OakSubject | null, examBoard?: string) {
  const cacheKey = `${subject}:${examBoard ?? ''}`
  const [lessons, setLessons] = useState<OakLessonSummary[]>(listCache.get(cacheKey) ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!subject) return
    if (listCache.has(cacheKey)) { setLessons(listCache.get(cacheKey)!); return }
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ subject })
    if (examBoard) params.set('examBoard', examBoard)
    fetch(`/api/oak?${params}`)
      .then(r => r.ok ? r.json() : r.json().then((j: { error?: string }) => Promise.reject(j.error ?? `HTTP ${r.status}`)))
      .then((d: { lessons: OakLessonSummary[] }) => {
        listCache.set(cacheKey, d.lessons)
        setLessons(d.lessons)
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [cacheKey, subject, examBoard])

  return { lessons, loading, error }
}

export async function fetchOakLesson(slug: string): Promise<OakLessonDetail> {
  if (detailCache.has(slug)) return detailCache.get(slug)!
  const res = await fetch(`/api/oak?lesson=${encodeURIComponent(slug)}`)
  if (!res.ok) {
    const j = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(j.error ?? `HTTP ${res.status}`)
  }
  const detail = await res.json() as OakLessonDetail
  detailCache.set(slug, detail)
  return detail
}
