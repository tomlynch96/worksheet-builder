export interface BlockAnnotation {
  id: string
  worksheet_id: string
  block_id: string
  block_type: string
  original_block: unknown | null
  final_block: unknown
  annotation: string
  change_summary: string
  created_at: string
  updated_at: string
}
