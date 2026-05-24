import { createContext, useContext } from 'react'
import { useProfile } from '../hooks/useProfile'
import type { Profile, UserCourse } from '../types/profile'

interface ProfileContextValue {
  profile: Profile | null
  loading: boolean
  authUserId: string | null
  sendMagicLink: (email: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  createProfile: (name: string, courses: Omit<UserCourse, 'id' | 'profile_id'>[]) => Promise<boolean>
  updateProfile: (name: string, courses: Omit<UserCourse, 'id' | 'profile_id'>[], teachingPhilosophy?: string) => Promise<boolean>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const value = useProfile()
  return <ProfileContext value={value}>{children}</ProfileContext>
}

export function useProfileContext(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfileContext must be used within ProfileProvider')
  return ctx
}
