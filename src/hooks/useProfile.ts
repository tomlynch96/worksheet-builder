import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import type { Profile, UserCourse } from '../types/profile'

const PROFILE_ID_KEY = 'worksheet-builder-profile-id'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }
    const id = localStorage.getItem(PROFILE_ID_KEY)
    if (!id) { setLoading(false); return }

    supabase
      .from('profiles')
      .select('*, user_courses(*)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setProfile(data as Profile)
        else localStorage.removeItem(PROFILE_ID_KEY)
        setLoading(false)
      })
  }, [])

  async function createProfile(name: string, courses: Omit<UserCourse, 'id' | 'profile_id'>[]) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ name })
      .select()
      .single()

    if (error || !data) return false

    localStorage.setItem(PROFILE_ID_KEY, data.id)

    if (courses.length > 0) {
      await supabase
        .from('user_courses')
        .insert(courses.map(c => ({ ...c, profile_id: data.id })))
    }

    setProfile({
      ...data,
      user_courses: courses.map((c, i) => ({ ...c, id: String(i), profile_id: data.id })),
    })
    return true
  }

  async function updateProfile(name: string, courses: Omit<UserCourse, 'id' | 'profile_id'>[]) {
    if (!profile) return false
    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', profile.id)
    if (error) return false

    await supabase.from('user_courses').delete().eq('profile_id', profile.id)
    if (courses.length > 0) {
      await supabase
        .from('user_courses')
        .insert(courses.map(c => ({ ...c, profile_id: profile.id })))
    }
    setProfile(p =>
      p ? { ...p, name, user_courses: courses.map((c, i) => ({ ...c, id: String(i), profile_id: p.id })) } : p
    )
    return true
  }

  return { profile, loading, createProfile, updateProfile }
}
