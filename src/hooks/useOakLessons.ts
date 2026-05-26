import { useState, useEffect } from 'react'
import type { OakSubject, OakLessonSummary, OakLessonDetail } from '../types/oak'

const listCache = new Map<OakSubject, OakLessonSummary[]>()
const detailCache = new Map<string, OakLessonDetail>()

export function useOakLessons(subject: OakSubject | null) {
  const [lessons, setLessons] = useState<OakLessonSummary[]>(
    subject ? (listCache.get(subject) ?? []) : []
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!subject) return
    if (listCache.has(subject)) { setLessons(listCache.get(subject)!); return }
    setLoading(true)
    setError(null)
    fetch(`/api/oak?subject=${subject}`)
      .then(r => r.ok ? r.json() : r.json().then(j => Promise.reject(j.error ?? `HTTP ${r.status}`)))
      .then((d: { lessons: OakLessonSummary[] }) => {
        listCache.set(subject, d.lessons)
        setLessons(d.lessons)
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [subject])

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
