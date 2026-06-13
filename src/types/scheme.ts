export interface BrowsableQual {
  qualification_id: string
  exam_board: string
}

export interface Scheme {
  id: string
  profile_id: string
  qualification_id: string
  exam_board: string
  name: string
  academic_year: string
  browsable_qualifications: BrowsableQual[]
  created_at: string
  updated_at: string
}

export interface SchemeTopic {
  id: string
  scheme_id: string
  week_start: number
  week_end: number
  topic_ref: string | null
  topic_label: string | null
  position: number
  worksheets?: SchemeTopicWorksheet[]
}

export interface SchemeTopicWorksheet {
  id: string
  scheme_topic_id: string
  worksheet_id: string
  position: number
  title?: string
  topic?: string
}

export interface RecallCheckin {
  id: string
  scheme_id: string
  profile_id: string
  at_week: number
  marks_target: number
  worksheet_id: string | null
  source_worksheet_ids: string[]
  created_at: string
}
