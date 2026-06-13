import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import type { Scheme, SchemeTopic, SchemeTopicWorksheet, RecallCheckin } from '../types/scheme'

export function useSchemes(profileId: string | null) {
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!profileId || !isConfigured) return
    setLoading(true)
    const { data } = await supabase
      .from('schemes')
      .select('*')
      .eq('profile_id', profileId)
      .order('updated_at', { ascending: false })
    if (data) setSchemes(data as Scheme[])
    setLoading(false)
  }, [profileId])

  useEffect(() => { load() }, [load])

  async function create(scheme: Omit<Scheme, 'id' | 'profile_id' | 'created_at' | 'updated_at'>): Promise<Scheme | null> {
    if (!profileId || !isConfigured) return null
    const { data, error } = await supabase
      .from('schemes')
      .insert({ ...scheme, profile_id: profileId })
      .select()
      .single()
    if (error || !data) return null
    const s = data as Scheme
    setSchemes(prev => [s, ...prev])
    return s
  }

  async function rename(id: string, name: string) {
    if (!isConfigured) return
    await supabase.from('schemes').update({ name, updated_at: new Date().toISOString() }).eq('id', id)
    setSchemes(prev => prev.map(s => s.id === id ? { ...s, name } : s))
  }

  async function remove(id: string) {
    if (!isConfigured) return
    await supabase.from('schemes').delete().eq('id', id)
    setSchemes(prev => prev.filter(s => s.id !== id))
  }

  return { schemes, loading, create, rename, remove, reload: load }
}

export function useSchemeDetail(schemeId: string | null) {
  const [topics, setTopics] = useState<SchemeTopic[]>([])
  const [checkins, setCheckins] = useState<RecallCheckin[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!schemeId || !isConfigured) return
    setLoading(true)
    const [topicsRes, checkinsRes] = await Promise.all([
      supabase
        .from('scheme_topics')
        .select('*, scheme_topic_worksheets(*, worksheets(id, title, topic))')
        .eq('scheme_id', schemeId)
        .order('week_number')
        .order('position'),
      supabase
        .from('recall_checkins')
        .select('*')
        .eq('scheme_id', schemeId)
        .order('at_week'),
    ])

    if (topicsRes.data) {
      setTopics((topicsRes.data as unknown[]).map(t => {
        const raw = t as Record<string, unknown>
        const stws = (raw.scheme_topic_worksheets as Record<string, unknown>[] ?? [])
          .sort((a, b) => (a.position as number) - (b.position as number))
        return {
          id: raw.id as string,
          scheme_id: raw.scheme_id as string,
          week_number: raw.week_number as number,
          topic_ref: raw.topic_ref as string | null,
          topic_label: raw.topic_label as string | null,
          position: raw.position as number,
          worksheets: stws.map(sw => {
            const ws = sw.worksheets as Record<string, unknown> | null
            return {
              id: sw.id as string,
              scheme_topic_id: sw.scheme_topic_id as string,
              worksheet_id: sw.worksheet_id as string,
              position: sw.position as number,
              title: ws?.title as string | undefined,
              topic: ws?.topic as string | undefined,
            }
          }),
        } as SchemeTopic
      }))
    }
    if (checkinsRes.data) setCheckins(checkinsRes.data as RecallCheckin[])
    setLoading(false)
  }, [schemeId])

  useEffect(() => { load() }, [load])

  async function upsertTopic(weekNumber: number, topicRef: string | null, topicLabel: string | null, position = 0): Promise<SchemeTopic | null> {
    if (!schemeId || !isConfigured) return null
    const { data, error } = await supabase
      .from('scheme_topics')
      .upsert(
        { scheme_id: schemeId, week_number: weekNumber, topic_ref: topicRef, topic_label: topicLabel, position },
        { onConflict: 'id' }
      )
      .select()
      .single()
    if (error || !data) return null
    const topic = { ...(data as SchemeTopic), worksheets: [] }
    setTopics(prev => {
      const existing = prev.find(t => t.id === topic.id)
      if (existing) return prev.map(t => t.id === topic.id ? { ...t, ...topic } : t)
      return [...prev, topic].sort((a, b) => a.week_number - b.week_number || a.position - b.position)
    })
    return topic
  }

  async function moveTopic(topicId: string, toWeek: number) {
    if (!isConfigured) return
    await supabase.from('scheme_topics').update({ week_number: toWeek }).eq('id', topicId)
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, week_number: toWeek } : t))
  }

  async function removeTopic(topicId: string) {
    if (!isConfigured) return
    await supabase.from('scheme_topics').delete().eq('id', topicId)
    setTopics(prev => prev.filter(t => t.id !== topicId))
  }

  async function addWorksheet(topicId: string, worksheetId: string, title?: string, topic?: string): Promise<SchemeTopicWorksheet | null> {
    if (!isConfigured) return null
    const existingTopic = topics.find(t => t.id === topicId)
    const position = (existingTopic?.worksheets?.length ?? 0)
    const { data, error } = await supabase
      .from('scheme_topic_worksheets')
      .insert({ scheme_topic_id: topicId, worksheet_id: worksheetId, position })
      .select()
      .single()
    if (error || !data) return null
    const stw: SchemeTopicWorksheet = { ...(data as SchemeTopicWorksheet), title, topic }
    setTopics(prev => prev.map(t =>
      t.id === topicId ? { ...t, worksheets: [...(t.worksheets ?? []), stw] } : t
    ))
    return stw
  }

  async function removeWorksheet(topicId: string, stwId: string) {
    if (!isConfigured) return
    await supabase.from('scheme_topic_worksheets').delete().eq('id', stwId)
    setTopics(prev => prev.map(t =>
      t.id === topicId
        ? { ...t, worksheets: (t.worksheets ?? []).filter(w => w.id !== stwId) }
        : t
    ))
  }

  async function reorderWorksheets(topicId: string, worksheets: SchemeTopicWorksheet[]) {
    if (!isConfigured) return
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, worksheets } : t))
    await Promise.all(
      worksheets.map((w, i) => supabase.from('scheme_topic_worksheets').update({ position: i }).eq('id', w.id))
    )
  }

  async function saveCheckin(checkin: Omit<RecallCheckin, 'id' | 'created_at'>): Promise<RecallCheckin | null> {
    if (!isConfigured) return null
    const { data, error } = await supabase
      .from('recall_checkins')
      .insert(checkin)
      .select()
      .single()
    if (error || !data) return null
    const c = data as RecallCheckin
    setCheckins(prev => [...prev, c])
    return c
  }

  return {
    topics, checkins, loading,
    upsertTopic, moveTopic, removeTopic,
    addWorksheet, removeWorksheet, reorderWorksheets,
    saveCheckin,
    reload: load,
  }
}
