export interface BlockAnnotation {
  id: string
  worksheet_id: string
  block_id: string
  block_type: string
  original_block: unknown | null
  final_block: unknown
  annotation: string
  created_at: string
  updated_at: string
  insight?: AnnotationInsight
}

export interface AnnotationInsight {
  id: string
  block_annotation_id: string
  insight_text: string
  teacher_rating: -1 | 1 | null
  teacher_comment: string | null
  created_at: string
}
