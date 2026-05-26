import { useState, useEffect } from 'react'
import type { OakSubject, OakSubjectData } from '../types/oak'

const cache = new Map<OakSubject, OakSubjectData>()

export function useOakLessons(subject: OakSubject | null) {
  const [data, setData] = useState<OakSubjectData | null>(
    subject ? (cache.get(subject) ?? null) : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!subject) return
    if (cache.has(subject)) {
      setData(cache.get(subject)!)
      return
    }
    setLoading(true)
    setError(null)
    fetch(`/api/oak?subject=${subject}`)
      .then(res => {
        if (!res.ok) return res.json().then(j => Promise.reject(j.error ?? `HTTP ${res.status}`))
        return res.json()
      })
      .then((d: OakSubjectData) => {
        cache.set(subject, d)
        setData(d)
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [subject])

  return { data, loading, error }
}
