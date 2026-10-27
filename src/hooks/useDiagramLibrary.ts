import { useCallback, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import type { DiagramVariable, LibraryDiagram } from '../types/diagram'

export interface DiagramSearch {
  text?: string
  specPoint?: string
  topic?: string
}

export interface NewLibraryDiagram {
  title: string
  description: string
  template: string
  variables: DiagramVariable[]
  specPoints: string[]
  topics: string[]
  examBoard?: string
  qualification?: string
  prompts: string[]
  parentId?: string
}

// PostgREST .or() filters are comma/paren delimited — keep user text out of the syntax
const clean = (s: string) => s.replace(/[,()%*\\"]/g, ' ').trim()

export function useDiagramLibrary(profileId?: string) {
  const [results, setResults] = useState<LibraryDiagram[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async ({ text, specPoint, topic }: DiagramSearch) => {
    if (!isConfigured) return
    setLoading(true)
    setError(null)
    let q = supabase.from('diagrams').select('*').order('use_count', { ascending: false }).limit(30)
    if (specPoint) q = q.contains('spec_points', [specPoint])
    if (topic) q = q.contains('topics', [topic])
    const t = text ? clean(text) : ''
    if (t) q = q.or(`title.ilike.%${t}%,description.ilike.%${t}%`)
    const { data, error: err } = await q
    if (err) setError(err.message)
    setResults((data as LibraryDiagram[]) ?? [])
    setLoading(false)
  }, [])

  const save = useCallback(async (d: NewLibraryDiagram): Promise<string | null> => {
    if (!isConfigured || !profileId) return null
    const { data, error: err } = await supabase.from('diagrams').insert({
      profile_id: profileId,
      title: d.title,
      description: d.description,
      svg_template: d.template,
      variables: d.variables,
      spec_points: d.specPoints,
      topics: d.topics,
      exam_board: d.examBoard ?? null,
      qualification: d.qualification ?? null,
      prompts: d.prompts,
      parent_id: d.parentId ?? null,
    }).select('id').single()
    if (err) { console.error('[diagrams] save failed:', err.message); return null }
    return (data as { id: string }).id
  }, [profileId])

  const recordUse = useCallback(async (id: string) => {
    if (!isConfigured) return
    await supabase.rpc('increment_diagram_use', { diagram_id: id })
  }, [])

  return { results, loading, error, search, save, recordUse }
}
