export interface UserCourse {
  id?: string
  profile_id?: string
  qualification_id: string
  exam_board: string
}

export interface Profile {
  id: string
  name: string
  created_at: string
  teaching_philosophy?: string
  is_admin?: boolean
  user_courses: UserCourse[]
}
