import { useState, useEffect } from 'react'
import type { OakLessonSummary, OakLessonDetail } from '../types/oak'

const detailCache = new Map<string, OakLessonDetail>()

// ks: 'ks3' for KS3 Science, 'ks4' for KS4 Physics
export function useOakSearch(query: string, ks: string) {
  const [lessons, setLessons] = useState<OakLessonSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (!q) { setLessons([]); setLoading(false); return }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ search: q, ks })
        const r = await fetch(`/api/oak?${params}`)
        if (!r.ok) {
          const j = await r.json().catch(() => ({})) as { error?: string }
          throw new Error(j.error ?? `HTTP ${r.status}`)
        }
        const d = await r.json() as { lessons: OakLessonSummary[] }
        setLessons(d.lessons ?? [])
        setError(null)
      } catch (e) {
        setError(String(e))
        setLessons([])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [query, ks])

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
