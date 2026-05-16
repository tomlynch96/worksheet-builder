import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import type { Profile, UserCourse } from '../types/profile'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authUserId, setAuthUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUserId(session.user.id)
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUserId(session.user.id)
        loadProfile(session.user.id)
      } else {
        setAuthUserId(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, user_courses(*)')
      .eq('id', id)
      .maybeSingle()

    if (error) console.error('[loadProfile] error:', error.code, error.message, error.details)
    if (!error && data) setProfile(data as Profile)
    else console.warn('[loadProfile] no profile found for', id)
    setLoading(false)
  }

  async function sendMagicLink(email: string): Promise<{ error?: string }> {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'https://worksheet-builder-ten.vercel.app' },
    })
    return error ? { error: error.message } : {}
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function createProfile(name: string, courses: Omit<UserCourse, 'id' | 'profile_id'>[]) {
    if (!authUserId) return false

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: authUserId, name })
      .select()
      .single()

    if (error || !data) return false

    if (courses.length > 0) {
      await supabase.from('user_courses').delete().eq('profile_id', authUserId)
      await supabase
        .from('user_courses')
        .insert(courses.map(c => ({ ...c, profile_id: authUserId })))
    }

    setProfile({
      ...data,
      user_courses: courses.map((c, i) => ({ ...c, id: String(i), profile_id: authUserId })),
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

  return { profile, loading, authUserId, sendMagicLink, signOut, createProfile, updateProfile }
}
